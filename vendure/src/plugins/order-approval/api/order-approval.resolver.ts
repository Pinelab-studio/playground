import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    ID,
    Logger,
    Order,
    OrderService,
    Permission,
    RequestContext,
    Transaction,
} from '@vendure/core';

import { loggerCtx } from '../constants';

@Resolver()
export class OrderApprovalAdminResolver {
    constructor(private orderService: OrderService) {}

    @Transaction()
    @Mutation()
    @Allow(Permission.UpdateOrder)
    async approveOrder(
        @Ctx() ctx: RequestContext,
        @Args('orderId') orderId: ID,
    ): Promise<Order> {
        // The approver is taken from the current session user, never from the client.
        const approvedBy = ctx.session?.user?.identifier ?? 'unknown';
        Logger.info(`Order ${orderId} approved by ${approvedBy}`, loggerCtx);
        return this.orderService.updateCustomFields(ctx, orderId, { approvedBy });
    }
}
