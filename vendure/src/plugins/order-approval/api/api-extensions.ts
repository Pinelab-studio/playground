import { gql } from 'graphql-tag';

export const adminApiExtensions = gql`
    extend type Mutation {
        """
        Marks the given Order as approved by storing the identifier of the
        currently logged-in user in the \`approvedBy\` custom field.
        The approver is derived from the request context (ctx.session.user),
        so it is intentionally NOT passed as an argument.
        """
        approveOrder(orderId: ID!): Order!
    }
`;
