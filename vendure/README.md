# Vendure

1. `npm ci`
2. `npx vite build`
3. `npm run dev`
4. http://localhost:3000/dashboard/
5. Sanity check: Trigger reindex on catalog page, then check system > Job Queue to see most recently processed message.

* Add the Vendure MCP to your AI
```json
{
  "mcpServers": {
    "vendure-docs": {
      "url": "https://docs.vendure.io/mcp"
    }
  }
}
```

Or alternatively reference the llms.txt in your prompt `https://docs.vendure.io/llms.txt`.

# 1. Generating a migration

* Comment out the existing custom field in `custom-fields.ts`
* Start the server and view a variant in dashboard `http://localhost:3000/dashboard/product-variants/1`
* Generate a migration `npx vendure migrate`
* Review and run the migration: `npx vendure migrate`
* Fill out some sample data in a product.
* Change the type to `text` and generate a migration
* Change the type to `localeString` and generate a migration

(Caveat: SQLite behaves different than fully SQL compliant DB's)

## CI/CD workflow example

* Introduce a new custom field
* Generate a migration
* Review the migration
* Commit and push and make part of your Pull Request.

Treat migration files as if they were code changes: you should always have a human-in-the-loop.

Or even further automated:
* Create PR with a new custom field
* CI automations detect new custom field, generates a migration and adds it to the PR
* Review generated migration in the PR

# 2. Creating a new channel in Vendure

// TODO Customer entity modification

// 

# 3. Pricing strategies (List price and order based pricing)

// TODO describe cases and insights in how ofter both are called: listprice vs order item price

// TODO describe use of requestContextCache (needed?)

// Include CURL request to fetch pricing from variant
// Include CURL request to check pricing with add-to-cart strategy

# 3. React Dashboard component

// Describe creating a complex component overrid: 

