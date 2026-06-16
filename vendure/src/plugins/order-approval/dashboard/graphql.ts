import { graphql } from '@/gql';

export const approveOrderMutation = graphql(`
    mutation ApproveOrder($orderId: ID!) {
        approveOrder(orderId: $orderId) {
            id
            customFields {
                approvedBy
            }
        }
    }
`);

export const getOrderApprovedByQuery = graphql(`
    query GetOrderApprovedBy($id: ID!) {
        order(id: $id) {
            id
            customFields {
                approvedBy
            }
        }
    }
`);
