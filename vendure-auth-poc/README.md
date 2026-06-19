# Vendure Channel-Aware Auth PoC

Separate customer passwords per channel using a custom `AuthenticationStrategy` + channel-aware entity. No core service overrides.

## How it works

- `ChannelCredential` entity stores a bcrypt hash per (User, Channel) pair.
- `ChannelAuthenticationStrategy` finds the credential for `ctx.channelId` and verifies the password.
- Custom mutations (`channelRegisterCustomer`, `channelRequestPasswordReset`, `channelResetPassword`) replace the native registration/auth flow on the Shop API.
- Native auth strategy is removed from Shop API but kept on Admin API (dashboard login still works).

## Setup

```bash
npm install
npm run dev:server     # starts server (synchronize: true creates tables)
npm run seed:test-data # seeds channels + test customer (stop server first)
npm run dev:server     # restart
npm run validate:auth  # runs auth validation script
```

## Test data

| Email            | Channel   | Token     | Password |
| ---------------- | --------- | --------- | -------- |
| test@example.com | channel-1 | channel-1 | 12345    |
| test@example.com | channel-2 | channel-2 | abcdef   |

## Manual testing (GraphQL)

```graphql
# Header: vendure-token: channel-1
mutation {
  authenticate(
    input: {
      channel_credentials: { username: "test@example.com", password: "12345" }
    }
  ) {
    ... on CurrentUser {
      id
      identifier
    }
    ... on InvalidCredentialsError {
      errorCode
      message
    }
  }
}
```

Using channel-2's token with channel-1's password should return `InvalidCredentialsError`.

## Limitations

- Native shop mutations (`registerCustomerAccount`, `login`, etc.) are disabled -- frontend must use the custom mutations.
- Verification/reset tokens are returned in responses (no email delivery wired up for now).
