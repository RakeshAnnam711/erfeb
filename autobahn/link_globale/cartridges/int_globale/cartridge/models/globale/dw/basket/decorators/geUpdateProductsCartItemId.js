'use strict';

/**
 * Updates Product Line Item custom attribute 'geCartItemId'
 */
function geUpdateProductsCartItemId() {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var basket = this;

    collections.forEach(basket.allProductLineItems, function (productLineItem) {
        Transaction.wrap(function () {
            productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemId] = productLineItem.position; // eslint-disable-line no-param-reassign
        });
    });
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geUpdateProductsCartItemId: {
            value: geUpdateProductsCartItemId
        }
    });
};
