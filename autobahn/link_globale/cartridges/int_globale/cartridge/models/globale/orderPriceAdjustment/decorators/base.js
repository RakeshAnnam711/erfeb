'use strict';

module.exports = function (object, basket, priceAdjustment, originalDiscounts, proratedPliDiscountedPricesHashMap) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        basket: {
            value: basket
        },
        priceAdjustment: {
            value: priceAdjustment
        },
        originalDiscounts: {
            value: originalDiscounts
        },
        appliedDiscountsTotal: {
            writable: true,
            value: 0
        },
        proratedPliDiscountedPricesHashMap: {
            writable: true,
            value: proratedPliDiscountedPricesHashMap
        },
        logger: {
            value: globaleHelpers.getLogger()
        }
    });
};
