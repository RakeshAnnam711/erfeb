'use strict';

var cart = require('./cart/cart');
var processInclude = require('base/util');

var baseFiles = {
    cart: function () {
        return cart.init.call(cart);
    }
};

module.exports = {
    baseFiles: baseFiles,
    loadFunctions: function () {
        Object.keys(baseFiles).forEach(function (key) {
            processInclude(baseFiles[key]);
        });
    }
};
