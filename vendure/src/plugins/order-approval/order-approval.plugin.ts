import { LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';

import { adminApiExtensions } from './api/api-extensions';
import { OrderApprovalAdminResolver } from './api/order-approval.resolver';

/**
 * Adds a single `approvedBy` custom field to the Order entity, which stores the
 * identifier of the administrator who approved the order. The field is exposed as
 * a standard custom field in the dashboard (read-only, since it is set by the
 * `approveOrder` mutation rather than edited by hand).
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [OrderApprovalAdminResolver],
    },
    // dashboard: './dashboard/index.tsx',
    configuration: config => {
        config.customFields.Order = [
            ...(config.customFields.Order ?? []),
            {
                name: 'approvedBy',
                type: 'string',
                nullable: true,
                internal: false,
                label: [{ languageCode: LanguageCode.en, value: 'Approved by' }],
                ui: {dashboard: false}
            },
        ];
        return config;
    },
})
export class OrderApprovalPlugin {}

declare module '@vendure/core' {
    interface CustomOrderFields {
        approvedBy: string | null;
    }
}
