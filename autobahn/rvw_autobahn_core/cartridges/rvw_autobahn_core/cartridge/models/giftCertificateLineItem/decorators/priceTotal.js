'use strict';

module.exports = function (object, apiProduct) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    Object.defineProperty(object, 'priceTotal', {
        enumerable: true,
        value: {
            nonAdjustedPrice: false,
            price: formatMoney(apiProduct.price),
            priceValue: apiProduct.priceValue
        }
    });
};
