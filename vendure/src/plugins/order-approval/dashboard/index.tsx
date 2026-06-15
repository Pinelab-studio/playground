import {
    api,
    Button,
    defineDashboardExtension,
    PermissionGuard,
    toast,
    useMutation,
    useQueryClient,
} from '@vendure/dashboard';
import { graphql } from '@/gql';
import { CheckCircle2Icon, CheckIcon } from 'lucide-react';

const approveOrderMutation = graphql(`
    mutation ApproveOrder($orderId: ID!) {
        approveOrder(orderId: $orderId) {
            id
            customFields {
                approvedBy
            }
        }
    }
`);

function isApproved(entity: any): boolean {
    return Boolean(entity?.customFields?.approvedBy);
}

defineDashboardExtension({
    // "Approve" button in the order detail action bar.
    // Only shown while the order has NOT yet been approved.
    actionBarItems: [
        {
            pageId: 'order-detail',
            component: ({ context }) => {
                const order = context.entity;
                const queryClient = useQueryClient();
                const mutation = useMutation({
                    mutationFn: () => api.mutate(approveOrderMutation, { orderId: order.id }),
                    onSuccess: () => {
                        // Refresh the order detail so the button hides and the
                        // "Approved by" block appears.
                        queryClient.invalidateQueries();
                        toast.success('Order approved');
                    },
                    onError: error => {
                        toast.error('Failed to approve order', { description: error.message });
                    },
                });

                if (isApproved(order)) {
                    return null;
                }

                return (
                    <PermissionGuard requires={['UpdateOrder']}>
                        <Button
                            variant="default"
                            onClick={() => mutation.mutate()}
                            disabled={!order || mutation.isPending}
                        >
                            <CheckIcon className="mr-2 h-4 w-4" />
                            {mutation.isPending ? 'Approving...' : 'Approve'}
                        </Button>
                    </PermissionGuard>
                );
            },
        },
    ],
    // Block shown below the order summary, only once the order is approved.
    pageBlocks: [
        {
            id: 'order-approved-by',
            title: 'Approval',
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
            shouldRender: context => isApproved(context.entity),
            component: ({ context }) => {
                const approvedBy = context.entity?.customFields?.approvedBy;
                return (
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                        <span>
                            Approved by <strong>{approvedBy}</strong>
                        </span>
                    </div>
                );
            },
        },
    ],
});
