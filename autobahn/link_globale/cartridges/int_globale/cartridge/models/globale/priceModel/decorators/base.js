'use strict';

module.exports = function (object, priceModel, product, currentOptionModel, splitOptions) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: (priceModel || null)
        },
        product: {
            enumerable: true,
            value: (product || null)
        },
        currentOptionModel: {
            enumerable: true,
            value: (currentOptionModel || null)
        },
        splitOptions: {
            enumerable: true,
            value: (splitOptions || false)
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
