'use strict';

var base = module.superModule || {};

/**
 * Allows an override for integrations to implement logic after an order is placed.
 * @param {dw.order.Order} order - The order object to be placed
 */
function doPrePlaceOrder(order) {
    if (base && base.doPrePlaceOrder) {
        return base.doPrePlaceOrder.apply(base, arguments);
    } else {
        return { error: false, message: '' };
    }
}

module.exports = {
    doPrePlaceOrder: doPrePlaceOrder
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
