'use strict';

var base = module.superModule || {};

/**
 * Reverses the payment in the given basket or order, if there is one.
 * @param {Object} lineItemCtnr - either dw.order.Basket or dw.order.Order
 */
function reversePaymentIfNecessary(lineItemCtnr) {
    if (base && base.reversePaymentIfNecessary) {
        return base.reversePaymentIfNecessary.apply(base, arguments);
    } else {
        return { error: false, message: '' };
    }
}

module.exports = {
    reversePaymentIfNecessary: reversePaymentIfNecessary
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
