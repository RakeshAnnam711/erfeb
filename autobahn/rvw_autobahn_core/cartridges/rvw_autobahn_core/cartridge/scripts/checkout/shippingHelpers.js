'use strict';

var base = module.superModule;

var ShippingLineItemModel = require('*/cartridge/models/shippingLineItem/shippingLineItem');

function getShippingLineItemModels(shipment) {
    var result = [];
    var shippingLineItems = shipment.shippingLineItems.iterator();
    while (shippingLineItems.hasNext()) {
        var shippingLineItem = shippingLineItems.next();
        result.push(new ShippingLineItemModel(shippingLineItem));
    }

    return result;
}

module.exports = {
    getShippingLineItemModels: getShippingLineItemModels
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
