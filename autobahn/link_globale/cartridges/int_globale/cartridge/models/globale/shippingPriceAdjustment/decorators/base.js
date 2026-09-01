'use strict';

module.exports = function (object, basket, priceAdjustment) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        basket: {
            value: basket
        },
        priceAdjustment: {
            value: priceAdjustment
        },
        logger: {
            value: globaleHelpers.getLogger()
        }
    });
};
