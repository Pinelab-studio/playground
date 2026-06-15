import fs from 'fs';
import path from 'path';

import { INestApplication } from '@nestjs/common';
import {
    Customer,
    CustomerService,
    InitialData,
    Logger,
    OrderService,
    ProductService,
    ProductVariantService,
    RequestContext,
    RequestContextService,
    TransactionalConnection,
} from '@vendure/core';
import { importProductsFromCsv, populateCollections, populateInitialData } from '@vendure/core/cli';

const loggerCtx = 'DemoData';

const initialDataPath = path.join(__dirname, 'initial-data.json');
const productsCsvPath = path.join(__dirname, 'products.csv');

const DEMO_CUSTOMER_EMAIL = 'demo.customer@example.com';

/**
 * ⚠️ DEMO ONLY ⚠️
 * Everything in this file is for setting up demo data right after the server
 * boots. This gives the dashboard realistic data to work with during
 * demos/workshops. Remove the call to `setupDemoData` from `index.ts` for
 * production.
 *
 * The whole flow is safe to run on every startup:
 *  - seeding is skipped if products already exist,
 *  - the demo customer is only created once,
 *  - the demo order is skipped if a placed order already exists, and
 *  - any error is caught and logged so it can never crash the bootstrap.
 */
export async function setupDemoData(app: INestApplication): Promise<void> {
    try {
        const requestContextService = app.get(RequestContextService);
        // A RequestContext is required for all service calls. With no channel
        // specified it defaults to the default channel.
        const ctx = await requestContextService.create({ apiType: 'admin' });

        await seedInitialDataIfEmpty(app, ctx);
        const customer = await ensureDemoCustomer(app, ctx);
        await createDemoPlacedOrder(app, ctx, customer);
    } catch (e: any) {
        Logger.error(`Failed to set up demo data: ${e.message}`, loggerCtx, e.stack);
    }
}

/**
 * Reuses Vendure's built-in seed logic (the same helpers used internally by
 * `populate()` from `@vendure/core/cli`) to populate the default zone, countries,
 * tax rates, shipping methods, payment methods, roles, products (from the bundled
 * CSV) and collections.
 *
 * Idempotency guard: the seed only runs when no products exist yet, so repeated
 * server restarts won't duplicate the demo data.
 */
async function seedInitialDataIfEmpty(app: INestApplication, ctx: RequestContext): Promise<void> {
    const productService = app.get(ProductService);
    const existingProducts = await productService.findAll(ctx, { take: 1 });
    if (existingProducts.totalItems > 0) {
        Logger.info('Products already exist — skipping demo seed.', loggerCtx);
        return;
    }

    const initialData: InitialData = JSON.parse(fs.readFileSync(initialDataPath, 'utf-8'));

    Logger.info('Seeding demo data (initial data, products, collections)...', loggerCtx);
    await populateInitialData(app, initialData);
    await importProductsFromCsv(app, productsCsvPath, initialData.defaultLanguage);
    // Collections must be populated *after* products, otherwise the FacetValues
    // they filter on won't exist yet.
    await populateCollections(app, initialData);
    Logger.info('Demo data seeding complete.', loggerCtx);
}

/**
 * Ensures a single made-up demo customer exists. The built-in Vendure seed does
 * not create customers, so we create one here. Idempotent: looks the customer up
 * by email first and tolerates an email-conflict result from `create`.
 */
async function ensureDemoCustomer(app: INestApplication, ctx: RequestContext): Promise<Customer> {
    const customerService = app.get(CustomerService);

    const existing = (
        await customerService.findAll(ctx, {
            filter: { emailAddress: { eq: DEMO_CUSTOMER_EMAIL } },
            take: 1,
        })
    ).items[0];
    if (existing) {
        return existing;
    }

    const result = await customerService.create(ctx, {
        firstName: 'Demo',
        lastName: 'Customer',
        emailAddress: DEMO_CUSTOMER_EMAIL,
    });

    if (isErrorResult(result)) {
        // e.g. an email conflict from a race — fall back to a lookup.
        Logger.warn(`Could not create demo customer: ${result.message}`, loggerCtx);
        const fallback = (
            await customerService.findAll(ctx, {
                filter: { emailAddress: { eq: DEMO_CUSTOMER_EMAIL } },
                take: 1,
            })
        ).items[0];
        if (!fallback) {
            throw new Error('Demo customer could not be created or found.');
        }
        return fallback;
    }

    Logger.info(`Created demo customer ${DEMO_CUSTOMER_EMAIL}.`, loggerCtx);
    return result;
}

