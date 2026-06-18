import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { CHANNEL_AUTH_PLUGIN_OPTIONS } from './constants';
import { PluginInitOptions } from './types';
import { ChannelCredential } from './entities/channel-credential.entity';
import { ChannelAuthService } from './services/channel-auth.service';
import { ChannelAuthResolver } from './api/channel-auth.resolver';
import { shopApiExtensions } from './api/api-extensions';
import { ChannelAuthenticationStrategy } from './strategies/channel-authentication.strategy';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [ChannelCredential],
    providers: [
        ChannelAuthService,
        { provide: CHANNEL_AUTH_PLUGIN_OPTIONS, useFactory: () => ChannelAuthPlugin.options },
    ],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [ChannelAuthResolver],
    },
    configuration: config => {
        config.authOptions.shopAuthenticationStrategy = [
            new ChannelAuthenticationStrategy(),
        ];
        return config;
    },
    compatibility: '^3.0.0',
})
export class ChannelAuthPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<ChannelAuthPlugin> {
        this.options = options;
        return ChannelAuthPlugin;
    }
}
