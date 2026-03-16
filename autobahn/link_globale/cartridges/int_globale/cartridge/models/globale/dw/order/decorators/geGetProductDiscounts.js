'use strict';

/**
 * Returns count of product discounts
 * @returns {number} - count of product discounts
 */
function geGetProductDiscounts() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var order = this;
    var result = 0;

    collections.forEach(order.allProductLineItems, function (lineItem) {
        if (lineItem.priceAdjustments && lineItem.priceAdjustments.length > 0) {
            collections.forEach(lineItem.priceAdjustments, function (priceAdjustment) {
                if (
                    (globaleHelpers.customAttr.priceAdjustment.geInternationalPrice in priceAdjustment.custom)
                    && (priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice] !== null)
                ) {
                    result += priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice];
                }
            });
        }
    });

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetProductDiscounts: {
            value: geGetProductDiscounts
        }
    });
};
