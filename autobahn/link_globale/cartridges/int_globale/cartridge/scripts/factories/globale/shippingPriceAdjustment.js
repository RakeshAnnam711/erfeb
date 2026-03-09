'use strict';

module.exports = function (basket, priceAdjustment) {
    var decorators = require('*/cartridge/models/globale/shippingPriceAdjustment/decorators/index');
    var object = Object.create(null);
    decorators.base(object, basket, priceAdjustment);
    decorators.applicable(object);

    return object;
};
