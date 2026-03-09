'use strict';

var base = module.superModule || {};

var dwLogger = require('dw/system/Logger').getLogger('RVW_SOM_Integration', 'SOM');

/**
 * Allows an override for integrations to implement logic after an order is placed.
 * WGACA customization: set product final_sale attribute to order line item level: somCC_returnable
 * @param {dw.order.Order} order - The order object to be placed
 */
function doPrePlaceOrder(order) {
    if (!empty(order)) {
        var dwTransaction = require('dw/system/Transaction');
        var shipments = order.getShipments();
        
        if (shipments.length > 0) {
            dwTransaction.begin();

            shipments.toArray().forEach(function (shipment) {
                var productLineItems = shipment.getProductLineItems();

                // Product Line Items only
                (productLineItems.length > 0 ? productLineItems.toArray() : [])
                .forEach(function(lineItem) {
                    try {
                        var product = lineItem && lineItem.product;

                        if (!empty(product) && product.custom) {
                            lineItem.custom.somCC_returnable = product.custom.final_sale ? !product.custom.final_sale : true;
                        }
                    } catch(err) {
                        dwLogger.warn('Missing ProductLineItem custom attribute definition: ' + err);
                    }
                });
            });

            dwTransaction.commit();
        }
    }

    if (base && base.doPrePlaceOrder) {
        return base.doPrePlaceOrder.apply(base, arguments);
    } else {
        return { error: false, message: '' };
    }
}

module.exports = {
    doPrePlaceOrder: doPrePlaceOrder
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
