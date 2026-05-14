/* eslint-disable */
'use strict';

/** @module calculate */
/**
 * This javascript file implements methods (via Common.js exports) that are needed by
 * the new (smaller) CalculateCart.ds script file.  This allows OCAPI/SCAPI calls to reference
 * these tools via the OCAPI/SCAPI 'hook' mechanism
 */
var base = module.superModule;
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var globaleRequest = require('*/cartridge/models/globale/request');
var globaleSession = require('*/cartridge/models/globale/session');
var globalePrice = require('*/cartridge/scripts/factories/globale/price');
var globaleMerchantPrice = require('*/cartridge/scripts/factories/globale/merchantPrice');
var globalePriceModel = require('*/cartridge/scripts/factories/globale/priceModel');
var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');

var HashMap = require('dw/util/HashMap');
var Status = require('dw/system/Status');
var HookMgr = require('dw/system/HookMgr');
var PromotionMgr = require('dw/campaign/PromotionMgr');

exports.calculateTax = function (basket) {
    return base.calculateTax(basket);
};

/**
 * @function calculate
 *
 * calculate is the arching logic for computing the value of a basket.  It makes
 * calls into cart/calculate.js and enables both SG and OCAPI applications to share
 * the same cart calculation logic.
 *
 * @param {object} basket The basket to be calculated
 * @param {boolean} original - If True - calculate as local/domestic Basket, otherwise - as international Basket.
 */
exports.calculate = function (basket, original, payByLinkScenario) {
    // check if there is S2S order create request and if yes, handle it
    if (globaleCAPIHelpers.isCAPIOrderCreateRequest()) {
        return new Status(Status.OK);
    }

    var geBasketMgr = require('*/cartridge/scripts/factories/globale/dw/basket');
    var geBasket = geBasketMgr.get(basket);
    var isGeBasket = geBasketMgr.isGeBasket(basket, original);

    // update shipping method
    geBasket.geInitShippingMethod(isGeBasket);

    if (!isGeBasket) {
        return;
    }

    if (payByLinkScenario) {
        // preserve storefront prices
        calculateBaseProductPrices(basket);
        geBasket.gePreserveStorefrontPrices();

        HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);

        basket.updateTotals();
        return new Status(Status.OK);
    }

    // perform original calculate
    base.calculate(basket);

    // update product inventory lists
    geBasket.geUpdateProductsInventoryList();

    // use base currency
    geBasket.geUpdateCurrency(globaleHelpers.getMerchantBaseCurrencyCode());

    // handle discount calculation for fixed price books
    if (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) {
        calculateFixedProductPrices(basket);
        PromotionMgr.applyDiscounts(basket);
        HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', basket);
        PromotionMgr.applyDiscounts(basket);
        HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);
        basket.updateTotals();
    }

    // preserve original prices
    geBasket.gePreserveOriginalPrices();

    // update geCartItemId
    geBasket.geUpdateProductsCartItemId();

    if (globaleHelpers.isNativeGiftCertificateEnabled()) {
        // update geCartItemId for gift certificate
        geBasketMgr.geUpdateGiftCertificateCartItemId(basket);
    }

    // collect original discounts
    var originalDiscounts = geBasket.geCollectOriginalDiscountsData();

    // ===================================================
    // =====   CALCULATE PRODUCT LINE ITEM PRICES    =====
    // ===================================================

    calculateProductPrices(basket);

    // ===================================================
    // =====    CALCULATE GIFT CERTIFICATE PRICES    =====
    // ===================================================

    calculateGiftCertificatePrices(basket);

    // align Global-e discounts
    geBasket.geUpdateDiscounts(originalDiscounts);

    // ===================================================
    // =====         CALCULATE TAX                   =====
    // ===================================================

    HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);

    // ===================================================
    // =====         CALCULATE BASKET TOTALS         =====
    // ===================================================

    basket.updateTotals();

    // ===================================================
    // =====            DONE                         =====
    // ===================================================

    return new Status(Status.OK);
};

