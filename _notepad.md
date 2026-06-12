# Workshop 2 — TODO List (Highest Priority First)

## P1 — Must Do

- [ ] **Shift the entire focus from requirements gathering to hands-on technical trust-building**
  - The main goal of this workshop is technical reassurance and confidence in the platform
- [ ] **Have everyone set up and run a local Vendure environment during the workshop**
  - Walk through the code together step by step
- [ ] **Proactively address the maturity/stability concerns raised after Workshop 1**
  - Acknowledge the pricing-call overhead during certain user actions
  - Acknowledge that TypeORM migrations currently run manually (not via CI/CD by default)
  - Be transparent about these limitations and explain the roadmap or workarounds
- [ ] **Show real production projects — not standard demos**
  - Custom screens, extra fields, custom workflows, B2B features
  - Concrete business processes integrated into Vendure by actual customers
  - All shown via the **React Admin UI only**

## P2 — Should Do

- [ ] **Avoid the Angular Admin UI entirely**
  - Only demonstrate the React Admin UI to avoid the impression that the product is unfinished
  - Show how actively the platform is evolving and what is already possible in the React Admin UI
- [ ] **Make it hands-on: build small proof-of-concepts together during the session**
- [ ] **Demonstrate how to build a plugin from scratch**
- [ ] **Show a concrete example of implementing or modifying a strategy**
- [ ] **Show how easily the React Admin UI can be extended**
- [ ] **Go deeper into architectural choices and explain *why* things are designed as they are**

## P3 — Good to Do

- [ ] **Build a concrete proof-of-concept: one customer, multiple accounts in different countries, same email address**
  - Directly relevant to the IPCOM context
  - Shows how flexibly Vendure can be extended
- [ ] **Explicitly highlight B2B capabilities and how other B2B clients use them**
  - Counter the perception that Vendure is only B2C-oriented
- [ ] **Include a segment on Vendure Platform if you have hands-on experience and concrete examples**


# New Workshop 2

## Show and tell

### Vendure 

* Vendure has been around since 2018 and is actively maintained (images)
* Serious marketplaces and B2B customers are using Vendure in production, and have been for a few years already: 
  * https://vendure.io/case-studies/munch-food-waste-platform-thousands-daily-transactions
  * https://vendure.io/case-studies/hemglass-unified-28-franchisees-with-seamless-click-collect
* Vendure is positioning itself as a B2B framework: https://vendure.io/case-studies/hemglass-unified-28-franchisees-with-seamless-click-collect
  * Its tech stack is focused on extensibility and scale, which in my opinion is not inherently B2C-oriented
* Pinelab's own clients are much smaller than this project, in the range of €2M - €5M a year.
* We have assisted with much larger projects, but I hope you understand that I cannot use any of that in workshops. An anonymized example:
  * A Benelux pharmaceutical supplier is building their multi-tenant solution with Vendure:
     * All master data for all pharmacies comes from one central PIM. Each of the pharmacies 'picks' products from this master data.
     * They have over 1800 channels, and each channel represents a physical pharmacy

### TypeORM migration