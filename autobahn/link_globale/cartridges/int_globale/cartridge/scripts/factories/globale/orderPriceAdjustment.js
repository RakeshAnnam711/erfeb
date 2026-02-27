'use strict';

module.exports = function (basket, priceAdjustment, originalDiscounts, proratedPliDiscountedPricesHashMap) {
    var decorators = require('*/cartridge/models/globale/orderPriceAdjustment/decorators/index');
    var object = Object.create(null);
    decorators.base(object, basket, priceAdjustment, originalDiscounts, proratedPliDiscountedPricesHashMap);
    decorators.applicable(object);
    decorators.percentage(object);
    decorators.amount(object);
    decorators.bonusProduct(object);
    decorators.price(object);

    return object;
};
