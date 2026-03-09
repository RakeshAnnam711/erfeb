/* eslint-disable no-param-reassign */

'use strict';

var collections = require('*/cartridge/scripts/util/globale/collections');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Finds and returns the Product Line Item by its position in the Order
 * @param {Array} plis - product line items
 * @param {string} geProductCartItemId - Global-e Discount.ProductCartItemId
 * @returns {dw.order.ProductLineItem} - Product Line Item
 */
function getProductLineItem(plis, geProductCartItemId) {
    var productLineItem = collections.find(plis, function (pli) {
        return pli.position === geProductCartItemId;
    });
    return productLineItem;
}

/**
 * Removes PriceAdjustment
 * @param {dw.order.LineItemCtnr|dw.order.LineItem} adjustmenyCntr - Either Order or ProductLineItem
 * @param {dw.order.PriceAdjustment} priceAdjustment - Price Adjustment
 */
function removeNonGlobalePriceAdjustment(adjustmenyCntr, priceAdjustment) {
    if (
        !(globaleHelpers.customAttr.priceAdjustment.geInternationalPrice in priceAdjustment.custom)
        || (priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice] === null)
    ) {
        adjustmenyCntr.removePriceAdjustment(priceAdjustment);
    }
}

/**
 * Removes all not related to Global-e price adjustments
 * @param {dw.order.Order} order - order
 */
function removeNonGlobalePriceAdjustments(order) {
    // order level
    collections.forEach(order.priceAdjustments, function (priceAdjustment) {
        removeNonGlobalePriceAdjustment(order, priceAdjustment);
    });

    // product line item level
    collections.forEach(order.allProductLineItems, function (lineItem) {
        collections.forEach(lineItem.priceAdjustments, function (priceAdjustment) {
            removeNonGlobalePriceAdjustment(lineItem, priceAdjustment);
        });
    });
}

/**
 * Hanle discount product, order levels
 * @throws {Error}
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} geDiscount - Global-e discount
 * @param {Object} payload - request payload
 */
function handleDiscount(order, geDiscount, payload) {
    var TaxMgr = require('dw/order/TaxMgr');
    var Money = require('dw/value/Money');

    var priceAdjustment = null;
    var lineItemCntr = null;

    if (geDiscount.ProductCartItemId) { // product level
        var productLineItem = getProductLineItem(order.allProductLineItems, geDiscount.ProductCartItemId);
        if (!productLineItem) {
            throw new Error('Product line item not found. Discount.ProductCartItemId : ' + geDiscount.ProductCartItemId);
        }
        lineItemCntr = productLineItem;
        priceAdjustment = productLineItem.getPriceAdjustmentByPromotionID(geDiscount.DiscountCode);
        if (productLineItem.isBonusProductLineItem() && !priceAdjustment && productLineItem.priceAdjustments.length > 0) {
            priceAdjustment = productLineItem.priceAdjustments[0];
        }
    } else { // order level
        lineItemCntr = order;
        priceAdjustment = order.getPriceAdjustmentByPromotionID(geDiscount.DiscountCode);
        if (!priceAdjustment && geDiscount.CouponCode) {
            var cli = order.getCouponLineItem(geDiscount.CouponCode);
            if (cli) {
                priceAdjustment = cli.priceAdjustments.length ? cli.priceAdjustments[0] : null;
            }
        }
    }

    if (!priceAdjustment) {
        priceAdjustment = lineItemCntr.getPriceAdjustmentByPromotionID('GlobalE-custom-' + geDiscount.DiscountCode);
    }

    if (!priceAdjustment) {
        priceAdjustment = lineItemCntr.createPriceAdjustment('GlobalE-custom-' + geDiscount.DiscountCode);
        priceAdjustment.setLineItemText(geDiscount.DiscountCode);
    }

    if (!priceAdjustment) {
        throw new Error('Price adjustment issue: ' + geDiscount.DiscountCode);
    }

    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geName] = geDiscount.DiscountCode;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geDiscountCode] = geDiscount.DiscountCode;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geDescription] = geDiscount.Description;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.gePrice] = geDiscount.Price;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geVatRate] = geDiscount.VATRate;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geLocalVatRate] = geDiscount.LocalVATRate;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geCouponCode] = geDiscount.CouponCode;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geLoyaltyVoucherCode] = geDiscount.LoyaltyVoucherCode;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geDiscountType] = geDiscount.DiscountType;
    priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice] = geDiscount.InternationalPrice;

    // update tax and price
    var isTaxationBasedOnAdjustedPrice = false;

    var isTaxationBasedOnAdjustedPriceValue = globaleHelpers.getUrlParametersValue(payload.UrlParameters, globaleHelpers.consts.urlParameters.isTaxationBasedOnAdjustedPrice);
    if (isTaxationBasedOnAdjustedPriceValue !== null) {
        isTaxationBasedOnAdjustedPrice = !!isTaxationBasedOnAdjustedPriceValue;
    }

    var gePriceAdjustmentPrice = Math.abs(geDiscount.Price) * (-1);
    var gePriceAdjustmentTaxBasis = isTaxationBasedOnAdjustedPrice ? 0 : gePriceAdjustmentPrice;
    var gePriceAdjustmentVatRate = geDiscount.LocalVATRate / 100;
    var gePriceAdjustmentTaxAmount = TaxMgr.taxationPolicy === TaxMgr.TAX_POLICY_NET ?
        (gePriceAdjustmentTaxBasis * gePriceAdjustmentVatRate) : (gePriceAdjustmentTaxBasis * (1 - (1 / (1 + gePriceAdjustmentVatRate))));

    priceAdjustment.setTaxClassID(TaxMgr.customRateTaxClassID);
    priceAdjustment.setPriceValue(gePriceAdjustmentPrice);
    priceAdjustment.updateTaxAmount(new Money(gePriceAdjustmentTaxAmount, order.currencyCode));
    priceAdjustment.updateTax(gePriceAdjustmentVatRate, new Money(gePriceAdjustmentTaxBasis, order.currencyCode));
}

