import { CheckCircle2Icon } from 'lucide-react';
import { api, useQuery } from '@vendure/dashboard';
import { getOrderApprovedByQuery } from './graphql';

interface OrderApprovedByProps {
    context: {
        entity?: any;
    };
}

export function OrderApprovedBy({ context }: OrderApprovedByProps) {
    const order = context.entity;
    const { data } = useQuery({
        queryKey: ['order-approved-by', order?.id],
        queryFn: () => api.query(getOrderApprovedByQuery, { id: order?.id }),
        enabled: !!order?.id,
    });
    const approvedBy = data?.order?.customFields?.approvedBy;
    if (!approvedBy) {
        return null;
    }
    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold">Approval</h3>
            <div className="flex items-center gap-2 text-sm">
                <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                <span>
                    Approved by {approvedBy}
                </span>
            </div>
        </div>
    );
}
