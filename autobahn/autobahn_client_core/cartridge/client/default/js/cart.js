'use strict';

var cart = require('./cart/cart');
var integrations = require('integrations/cart');

integrations.baseFiles.cart = function () {
    return cart.init.call(cart);
}

module.exports = integrations;
