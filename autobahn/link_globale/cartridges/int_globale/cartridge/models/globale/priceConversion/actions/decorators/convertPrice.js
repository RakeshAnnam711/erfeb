'use strict';

/**
 * Convert a price in merchant native currency to customer local currency
 * @param {Object} convertPriceOperationData - Convert Price operation data
 * @returns {null|Object} - Converted price or null
 */
function convertPrice(convertPriceOperationData) {
    var Money = require('dw/value/Money');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
    var globalePriceModel = require('*/cartridge/scripts/factories/globale/priceModel');
    var currencyCode = globaleSession.getCurrency().currencyCode;
    var localPrice = null;

    if (convertPriceOperationData.productId !== null) {
        var product = ProductMgr.getProduct(convertPriceOperationData.productId);
        if (product) {
            var priceModel = globalePriceModel(product.priceModel, product);
            localPrice = priceModel.price;
        }
    } else if (convertPriceOperationData.originalPrice !== null && convertPriceOperationData.isDiscount) {
        localPrice = globalePrice(new Money(convertPriceOperationData.originalPrice, currencyCode), null, null, true, null, null, true);
    } else if (convertPriceOperationData.originalPrice !== null) {
        localPrice = globalePrice(new Money(convertPriceOperationData.originalPrice, currencyCode));
    }

    return localPrice;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        convertPrice: {
            value: convertPrice
        }
    });
};
