'use strict';

var base = module.superModule || {};

/**
 * Allows an override for integrations to implement logic after an order is failed.
 * @param {dw.order.Order} order - The failed order object
 */
function doPostFailOrder(order) {
    if (base && base.doPostFailOrder) {
        return base.doPostFailOrder.apply(base, arguments);
    } else {
        return { error: false, message: '' };
    }
}

module.exports = {
    doPostFailOrder: doPostFailOrder
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
