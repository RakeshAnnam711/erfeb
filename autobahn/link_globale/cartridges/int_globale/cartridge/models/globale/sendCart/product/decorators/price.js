'use strict';

/**
 * Calculates and returns Global-e Product.SalePrice API
 * @returns {number} - Global-e Product.SalePrice API
 */
function getSalePrice() {
    if (this.isBundled()) {
        return 0;
    }
    return this.productLineItem.basePrice.value;
}

/**
 * Calculates and returns Global-e Product.SalePriceReason API
 * @returns {string} - Global-e Product.SalePriceReason API
 */
function getSalePriceReason() {
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var salePriceReason = '';
    collections.find(this.productLineItem.priceAdjustments, function (priceAdj) {
        var saleName = priceAdj.promotion ? priceAdj.promotion.ID : '';
        if (saleName) {
            salePriceReason = saleName;
            return true;
        }
        return false;
    }, this);
    return salePriceReason;
}

module.exports = function (object) {
    var priceModel;
    Object.defineProperties(object, {
        priceModel: {
            enumerable: true,
            get: function () {
                var globalePriceModel;
                if (!priceModel) {
                    globalePriceModel = require('*/cartridge/scripts/factories/globale/priceModel');
                    priceModel = globalePriceModel(this.apiProduct.priceModel, this.apiProduct, null, this.apiProduct.isOptionProduct());
                }
                return priceModel;
            }
        },
        getSalePrice: {
            value: getSalePrice
        },
        getSalePriceReason: {
            value: getSalePriceReason
        }
    });
};
