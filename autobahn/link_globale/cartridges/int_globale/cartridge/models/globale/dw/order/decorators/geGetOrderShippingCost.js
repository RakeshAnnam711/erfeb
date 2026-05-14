'use strict';

/**
 * Returns order shipping cost
 * @returns {dw.value.Money} - order shipping total
 */
function geGetOrderShippingCost() {
    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var order = this;
    var currencyCode = order.currencyCode;
    if ((globaleHelpers.customAttr.order.geCustomerCurrencyCode in order.custom) && order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] !== null) {
        currencyCode = order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
    }
    var shippingCost = 0;
    var orders = [order];
    // handle Mixed order scenario
    if (order.geIsMixedMainOrder()) {
        orders = orders.concat(order.geGetMixedSubOrders());
    }
    var result = globaleMoney(shippingCost, currencyCode).toFormattedString();

    orders.forEach(function (orderItem) {
        if ((globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice in orderItem.custom) && orderItem.custom[globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice]) {
            shippingCost += orderItem.custom[globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice];
        }
    });
    result = globaleMoney(shippingCost, currencyCode).toFormattedString();

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetOrderShippingCost: {
            value: geGetOrderShippingCost
        }
    });
};
