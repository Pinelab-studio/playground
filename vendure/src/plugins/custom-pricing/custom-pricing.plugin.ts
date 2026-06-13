import { VendurePlugin } from '@vendure/core';
import { CustomProductVariantPriceStrategy } from './config/custom-product-variant-price.strategy';
import { CustomOrderItemPriceStrategy } from './config/custom-order-item-price.strategy';

@VendurePlugin({
    providers: [CustomProductVariantPriceStrategy, CustomOrderItemPriceStrategy],
    configuration: (config) => {
        config.catalogOptions = config.catalogOptions ?? {};
        config.catalogOptions.productVariantPriceCalculationStrategy = new CustomProductVariantPriceStrategy();

        config.orderOptions = config.orderOptions ?? {};
        config.orderOptions.orderItemPriceCalculationStrategy = new CustomOrderItemPriceStrategy();

        return config;
    },
})
export class CustomPricingPlugin {}
