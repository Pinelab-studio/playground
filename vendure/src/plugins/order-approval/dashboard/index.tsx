import { defineDashboardExtension } from '@vendure/dashboard';
import { OrderApproveButton } from './OrderApproveButton';
import { OrderApprovedBy } from './OrderApprovedBy';

defineDashboardExtension({
    // "Approve" button in the order detail action bar.
    // Only shown while the order has NOT yet been approved.
    actionBarItems: [
        {
            pageId: 'order-detail',
            component: OrderApproveButton,
        },
    ],
    // Block shown below the order summary, only once the order is approved.
    pageBlocks: [
        {
            id: 'order-approved-by',
            location: {
                pageId: 'order-detail',
                column: 'main',
                position: {
                    // The order summary / line items table. Use Dev Mode in the
                    // dashboard to confirm/adjust this blockId if needed.
                    blockId: 'order-table',
                    order: 'after',
                },
            },
            component: OrderApprovedBy,
        },
    ],
});
