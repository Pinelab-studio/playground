import { Injectable } from '@nestjs/common';
import {
    ProductVariantPriceCalculationStrategy,
    ProductVariantPriceCalculationArgs,
    PriceCalculationResult,
} from '@vendure/core';

const RED = '\x1b[31m';
const RESET = '\x1b[0m';

/**
 * Calculate the list price of a variant.
 */
@Injectable()
export class CustomProductVariantPriceStrategy implements ProductVariantPriceCalculationStrategy {
    async calculate(args: ProductVariantPriceCalculationArgs): Promise<PriceCalculationResult> {
        console.log(
            `${RED}[CustomProductVariantPriceStrategy] called for SKU ${args.productVariant.sku} with inputPrice ${args.inputPrice}${RESET}`,
        );
        return { price: args.inputPrice, priceIncludesTax: false };
    }
}
