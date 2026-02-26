'use strict';

module.exports = function (object, quantity) {
    var Quantity = require('dw/value/Quantity');
    Object.defineProperties(object, {
        quantity: {
            enumerable: true,
            value: ((quantity instanceof Quantity) ? (Number(quantity.value) || 1) : (Number(quantity) || 1))
        }
    });
};