/**
 * Creates one fully placed order (state `PaymentSettled`) in the default channel.
 * It reuses the seeded data: the first product variant, the first eligible
 * shipping method, and the `standard-payment` payment method (the built-in dummy
 * payment handler). Idempotent: skips if a placed order already exists.
 */
async function createDemoPlacedOrder(
    app: INestApplication,
    ctx: RequestContext,
    customer: Customer,
): Promise<void> {
    const orderService = app.get(OrderService);
    const productVariantService = app.get(ProductVariantService);
    const connection = app.get(TransactionalConnection);

    // Idempotency guard: don't keep creating demo orders on every restart.
    const existing = await orderService.findAll(ctx, {
        filter: { state: { eq: 'PaymentSettled' } },
        take: 1,
    });
    if (existing.totalItems > 0) {
        Logger.info('Demo placed order already exists — skipping creation.', loggerCtx);
        return;
    }

    const variant = (await productVariantService.findAll(ctx, { take: 1 })).items[0];
    if (!variant) {
        Logger.warn('No product variant found — cannot create demo order.', loggerCtx);
        return;
    }

    // All order mutations (especially addPaymentToOrder) must be executed
    // within a transaction when called outside of a GraphQL resolver.
    await connection.withTransaction(ctx, async txCtx => {
        // 1. Create a draft order and add a line item.
        const order = await orderService.createDraft(txCtx);
        const addResult = await orderService.addItemToOrder(txCtx, order.id, variant.id, 1);
        if (isErrorResult(addResult)) {
            throw new Error(`Could not add item to demo order: ${addResult.message}`);
        }

        // 2. Assign the customer and a shipping address.
        await orderService.addCustomerToOrder(txCtx, order.id, customer);
        await orderService.setShippingAddress(txCtx, order.id, {
            fullName: `${customer.firstName} ${customer.lastName}`,
            streetLine1: '123 Demo Street',
            city: 'Democity',
            postalCode: '1234 AB',
            countryCode: 'GB',
        });

        // 3. Pick the first eligible shipping method.
        const shippingMethods = await orderService.getEligibleShippingMethods(txCtx, order.id);
        if (shippingMethods.length) {
            const setShipping = await orderService.setShippingMethod(txCtx, order.id, [shippingMethods[0].id]);
            if (isErrorResult(setShipping)) {
                throw new Error(`Could not set shipping method: ${setShipping.message}`);
            }
        }

        // 4. Move to ArrangingPayment and add + settle a payment so the order
        //    ends up in the `PaymentSettled` (placed) state.
        const transition = await orderService.transitionToState(txCtx, order.id, 'ArrangingPayment');
        if (isErrorResult(transition)) {
            throw new Error(`Could not transition demo order: ${transition.message}`);
        }
        const payResult = await orderService.addPaymentToOrder(txCtx, order.id, {
            method: 'standard-payment',
            metadata: {},
        });
        if (isErrorResult(payResult)) {
            throw new Error(`Could not add payment to demo order: ${payResult.message}`);
        }

        // The dummy payment handler authorises (but does not auto-settle), so we
        // settle it manually to reach the `PaymentSettled` state.
        const withPayments = await orderService.findOne(txCtx, order.id, ['payments']);
        const authorisedPayment = withPayments?.payments?.find(p => p.state === 'Authorized');
        if (authorisedPayment) {
            await orderService.settlePayment(txCtx, authorisedPayment.id);
        }

        const finalOrder = await orderService.findOne(txCtx, order.id);
        Logger.info(`Created demo placed order ${finalOrder?.code} (state: ${finalOrder?.state}).`, loggerCtx);
    });
}

/** Narrow a Vendure service result to a GraphQL error result. */
function isErrorResult(input: unknown): input is { errorCode: string; message: string } {
    return !!input && typeof input === 'object' && 'errorCode' in input;
}
