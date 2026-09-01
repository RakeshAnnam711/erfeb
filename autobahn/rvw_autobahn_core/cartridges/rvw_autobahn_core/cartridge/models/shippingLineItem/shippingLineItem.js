'use strict';

var shippingLineItemDecorator = require('*/cartridge/models/shippingLineItem/decorators/shippingLineItem');

module.exports = function productLineItem(shippingLineItem) {
    shippingLineItemDecorator(this, shippingLineItem);
};
