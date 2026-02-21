'use strict';

var base = module.superModule || {};

/**
 * Allows an override for integrations to implement logic after an order is placed.
 * @param {dw.order.Order} order - The order object to be placed
 */
function doPostPlaceOrder(order) {
    if (base && base.doPostPlaceOrder) {
        return base.doPostPlaceOrder.apply(base, arguments);
    } else {
        return { error: false, message: '' };
    }
}

module.exports = {
    doPostPlaceOrder: doPostPlaceOrder
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
