import {
    api,
    Button,
    PermissionGuard,
    toast,
    useMutation,
    useQuery,
    useQueryClient,
} from '@vendure/dashboard';
import { CheckIcon } from 'lucide-react';
import { approveOrderMutation, getOrderApprovedByQuery } from './graphql';

interface OrderApproveButtonProps {
    context: {
        entity: any;
    };
}

export function OrderApproveButton({ context }: OrderApproveButtonProps) {
    const order = context.entity;
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: ['order-approved-by', order.id],
        queryFn: () => api.query(getOrderApprovedByQuery, { id: order.id }),
        enabled: !!order.id,
    });
    const approvedBy = data?.order?.customFields?.approvedBy;
    const mutation = useMutation({
        mutationFn: () => api.mutate(approveOrderMutation, { orderId: order.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order-approved-by', order.id] });
            toast.success('Order approved');
        },
        onError: error => {
            toast.error('Failed to approve order', { description: error.message });
        },
    });

    if (approvedBy) {
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
}
