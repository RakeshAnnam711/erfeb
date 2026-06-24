'use strict';

module.exports = function (object, productLineItem, priceAdjustment, originalDiscounts, pliProrationData) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        productLineItem: {
            value: productLineItem
        },
        priceAdjustment: {
            value: priceAdjustment
        },
        originalDiscounts: {
            value: originalDiscounts
        },
        pliAppliedDiscountsTotal: {
            writable: true,
            value: 0
        },
        pliProrationData: {
            writable: true,
            value: pliProrationData
        },
        logger: {
            value: globaleHelpers.getLogger()
        }
    });
};
