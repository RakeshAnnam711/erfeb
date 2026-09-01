'use strict';

module.exports = function (productLineItem, priceAdjustment, originalDiscounts, pliProrationData) {
    var decorators = require('*/cartridge/models/globale/productPriceAdjustment/decorators/index');
    var object = Object.create(null);
    decorators.base(object, productLineItem, priceAdjustment, originalDiscounts, pliProrationData);
    decorators.applicable(object);
    decorators.percentage(object);
    decorators.amount(object);
    decorators.fixedPrice(object);
    decorators.totalFixedPrice(object);
    decorators.pricebookPrice(object);
    decorators.bonusProduct(object);
    decorators.free(object);
    decorators.price(object);

    return object;
};
