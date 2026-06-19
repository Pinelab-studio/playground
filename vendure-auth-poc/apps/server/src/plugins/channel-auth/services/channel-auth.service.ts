import { Injectable } from '@nestjs/common';
import {
    RequestContext,
    TransactionalConnection,
    User,
    CustomerService,
    ChannelService,
    Logger,
    BcryptPasswordHashingStrategy,
    ListQueryBuilder,
} from '@vendure/core';
import crypto from 'crypto';

import { ChannelCredential } from '../entities/channel-credential.entity';
import { loggerCtx } from '../constants';

@Injectable()
export class ChannelAuthService {
    private passwordHashingStrategy = new BcryptPasswordHashingStrategy();

    constructor(
        private connection: TransactionalConnection,
        private customerService: CustomerService,
        private channelService: ChannelService,
        private listQueryBuilder: ListQueryBuilder,
    ) {}

    async register(
        ctx: RequestContext,
        input: {
            emailAddress: string;
            password: string;
            firstName?: string;
            lastName?: string;
        },
    ): Promise<{ success: boolean; message: string; verificationToken?: string }> {
        const { emailAddress, password, firstName, lastName } = input;

        const existingCredential = await this.findCredentialByEmail(ctx, emailAddress);
        if (existingCredential) {
            return {
                success: false,
                message: 'A credential already exists for this email in the current channel.',
            };
        }

        let user = await this.connection.getRepository(ctx, User).findOne({
            where: { identifier: emailAddress },
        });

        if (!user) {
            const customer = await this.customerService.create(ctx, {
                emailAddress,
                firstName: firstName || '',
                lastName: lastName || '',
            });
            if ('message' in customer) {
                return { success: false, message: 'Failed to create customer account.' };
            }
            user = await this.connection.getRepository(ctx, User).findOne({
                where: { identifier: emailAddress },
            });
            if (!user) {
                return { success: false, message: 'Failed to create user.' };
            }
        } else {
            const customer = await this.customerService.findOneByUserId(ctx, user.id, false);
            if (customer) {
                await this.channelService.assignToCurrentChannel(customer, ctx);
                await this.connection.getRepository(ctx, customer.constructor as any).save(customer);
            }
        }

        const passwordHash = await this.passwordHashingStrategy.hash(password);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const credential = new ChannelCredential({
            userId: user.id,
            passwordHash,
            verificationToken,
            verified: true,
        });
        await this.channelService.assignToCurrentChannel(credential, ctx);
        await this.connection.getRepository(ctx, ChannelCredential).save(credential);

        // Auto-verify the User so Vendure's core auth check passes
        if (!user.verified) {
            user.verified = true;
            await this.connection.getRepository(ctx, User).save(user);
        }

        Logger.info(`Registered credential for ${emailAddress} in channel ${ctx.channelId}`, loggerCtx);

        return {
            success: true,
            message: 'Registration successful. You can now sign in.',
            verificationToken,
        };
    }

    async verifyEmail(
        ctx: RequestContext,
        token: string,
    ): Promise<{ success: boolean; message: string }> {
        const [credentials] = await this.listQueryBuilder
            .build(ChannelCredential, {}, {
                ctx,
                where: { verificationToken: token },
                channelId: ctx.channelId,
            })
            .getManyAndCount();

        const credential = credentials[0];
        if (!credential) {
            return { success: false, message: 'Invalid or expired verification token.' };
        }

        credential.verified = true;
        credential.verificationToken = null;
        await this.connection.getRepository(ctx, ChannelCredential).save(credential);

        // Also mark the User as verified so Vendure's core auth check passes
        const user = await this.connection.getRepository(ctx, User).findOne({
            where: { id: credential.userId },
        });
        if (user && !user.verified) {
            user.verified = true;
            await this.connection.getRepository(ctx, User).save(user);
        }

        Logger.info(`Email verified for user ${credential.userId} in channel ${ctx.channelId}`, loggerCtx);
        return { success: true, message: 'Email verified successfully.' };
    }

    async requestPasswordReset(
        ctx: RequestContext,
        emailAddress: string,
    ): Promise<{ success: boolean; message: string; resetToken?: string }> {
        const credential = await this.findCredentialByEmail(ctx, emailAddress);
        if (!credential) {
            return { success: true, message: 'If that email exists, a reset link has been sent.' };
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        credential.passwordResetToken = resetToken;
        await this.connection.getRepository(ctx, ChannelCredential).save(credential);

        Logger.info(`Password reset requested for ${emailAddress} in channel ${ctx.channelId}`, loggerCtx);
        return {
            success: true,
            message: 'If that email exists, a reset link has been sent.',
            resetToken,
        };
    }

    async resetPassword(
        ctx: RequestContext,
        token: string,
        newPassword: string,
    ): Promise<{ success: boolean; message: string }> {
        const [credentials] = await this.listQueryBuilder
            .build(ChannelCredential, {}, {
                ctx,
                where: { passwordResetToken: token },
                channelId: ctx.channelId,
            })
            .getManyAndCount();

        const credential = credentials[0];
        if (!credential) {
            return { success: false, message: 'Invalid or expired reset token.' };
        }

        credential.passwordHash = await this.passwordHashingStrategy.hash(newPassword);
        credential.passwordResetToken = null;
        await this.connection.getRepository(ctx, ChannelCredential).save(credential);

        Logger.info(`Password reset for user ${credential.userId} in channel ${ctx.channelId}`, loggerCtx);
        return { success: true, message: 'Password reset successfully.' };
    }

    private async findCredentialByEmail(
        ctx: RequestContext,
        emailAddress: string,
    ): Promise<ChannelCredential | null> {
        const user = await this.connection.getRepository(ctx, User).findOne({
            where: { identifier: emailAddress },
        });
        if (!user) {
            return null;
        }
        const [credentials] = await this.listQueryBuilder
            .build(ChannelCredential, {}, {
                ctx,
                where: { userId: user.id },
                channelId: ctx.channelId,
            })
            .getManyAndCount();

        return credentials[0] || null;
    }
}
