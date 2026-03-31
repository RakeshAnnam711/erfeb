'use strict';

module.exports = function (object, price, skipRounding, formatOnly, discount) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        },
        originalPrice: {
            enumerable: true,
            value: (price || null)
        },
        skipRounding: {
            enumerable: true,
            value: (skipRounding || false)
        },
        formatOnly: {
            enumerable: true,
            value: (formatOnly || false)
        },
        discount: {
            enumerable: true,
            value: (discount || false)
        }
    });
};