/**
 * @function calculateFixedProductPrices
 *
 * Calculates fixed product prices. Set calculates prices
 * on the product line items. This updates the basket and returns nothing
 *
 * @param {object} basket The basket containing the elements to be computed
 */
function calculateFixedProductPrices(basket) {
    // get total quantities for all products contained in the basket
    var productQuantities = basket.getProductQuantities();
    var productQuantitiesIt = productQuantities.keySet().iterator();
    var priceModel;
    var merchantPrice;
    var price;

    // get product prices for the accumulated product quantities
    var productPrices = new HashMap();

    while (productQuantitiesIt.hasNext()) {
        var prod = productQuantitiesIt.next();
        var quantity = productQuantities.get(prod);
        priceModel = globalePriceModel(prod.priceModel, prod);
        productPrices.put(prod, priceModel.getPrice(quantity));
    }

    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();
        // skip bundled product line items
        if (productLineItem.bundledProductLineItem || productLineItem.optionProductLineItem) {
            continue;
        }
        var product = productLineItem.product;
        // handle product line items unrelated to product
        if (product === null) {
            productLineItem.setPriceValue(null);
            continue;
        }
        priceModel = globalePriceModel((productLineItem.product && productLineItem.product.priceModel), productLineItem.product);
        merchantPrice = globaleMerchantPrice();
        if (('fixedPrice' in priceModel.price) && priceModel.price.fixedPrice) {
            price = ((!productLineItem.catalogProduct || productLineItem.bonusProductLineItem) ? priceModel.price : productPrices.get(product));
            productLineItem.setPriceValue(price.isAvailable() && (merchantPrice.currencyRate !== null) ? price.divide(merchantPrice.currencyRate).valueOrNull : null);
        }
    }
}

/**
 * @function calculateProductPrices
 *
 * Calculates product prices based on line item quantities. Set calculates prices
 * on the product line items.  This updates the basket and returns nothing
 *
 * @param {object} basket The basket containing the elements to be computed
 */
function calculateProductPrices (basket) {
    // get total quantities for all products contained in the basket
    var productQuantities = basket.getProductQuantities();
    var productQuantitiesIt = productQuantities.keySet().iterator();
    var priceModel;
    var productPrice;

    // get product prices for the accumulated product quantities
    var productPrices = new HashMap();

    while (productQuantitiesIt.hasNext()) {
        var prod = productQuantitiesIt.next();
        var quantity = productQuantities.get(prod);
        priceModel = globalePriceModel(prod.priceModel, prod, null, prod.isOptionProduct());
        productPrices.put(prod, priceModel.getPrice(quantity));
    }

    // iterate all product line items of the basket and set prices
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();
        priceModel = globalePriceModel((productLineItem.product && productLineItem.product.priceModel), productLineItem.product, null, (productLineItem.product && productLineItem.product.isOptionProduct()));

        // handle non-catalog products
        if (!productLineItem.catalogProduct) {
            productLineItem.setPriceValue(priceModel.price.valueOrNull);
            continue;
        }

        var product = productLineItem.product;
        var price;

        // handle option line items
        if (productLineItem.optionProductLineItem) {
            // for bonus option line items, we do not update the price
            // the price is set to 0.0 by the promotion engine
            if (!productLineItem.bonusProductLineItem) {
                productLineItem.updateOptionPrice();
                price = globalePrice(productLineItem.getBasePrice(), productLineItem.parent.productID);
                productLineItem.setPriceValue(price.isAvailable() ? price.valueOrNull : null);
            }
        // handle bundle line items, but only if they're not a bonus
        } else if (productLineItem.bundledProductLineItem) {
            // no price is set for bundled product line items
        // handle bonus line items
        // the promotion engine set the price of a bonus product to 0.0
        // we update this price here to the actual product price just to
        // provide the total customer savings in the storefront
        // we have to update the product price as well as the bonus adjustment
        } else if (productLineItem.bonusProductLineItem && product !== null) {
            price = priceModel.price;
            var adjustedPrice = globalePrice(productLineItem.adjustedPrice);
            productLineItem.setPriceValue(price.isAvailable() ? price.valueOrNull : null);
            // get the product quantity
            var quantity2 = productLineItem.quantity;
            // we assume that a bonus line item has only one price adjustment
            var adjustments = productLineItem.priceAdjustments;
            if (!adjustments.isEmpty()) {
                var adjustment = adjustments.iterator().next();
                var adjustmentPrice = price.multiply(quantity2.value).multiply(-1.0).add(adjustedPrice);
                adjustment.setPriceValue(adjustmentPrice.isAvailable() ? adjustmentPrice.valueOrNull : null);
            }


        // set the product price. Updates the 'basePrice' of the product line item,
        // and either the 'netPrice' or the 'grossPrice' based on the current taxation
        // policy

        // handle product line items unrelated to product
        } else if (product === null) {
            productLineItem.setPriceValue(null);
        // handle normal product line items
        } else {
            productPrice = productPrices.get(product);
            productLineItem.setPriceValue(productPrice.isAvailable() ? productPrice.valueOrNull : null);
        }
    }
}

