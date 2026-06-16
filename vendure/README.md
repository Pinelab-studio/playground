# Vendure

This is a standard Vendure project created with `npx @vendure/create`. See the official guide for more information: https://docs.vendure.io/current/core/getting-started/installationhttps://docs.vendure.io/current/core/getting-started/installation

1. `npm ci`
2. `npx vite build`
3. `npm run dev`
4. http://localhost:3000/dashboard/
5. Sanity check: Trigger reindex on catalog page, then check system > Job Queue to see most recently processed message.

# 1. Generating a migration

* Set `synchronize: false` in the Vendure-config.
* Enable the custom field in `custom-fields.ts`
* Start the server and view a variant in dashboard `http://localhost:3000/dashboard/product-variants/1`
* Generate a migration `npx vendure migrate`
* Review and run the migration: `npx vendure migrate`
* Fill out some sample data in the meta description of a product.
* Change the type to `text` and generate a migration
* Change the type to `localeString` and generate a migration

(Caveat: SQLite behaves different than fully SQL compliant DB's)

## CI/CD workflow example

* Introduce a new custom field
* Generate a migration
* Review the migration
* Commit and push so that its part of your Pull Request.

Treat migration files as if they were code changes: you should always have a human-in-the-loop.

Or even further automated:
* Create PR with a new custom field
* CI automations detect new custom field, generates a migration and adds it to the PR
* Review generated migration in the PR

# 2. Creating a new channel in Vendure

1. Create 2 extra channels
2. Create a product in channel A
3. Switch to channel B and create another prodduct.
4. Switch to the default channel.
5. Select a product, and assign it to the other channel, so that it is 2 channels.
6. Change the price and name of the shared product, and view it in the other channel.

# 3. Pricing strategies (List price and order based pricing)

1. Activate the plugin
2. Use the curl commands below to trigger each of the pricing strategies
3. Implement a cache using `RequestContextCacheService`.

cURL request to fetch a product
```bash
curl -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -d '{"query": "query { product(id: 1) { id name variants { id sku priceWithTax currencyCode } } }"}' | jq
```

cURL request to add item to order:

```bash
curl -c /tmp/vendure-cookies.txt -b /tmp/vendure-cookies.txt -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { addItemToOrder(productVariantId: 1, quantity: 1) { ... on Order { id lines { id linePriceWithTax productVariant { id sku } } } ... on ErrorResult { errorCode message } } }"}' | jq
```

> The `-c /tmp/vendure-cookies.txt -b /tmp/vendure-cookies.txt` preserves the session cookie so the order is tracked across requests. Alternatively you can use a client like Yaak or Postman.

(Note to Martijn: Vendure does not know the price will be the same. Custom strategy could change the active tax zone. That is why caching is left to the consumer of the strategy).


# 3. React Dashboard component

1. Enable dashboard extension of the approval plugin
2. `npx vite build`
3. `npm run dev`
4. Go to the order detail and approve it.
5. Extend the plugin with an `approvedAt` field.

# 4. AI Feature (if we have time)

Any requests?

