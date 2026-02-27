'use strict';

var base = module.superModule;

module.exports = Object.create(base, {
    super: {
        enumerable: true,
        value: base
    },
    getApplicableShippingMethods: {
        writable: true,
        value: function (shipment, address) {
            if (!shipment) {
                return null;
            }
            var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
            var shippingMgr = (require('*/cartridge/scripts/factories/globale/shippingMgr'))();
            var collections = require('*/cartridge/scripts/util/collections');

            var shipmentShippingModel = shippingMgr.getShipmentShippingModel(shipment);

            var shippingMethods;
            if (address) {
                shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
            } else {
                shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
            }

            // Filter out whatever the method associated with in store pickup
            var filteredMethods = [];
            collections.forEach(shippingMethods, function (shippingMethod) {
                if (!shippingMethod.custom.storePickupEnabled) {
                    filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
                }
            });

            return filteredMethods;
        }
    },
    getShippingModels: {
        writable: true,
        value: function (lineItemContainer, customer, containerView) {
            var geOrderMgr = require('*/cartridge/scripts/factories/globale/dw/order');
            var ShippingModel = require('*/cartridge/models/shipping');
            var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
            var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

            if (!(
                lineItemContainer
                && (globaleHelpers.customAttr.order.geOrderNumber in lineItemContainer.custom)
                && lineItemContainer.custom[globaleHelpers.customAttr.order.geOrderNumber]
            )) {
                return this.super.getShippingModels.apply(this.super, Array.prototype.slice.call(arguments));
            }

            if (!lineItemContainer.defaultShipment) {
                return [];
            }
            var shippingModel = new ShippingModel(lineItemContainer.defaultShipment, null, customer, containerView);
            var geOrder = geOrderMgr.get(lineItemContainer);

            // handle Mixed order scenario
            if (geOrder.geIsMixedMainOrder()) {
                shippingModel.productLineItems = new ProductLineItemsModel(geOrder.geGetOrderPlis(), containerView);
            }

            return [shippingModel];
        }
    }
});
