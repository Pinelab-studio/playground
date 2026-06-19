import { getAuthToken } from '@/lib/auth';

const VENDURE_API_URL = process.env.VENDURE_SHOP_API_URL || process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL;
const VENDURE_CHANNEL_TOKEN = process.env.VENDURE_CHANNEL_TOKEN || process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN || '__default_channel__';
const VENDURE_AUTH_TOKEN_HEADER = process.env.VENDURE_AUTH_TOKEN_HEADER || 'vendure-auth-token';

interface GqlResponse<T = any> {
    data?: T;
    errors?: Array<{ message: string }>;
}

async function gqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<{ data: T; token?: string }> {
    const authToken = await getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'vendure-token': VENDURE_CHANNEL_TOKEN,
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(VENDURE_API_URL!, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
    });

    const result: GqlResponse<T> = await response.json();
    if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
    }
    if (!result.data) {
        throw new Error('No data returned from Vendure API');
    }

    const newToken = response.headers.get(VENDURE_AUTH_TOKEN_HEADER);
    return { data: result.data, ...(newToken && { token: newToken }) };
}

export async function channelAuthenticate(username: string, password: string) {
    return gqlRequest<{
        authenticate: {
            __typename: string;
            id?: string;
            identifier?: string;
            errorCode?: string;
            message?: string;
        };
    }>(`
        mutation Authenticate($input: AuthenticationInput!) {
            authenticate(input: $input) {
                __typename
                ... on CurrentUser {
                    id
                    identifier
                }
                ... on InvalidCredentialsError {
                    errorCode
                    message
                }
                ... on NotVerifiedError {
                    errorCode
                    message
                }
            }
        }
    `, {
        input: {
            channel_credentials: { username, password },
        },
    });
}

export async function channelRegister(input: {
    emailAddress: string;
    password: string;
    firstName?: string;
    lastName?: string;
}) {
    return gqlRequest<{
        channelRegisterCustomer: {
            success: boolean;
            message?: string;
            verificationToken?: string;
        };
    }>(`
        mutation ChannelRegister($input: ChannelRegisterInput!) {
            channelRegisterCustomer(input: $input) {
                success
                message
                verificationToken
            }
        }
    `, { input });
}

export async function channelVerifyEmail(token: string) {
    return gqlRequest<{
        channelVerifyEmail: {
            success: boolean;
            message?: string;
        };
    }>(`
        mutation ChannelVerifyEmail($token: String!) {
            channelVerifyEmail(token: $token) {
                success
                message
            }
        }
    `, { token });
}

export async function channelRequestPasswordReset(emailAddress: string) {
    return gqlRequest<{
        channelRequestPasswordReset: {
            success: boolean;
            message?: string;
            resetToken?: string;
        };
    }>(`
        mutation ChannelRequestPasswordReset($emailAddress: String!) {
            channelRequestPasswordReset(emailAddress: $emailAddress) {
                success
                message
                resetToken
            }
        }
    `, { emailAddress });
}

export async function channelResetPassword(token: string, newPassword: string) {
    return gqlRequest<{
        channelResetPassword: {
            success: boolean;
            message?: string;
        };
    }>(`
        mutation ChannelResetPassword($token: String!, $newPassword: String!) {
            channelResetPassword(token: $token, newPassword: $newPassword) {
                success
                message
            }
        }
    `, { token, newPassword });
}
