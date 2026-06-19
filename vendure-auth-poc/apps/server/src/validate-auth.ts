/**
 * Validation script for channel-aware authentication.
 * Run this AFTER the server is running and test data is seeded.
 *
 * Usage: npx ts-node src/validate-auth.ts
 */

const SHOP_API_URL = 'http://localhost:3000/shop-api';

interface AuthResult {
    data?: {
        authenticate: {
            __typename: string;
            id?: string;
            identifier?: string;
            errorCode?: string;
            message?: string;
        };
    };
    errors?: Array<{ message: string }>;
}

async function authenticate(
    channel: string,
    username: string,
    password: string,
): Promise<AuthResult> {
    const response = await fetch(SHOP_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'vendure-token': channel,
        },
        body: JSON.stringify({
            query: `
                mutation Login($input: AuthenticationInput!) {
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
            `,
            variables: {
                input: {
                    channel_credentials: { username, password },
                },
            },
        }),
    });
    return response.json() as Promise<AuthResult>;
}

async function runTests() {
    console.log('=== Channel-Aware Authentication Validation ===\n');
    let passed = 0;
    let failed = 0;

    // Test 1: Correct password for Channel 1
    console.log('Test 1: Login to Channel 1 with correct password (12345)');
    const result1 = await authenticate('channel-1', 'test@example.com', '12345');
    if (result1.data?.authenticate?.__typename === 'CurrentUser') {
        console.log('  PASS - Logged in as:', result1.data.authenticate.identifier);
        passed++;
    } else {
        console.log('  FAIL -', JSON.stringify(result1));
        failed++;
    }

    // Test 2: Correct password for Channel 2
    console.log('\nTest 2: Login to Channel 2 with correct password (abcdef)');
    const result2 = await authenticate('channel-2', 'test@example.com', 'abcdef');
    if (result2.data?.authenticate?.__typename === 'CurrentUser') {
        console.log('  PASS - Logged in as:', result2.data.authenticate.identifier);
        passed++;
    } else {
        console.log('  FAIL -', JSON.stringify(result2));
        failed++;
    }

    // Test 3: Wrong password for Channel 1 (using Channel 2's password)
    console.log('\nTest 3: Login to Channel 1 with Channel 2 password (abcdef) - should FAIL');
    const result3 = await authenticate('channel-1', 'test@example.com', 'abcdef');
    if (result3.data?.authenticate?.__typename === 'InvalidCredentialsError') {
        console.log('  PASS - Correctly rejected:', result3.data.authenticate.message);
        passed++;
    } else {
        console.log('  FAIL - Should have been rejected:', JSON.stringify(result3));
        failed++;
    }

    // Test 4: Wrong password for Channel 2 (using Channel 1's password)
    console.log('\nTest 4: Login to Channel 2 with Channel 1 password (12345) - should FAIL');
    const result4 = await authenticate('channel-2', 'test@example.com', '12345');
    if (result4.data?.authenticate?.__typename === 'InvalidCredentialsError') {
        console.log('  PASS - Correctly rejected:', result4.data.authenticate.message);
        passed++;
    } else {
        console.log('  FAIL - Should have been rejected:', JSON.stringify(result4));
        failed++;
    }

    // Test 5: Non-existent user
    console.log('\nTest 5: Login with non-existent user - should FAIL');
    const result5 = await authenticate('channel-1', 'nobody@example.com', '12345');
    if (result5.data?.authenticate?.__typename === 'InvalidCredentialsError') {
        console.log('  PASS - Correctly rejected:', result5.data.authenticate.message);
        passed++;
    } else {
        console.log('  FAIL - Should have been rejected:', JSON.stringify(result5));
        failed++;
    }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Validation script error:', err);
    process.exit(1);
});
