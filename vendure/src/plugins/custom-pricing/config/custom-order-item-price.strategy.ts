import { Injectable } from '@nestjs/common';
import {
    OrderItemPriceCalculationStrategy,
    PriceCalculationResult,
    RequestContext,
    ProductVariant,
    Order,
} from '@vendure/core';

const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

/**
 * Calculate a price for the order line, when the item is added to cart.
 */
@Injectable()
export class CustomOrderItemPriceStrategy implements OrderItemPriceCalculationStrategy {
    calculateUnitPrice(
        ctx: RequestContext,
        productVariant: ProductVariant,
        orderLineCustomFields: { [key: string]: any },
        order: Order,
        quantity: number,
    ): PriceCalculationResult {
        const newPrice = productVariant.price + 100;
        // Just for demonstration, we are going to increase the price.
        console.log(
            `${YELLOW}[CustomOrderItemPriceStrategy] called for SKU ${productVariant.sku}, quantity ${quantity} and returning price = ${RESET}`,
        );
        return { price: newPrice, priceIncludesTax: false };
    }
}
