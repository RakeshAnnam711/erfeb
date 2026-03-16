'use strict';

/**
 * Returns order level discounts total
 * @returns {dw.value.Money} - order level discounts total
 */
function geGetOrderLevelDiscountTotal() {
    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var order = this;
    var currencyCode = order.currencyCode;
    if ((globaleHelpers.customAttr.order.geCustomerCurrencyCode in order.custom) && order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] !== null) {
        currencyCode = order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
    }
    var discountTotal = 0;
    var orders = [order];
    // handle Mixed order scenario
    if (order.geIsMixedMainOrder()) {
        orders = orders.concat(order.geGetMixedSubOrders());
    }
    var discountMoneyTotal = globaleMoney(discountTotal, currencyCode);
    var result = { value: discountMoneyTotal.value, formatted: discountMoneyTotal.toFormattedString() };

    orders.forEach(function (orderItem) {
        if ((globaleHelpers.customAttr.order.geTotalCustomerDiscounts in orderItem.custom) && orderItem.custom[globaleHelpers.customAttr.order.geTotalCustomerDiscounts]) {
            discountTotal += orderItem.custom[globaleHelpers.customAttr.order.geTotalCustomerDiscounts];
        }
        var productTotalDiscounts = this.geGetProductDiscounts.call(orderItem);
        if (productTotalDiscounts > 0) {
            discountTotal -= productTotalDiscounts;
        }
    }.bind(this));

    discountMoneyTotal = globaleMoney(discountTotal, currencyCode);
    result = { value: discountMoneyTotal.value, formatted: discountMoneyTotal.toFormattedString() };

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetOrderLevelDiscountTotal: {
            value: geGetOrderLevelDiscountTotal
        }
    });
};
