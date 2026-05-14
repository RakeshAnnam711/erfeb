'use strict';

/**
 * Returns order total
 * @param {boolean} isSubTotal - flag which equals 'true' if needs order sub total
 * @returns {dw.value.Money} - order total
 */
function geGetOrderTotal(isSubTotal) {
    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var order = this;
    var currencyCode = order.currencyCode;
    if ((globaleHelpers.customAttr.order.geCustomerCurrencyCode in order.custom) && order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] !== null) {
        currencyCode = order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
    }
    var orderTotal = 0;
    var orders = [order];
    // handle Mixed order scenario
    if (order.geIsMixedMainOrder()) {
        orders = orders.concat(order.geGetMixedSubOrders());
    }
    var result = globaleMoney(orderTotal, currencyCode).toFormattedString();

    orders.forEach(function (orderItem) {
        if ((globaleHelpers.customAttr.order.geTotalPrice in orderItem.custom) && orderItem.custom[globaleHelpers.customAttr.order.geTotalPrice]) {
            orderTotal += orderItem.custom[globaleHelpers.customAttr.order.geTotalPrice];
        }
        if (isSubTotal === true) {
            if ((globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice in orderItem.custom) && orderItem.custom[globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice]) {
                orderTotal -= orderItem.custom[globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice];
            }
            if ((globaleHelpers.customAttr.order.geTotalDutiesPrice in orderItem.custom) && orderItem.custom[globaleHelpers.customAttr.order.geTotalDutiesPrice]) {
                orderTotal -= orderItem.custom[globaleHelpers.customAttr.order.geTotalDutiesPrice];
            }
            if ((globaleHelpers.customAttr.order.geTotalCustomerDiscounts in orderItem.custom) && orderItem.custom[globaleHelpers.customAttr.order.geTotalCustomerDiscounts]) {
                orderTotal += orderItem.custom[globaleHelpers.customAttr.order.geTotalCustomerDiscounts];
            }
            var productTotalDiscounts = order.geGetProductDiscounts();
            if (productTotalDiscounts > 0) {
                orderTotal -= productTotalDiscounts;
            }
        } else {
            // deduct total of all types of gift cards from order total
            var allGiftCardsTotal = paymentHelpers.getAllGiftCardsTotal(order);
            if (allGiftCardsTotal > 0) {
                orderTotal -= allGiftCardsTotal;
            }
        }
    });
    result = globaleMoney(orderTotal, currencyCode).toFormattedString();

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetOrderTotal: {
            value: geGetOrderTotal
        }
    });
};
