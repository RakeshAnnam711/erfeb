'use strict';

var base = module.superModule;
var integrationsOLIPrefs = require('*/cartridge/models/productLineItem/decorators/integrationOrderLineItemPreferences');

function orderLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    integrationsOLIPrefs(product, apiProduct, options);

    return product;
}

module.exports = orderLineItem;
