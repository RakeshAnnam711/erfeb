'use strict';

module.exports = function (object, productLineItem) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        },
        productLineItem: {
            enumerable: true,
            value: productLineItem
        },
        apiProduct: {
            enumerable: true,
            value: (productLineItem && productLineItem.product)
        }
    });
};
