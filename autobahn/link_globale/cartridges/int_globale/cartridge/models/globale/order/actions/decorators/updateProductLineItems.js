'use strict';

/**
 * Updates Prices for SFCC Order Product Line Items
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function updateProductLineItems(order, payload) {
    var Status = require('dw/system/Status');
    var TaxMgr = require('dw/order/TaxMgr');
    var Money = require('dw/value/Money');
    var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
    var validator = require('*/cartridge/scripts/util/globale/validator');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    try {
        var products = objectUtils.getValueByPath(payload, 'Products', []);
        var plis = order.allProductLineItems.toArray();
        var giftCerts = order.giftCertificateLineItems.toArray();
        var productValidationSchema = {
            Sku: { required: true },
            Price: { required: true },
            Quantity: { required: true },
            VATRate: { required: true },
            InternationalPrice: { required: true },
            InternationalDiscountedPrice: { required: true }
        };

        if (giftCerts.length > 0) {
            giftCerts.forEach(function (giftCert) {
                plis.push(giftCert);
            });
        }

        // get discount taxation mode
        var isTaxationBasedOnAdjustedPrice = false;
        var isTaxationBasedOnAdjustedPriceValue = globaleHelpers.getUrlParametersValue(payload.UrlParameters, globaleHelpers.consts.urlParameters.isTaxationBasedOnAdjustedPrice);
        if (isTaxationBasedOnAdjustedPriceValue !== null) {
            isTaxationBasedOnAdjustedPrice = !!isTaxationBasedOnAdjustedPriceValue;
        }

        products.forEach(function (geProduct) {
            // validate product payload
            var productValidationResult = validator.validate(geProduct, productValidationSchema);
            if (!productValidationResult.valid) {
                throw Error(JSON.stringify(productValidationResult));
            }

            // find product line item
            var productLineItem = arrayUtils.find(plis, function (lineItem) {
                var itemId = lineItem instanceof GiftCertificateLineItem ? lineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.geGiftCertificateID]
                    : lineItem.productID;
                return (itemId === decodeURIComponent(geProduct.Sku) || geProduct.CartItemOptionId !== null) &&
                    (String(lineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemId]) === geProduct.CartItemId);
            });
            if (!productLineItem) {
                throw new Error('Can not find Order.productLineItem: ' + geProduct.Sku);
            }

            // set initial product variables
            var subsidy = objectUtils.getValueByPath(geProduct, 'DTBreakdown.Subsidy', 0);
            var geProductPrice = Math.abs(objectUtils.getValueByPath(geProduct, 'Price', null) - subsidy);
            var geProductDiscountedPrice = Math.abs(objectUtils.getValueByPath(geProduct, 'DiscountedPrice', null));
            var geProductVatRate = (Number(objectUtils.getValueByPath(geProduct, 'VATRate', 0)) / 100);
            var geProductQty = Number(objectUtils.getValueByPath(geProduct, 'Quantity', 0));
            var geProductTaxBasis = isTaxationBasedOnAdjustedPrice ? geProductDiscountedPrice : geProductPrice;
            var geProductTaxAmount = TaxMgr.taxationPolicy === TaxMgr.TAX_POLICY_NET ?
                (geProductTaxBasis * geProductVatRate) : (geProductTaxBasis * (1 - (1 / (1 + geProductVatRate))));

            // update custom attributes
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemOptionId] = objectUtils.getValueByPath(geProduct, 'CartItemOptionId', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalPrice] = objectUtils.getValueByPath(geProduct, 'InternationalPrice', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geDiscountedPrice] = objectUtils.getValueByPath(geProduct, 'DiscountedPrice', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalDiscountedPrice] = objectUtils.getValueByPath(geProduct, 'InternationalDiscountedPrice', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geParentCartItemId] = objectUtils.getValueByPath(geProduct, 'ParentCartItemId', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.gePriceBeforeGlobaleDiscount] = objectUtils.getValueByPath(geProduct, 'PriceBeforeGlobalEDiscount', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.gePriceBeforeRoundingRate] = objectUtils.getValueByPath(geProduct, 'PriceBeforeRoundingRate', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geRoundingRate] = objectUtils.getValueByPath(geProduct, 'RoundingRate', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geDiscountedPriceForCustoms] = objectUtils.getValueByPath(geProduct, 'DiscountedPriceForCustoms', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalDiscountedPriceForCustoms] = objectUtils.getValueByPath(geProduct, 'InternationalDiscountedPriceForCustoms', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geLineItemInternationalPrice] = objectUtils.getValueByPath(geProduct, 'LineItemInternationalPrice', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geIsBackOrdered] = objectUtils.getValueByPath(geProduct, 'IsBackOrdered', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geBackOrderDate] = objectUtils.getValueByPath(geProduct, 'BackOrderDate', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCustomerVATRate] = objectUtils.getValueByPath(geProduct, 'CustomerVATRate', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalDiscountedPriceInMerchantCurrency] = objectUtils.getValueByPath(geProduct, 'InternationalDiscountedPriceInMerchantCurrency', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geVatRate] = geProductVatRate;
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.gePrice] = geProductPrice;
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geListPrice] = objectUtils.getValueByPath(geProduct, 'ListPrice', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalListPrice] = objectUtils.getValueByPath(geProduct, 'InternationalListPrice', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geIsGiftCard] = objectUtils.getValueByPath(geProduct, 'IsGiftCard', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geProductSubsidy] = objectUtils.getValueByPath(geProduct, 'DTBreakdown.Subsidy', null);
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalProductSubsidy] = objectUtils.getValueByPath(geProduct, 'InternationalDTBreakdown.Subsidy', null);

            if (!productLineItem.custom[globaleHelpers.customAttr.productLineItem.geIsGiftCard]) {
                // update quantity
                productLineItem.setQuantityValue(geProductQty);
            }

            // update tax and price
            productLineItem.setTaxClassID(TaxMgr.customRateTaxClassID);
            productLineItem.setPriceValue(geProductPrice);
            productLineItem.updateTaxAmount(new Money(geProductTaxAmount * geProductQty, order.currencyCode));
            productLineItem.updateTax(geProductVatRate, new Money((geProductTaxBasis * geProductQty), order.currencyCode));
        });

        // update order totals
        order.updateTotals();

        this.addNote('Prices for all ProductLineItems have been updated');
    } catch (e) {
        return new Status(Status.ERROR, '217', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'updateProductLineItems', {
        value: updateProductLineItems
    });
};
