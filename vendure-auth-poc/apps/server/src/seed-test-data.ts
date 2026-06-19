import {
    bootstrap,
    ChannelService,
    CurrencyCode,
    LanguageCode,
    Channel,
    RequestContext,
    ZoneService,
} from '@vendure/core';
import { config } from './vendure-config';
import { ChannelAuthService } from './plugins/channel-auth/services/channel-auth.service';

async function seed() {
    const app = await bootstrap(config);
    const channelService = app.get(ChannelService);
    const zoneService = app.get(ZoneService);
    const channelAuthService = app.get(ChannelAuthService);

    const defaultChannel = await channelService.getDefaultChannel();
    const ctx = new RequestContext({
        apiType: 'admin',
        channel: defaultChannel,
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
    });

    // Get or create a zone for channel defaults
    const zones = await zoneService.findAll(ctx);
    let zoneId: string;
    if (zones.items.length > 0) {
        zoneId = String(zones.items[0].id);
    } else {
        const zone = await zoneService.create(ctx, { name: 'Default Zone', memberIds: [] });
        zoneId = String(zone.id);
    }

    const channel1 = await getOrCreateChannel(channelService, ctx, {
        code: 'channel-1',
        token: 'channel-1',
        currencyCode: CurrencyCode.EUR,
        zoneId,
    });
    const channel2 = await getOrCreateChannel(channelService, ctx, {
        code: 'channel-2',
        token: 'channel-2',
        currencyCode: CurrencyCode.USD,
        zoneId,
    });

    const ctx1 = new RequestContext({
        apiType: 'shop',
        channel: channel1,
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
    });
    const ctx2 = new RequestContext({
        apiType: 'shop',
        channel: channel2,
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
    });

    const testEmail = 'test@example.com';

    // Register in Channel 1
    const result1 = await channelAuthService.register(ctx1, {
        emailAddress: testEmail,
        password: '12345',
        firstName: 'Test',
        lastName: 'Customer',
    });
    if (result1.success) {
        console.log(`Registered "${testEmail}" in channel-1 (password: 12345)`);
    } else {
        console.log(`Channel 1: ${result1.message}`);
    }

    // Register in Channel 2 (reuses existing user, creates new credential)
    const result2 = await channelAuthService.register(ctx2, {
        emailAddress: testEmail,
        password: 'abcdef',
        firstName: 'Test',
        lastName: 'Customer',
    });
    if (result2.success) {
        console.log(`Registered "${testEmail}" in channel-2 (password: abcdef)`);
    } else {
        console.log(`Channel 2: ${result2.message}`);
    }

    console.log('\n--- Seed complete ---');
    console.log(`User: ${testEmail}`);
    console.log(`Channel 1 (vendure-token: channel-1) password: 12345`);
    console.log(`Channel 2 (vendure-token: channel-2) password: abcdef`);

    await app.close();
    process.exit(0);
}

async function getOrCreateChannel(
    channelService: ChannelService,
    ctx: RequestContext,
    opts: { code: string; token: string; currencyCode: CurrencyCode; zoneId: string },
): Promise<Channel> {
    const existing = await channelService.findAll(ctx, {
        filter: { code: { eq: opts.code } },
    });
    if (existing.items.length > 0) {
        console.log(`Channel "${opts.code}" already exists`);
        return existing.items[0];
    }
    const result = await channelService.create(ctx, {
        code: opts.code,
        token: opts.token,
        defaultLanguageCode: LanguageCode.en,
        defaultCurrencyCode: opts.currencyCode,
        pricesIncludeTax: true,
        defaultShippingZoneId: opts.zoneId,
        defaultTaxZoneId: opts.zoneId,
    });
    if ('message' in result) {
        throw new Error(`Failed to create channel ${opts.code}: ${(result as any).message}`);
    }
    console.log(`Created channel "${opts.code}"`);
    return result as Channel;
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