/**
 * Updates prices for SFCC Order (and its Product Line Items) Price Adjustments
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function updatePriceAdjustments(order, payload) {
    var Status = require('dw/system/Status');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var validator = require('*/cartridge/scripts/util/globale/validator');

    try {
        order.custom[globaleHelpers.customAttr.order.geDutiesAndTaxesSubsidy] = 0;
        order.custom[globaleHelpers.customAttr.order.geShippingSubsidy] = 0;
        order.custom[globaleHelpers.customAttr.order.geTotalCustomerDiscounts] = 0;

        var discounts = objectUtils.getValueByPath(payload, 'Discounts', []);
        var discountValidationSchema = {
            DiscountType: { required: true },
            Price: { required: true },
            VATRate: { required: true },
            LocalVATRate: { required: true },
            InternationalPrice: { required: true },
            ProductCartItemId: { required: true },
            DiscountCode: { required: true },
            CouponCode: { required: true }
        };

        discounts.forEach(function (geDiscount) {
            // validate discount payload
            var discountValidationResult = validator.validate(geDiscount, discountValidationSchema);
            if (!discountValidationResult.valid) {
                throw Error(JSON.stringify(discountValidationResult));
            }

            geDiscount.DiscountType = Number(objectUtils.getValueByPath(geDiscount, 'DiscountType', 0));
            geDiscount.DiscountCode = objectUtils.getValueByPath(geDiscount, 'DiscountCode', '');
            geDiscount.Description = objectUtils.getValueByPath(geDiscount, 'Description', '');
            geDiscount.CouponCode = objectUtils.getValueByPath(geDiscount, 'CouponCode', '');
            geDiscount.LoyaltyVoucherCode = objectUtils.getValueByPath(geDiscount, 'LoyaltyVoucherCode', '');
            geDiscount.Price = Number(objectUtils.getValueByPath(geDiscount, 'Price', 0));
            geDiscount.InternationalPrice = Number(objectUtils.getValueByPath(geDiscount, 'InternationalPrice', null));
            geDiscount.VATRate = Number(objectUtils.getValueByPath(geDiscount, 'VATRate', 0));
            geDiscount.LocalVATRate = Number(objectUtils.getValueByPath(geDiscount, 'LocalVATRate', 0));
            geDiscount.ProductCartItemId = Number(objectUtils.getValueByPath(geDiscount, 'ProductCartItemId', null));

            switch (geDiscount.DiscountType) {
                case 1: // Cart Discount (Product/Order level)
                    order.custom[globaleHelpers.customAttr.order.geTotalCustomerDiscounts] += geDiscount.InternationalPrice;
                    handleDiscount(order, geDiscount, payload);
                    break;
                case 2: // Shipping Discount
                    order.custom[globaleHelpers.customAttr.order.geShippingSubsidy] += geDiscount.Price;
                    break;
                case 3: // Loyalty points discount
                    order.custom[globaleHelpers.customAttr.order.geTotalCustomerDiscounts] += geDiscount.InternationalPrice;
                    break;
                case 4: // Duties Discount
                    order.custom[globaleHelpers.customAttr.order.geDutiesAndTaxesSubsidy] += geDiscount.Price;
                    break;
                case 5: // Checkout loyalty Points discount
                    break;
                case 6: // Payment Charge
                    break;
                default:
                    break;
            }
        });

        // remove non-Global-e Price Adjustments
        removeNonGlobalePriceAdjustments(order);

        // set Total Products Net Price
        var geTotalProductsNetPrice = order.getAdjustedMerchandizeTotalGrossPrice().value - order.custom[globaleHelpers.customAttr.order.geDutiesAndTaxesSubsidy];
        order.custom[globaleHelpers.customAttr.order.geTotalProductsNetPrice] = (Math.round(Number(geTotalProductsNetPrice) * 100) / 100);

        // update totals
        order.updateOrderLevelPriceAdjustmentTax();
        order.updateTotals();

        this.addNote('Price adjustments have been updated');
    } catch (e) {
        return new Status(Status.ERROR, '226', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        updatePriceAdjustments: {
            value: updatePriceAdjustments
        }
    });
};
