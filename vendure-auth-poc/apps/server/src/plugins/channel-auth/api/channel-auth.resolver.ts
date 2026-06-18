import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Ctx, Allow, Permission, RequestContext, Transaction } from '@vendure/core';

import { ChannelAuthService } from '../services/channel-auth.service';

@Resolver()
export class ChannelAuthResolver {
    constructor(private channelAuthService: ChannelAuthService) {}

    @Mutation()
    @Transaction()
    @Allow(Permission.Public)
    async channelRegisterCustomer(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: { emailAddress: string; password: string; firstName?: string; lastName?: string } },
    ) {
        return this.channelAuthService.register(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Public)
    async channelVerifyEmail(
        @Ctx() ctx: RequestContext,
        @Args() args: { token: string },
    ) {
        return this.channelAuthService.verifyEmail(ctx, args.token);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Public)
    async channelRequestPasswordReset(
        @Ctx() ctx: RequestContext,
        @Args() args: { emailAddress: string },
    ) {
        return this.channelAuthService.requestPasswordReset(ctx, args.emailAddress);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Public)
    async channelResetPassword(
        @Ctx() ctx: RequestContext,
        @Args() args: { token: string; newPassword: string },
    ) {
        return this.channelAuthService.resetPassword(ctx, args.token, args.newPassword);
    }
}
