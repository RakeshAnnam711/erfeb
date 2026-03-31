'use strict';
var formatMoney = require('dw/util/StringUtils').formatMoney;

module.exports = function (object, apiShippingLineItem) {

    Object.defineProperty(object, 'ID', {
        enumerable: true,
        writable: true,
        value: apiShippingLineItem.ID
    });

    Object.defineProperty(object, 'adjustedPrice', {
        enumerable: true,
        writable: true,
        value: {
            value: apiShippingLineItem.adjustedPrice.valueOrNull,
            formatted: formatMoney(apiShippingLineItem.adjustedPrice)
        }
    });

    Object.defineProperty(object, 'lineItemText', {
        enumerable: true,
        writable: true,
        value: apiShippingLineItem.lineItemText || ''
    });
};
