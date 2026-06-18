import {
    AuthenticationStrategy,
    Injector,
    RequestContext,
    TransactionalConnection,
    User,
    Logger,
    BcryptPasswordHashingStrategy,
    ListQueryBuilder,
} from '@vendure/core';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

import { ChannelCredential } from '../entities/channel-credential.entity';
import { loggerCtx } from '../constants';

export interface ChannelCredentialsData {
    username: string;
    password: string;
}

export class ChannelAuthenticationStrategy
    implements AuthenticationStrategy<ChannelCredentialsData>
{
    readonly name = 'channel_credentials';
    private connection: TransactionalConnection;
    private listQueryBuilder: ListQueryBuilder;
    private passwordHashingStrategy = new BcryptPasswordHashingStrategy();

    init(injector: Injector) {
        this.connection = injector.get(TransactionalConnection);
        this.listQueryBuilder = injector.get(ListQueryBuilder);
    }

    defineInputType(): DocumentNode {
        return gql`
            input ChannelCredentialsInput {
                username: String!
                password: String!
            }
        `;
    }

    async authenticate(
        ctx: RequestContext,
        data: ChannelCredentialsData,
    ): Promise<User | false> {
        const user = await this.connection.getRepository(ctx, User).findOne({
            where: { identifier: data.username },
        });

        if (!user) {
            Logger.verbose(`User not found: ${data.username}`, loggerCtx);
            return false;
        }

        const [credentials] = await this.listQueryBuilder
            .build(ChannelCredential, {}, {
                ctx,
                where: { userId: user.id },
                channelId: ctx.channelId,
            })
            .getManyAndCount();

        const credential = credentials[0];

        if (!credential) {
            Logger.verbose(
                `No credential for user ${data.username} in channel ${ctx.channelId}`,
                loggerCtx,
            );
            return false;
        }

        if (!credential.verified) {
            Logger.verbose(
                `Unverified credential for user ${data.username} in channel ${ctx.channelId}`,
                loggerCtx,
            );
            return false;
        }

        const passwordMatch = await this.passwordHashingStrategy.check(
            data.password,
            credential.passwordHash,
        );
        if (!passwordMatch) {
            Logger.verbose(
                `Password mismatch for user ${data.username} in channel ${ctx.channelId}`,
                loggerCtx,
            );
            return false;
        }

        return user;
    }
}
