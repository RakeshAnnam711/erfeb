'use strict';

var base = module.superModule;
var agentLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');

module.exports = function productLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    agentLocks.decorateProductLineItem(product, options.lineItem);

    return product;
};