/**
 * @function calculateBaseProductPrices
 *
 * Calculates base product prices. Set calculates prices
 * on the product line items. This updates the basket and returns nothing
 *
 * @param {object} basket The basket containing the elements to be computed
 */
function calculateBaseProductPrices(basket) {
    // get total quantities for all products contained in the basket
    var productQuantities = basket.getProductQuantities();
    var productQuantitiesIt = productQuantities.keySet().iterator();
    var priceModel;
    var merchantPrice;
    var price;

    // get product prices for the accumulated product quantities
    var productPrices = new HashMap();

    while (productQuantitiesIt.hasNext()) {
        var prod = productQuantitiesIt.next();
        var quantity = productQuantities.get(prod);
        priceModel = globalePriceModel(prod.priceModel, prod);
        productPrices.put(prod, priceModel.getPrice(quantity));
    }

    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();
        // skip bundled product line items
        if (productLineItem.bundledProductLineItem || productLineItem.optionProductLineItem) {
            continue;
        }
        var product = productLineItem.product;
        // handle product line items unrelated to product
        if (product === null) {
            productLineItem.setPriceValue(null);
            continue;
        }
        priceModel = globalePriceModel((productLineItem.product && productLineItem.product.priceModel), productLineItem.product);
        merchantPrice = globaleMerchantPrice();
        price = ((!productLineItem.catalogProduct || productLineItem.bonusProductLineItem) ? priceModel.price : productPrices.get(product));
        productLineItem.setPriceValue(price.isAvailable() && (merchantPrice.currencyRate !== null) ? price.divide(merchantPrice.currencyRate).valueOrNull : null);
    }
}


/**
 * @function calculateGiftCertificates
 *
 * Function sets either the net or gross price attribute of all gift certificate
 * line items of the basket by using the gift certificate base price. It updates the basket in place.
 *
 * @param {object} basket The basket containing the gift certificates
 */
function calculateGiftCertificatePrices (basket) {
    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
    var giftCertificates = basket.getGiftCertificateLineItems().iterator();
    while (giftCertificates.hasNext()) {
        var giftCertificate = giftCertificates.next();
        if (globaleHelpers.isNativeGiftCertificateEnabled()) {
            var gePrice = giftCertificate.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice];
            var price = globalePrice(giftCertificate.basePrice, null, 1, true, false, null, true, giftCertificate);

            if (gePrice) {
                giftCertificate.setPriceValue(gePrice);
                price = globalePrice(giftCertificate.basePrice, null, 1, true, false, null, true, giftCertificate);
            } else {
                giftCertificate.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice] = price.super.valueOrNull;
            }

            giftCertificate.setPriceValue(price.valueOrNull);
        } else {
            basket.removeGiftCertificateLineItem(giftCertificate);
        }
    }
}
