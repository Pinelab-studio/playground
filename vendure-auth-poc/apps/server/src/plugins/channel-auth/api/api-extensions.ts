import gql from 'graphql-tag';

export const shopApiExtensions = gql`
    input ChannelRegisterInput {
        emailAddress: String!
        password: String!
        firstName: String
        lastName: String
    }

    type ChannelAuthResult {
        success: Boolean!
        message: String
        verificationToken: String
        resetToken: String
    }

    extend type Mutation {
        channelRegisterCustomer(input: ChannelRegisterInput!): ChannelAuthResult!
        channelVerifyEmail(token: String!): ChannelAuthResult!
        channelRequestPasswordReset(emailAddress: String!): ChannelAuthResult!
        channelResetPassword(token: String!, newPassword: String!): ChannelAuthResult!
    }
`;
