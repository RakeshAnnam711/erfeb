/* eslint-disable require-jsdoc */
'use strict';

var ShippingMgr = require('dw/order/ShippingMgr');
var collections = require('*/cartridge/scripts/util/collections');
var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');

var base = module.superModule;

function getFirstApplicableShippingMethod(methods) {
    var method;
    var iterator = methods.iterator();
    while (iterator.hasNext()) {
        method = iterator.next();
        if (!method.custom.isFlowShippingMethod && !method.custom.storePickupEnabled) {
            break;
        }
    }

    return method;
}

function ensureShipmentHasMethod(shipment) {
    var shippingMethod = shipment.shippingMethod;
    var methods;
    var defaultMethod;

    if (!shippingMethod || shippingMethod.custom.isFlowShippingMethod) {
        methods = ShippingMgr.getShipmentShippingModel(shipment).applicableShippingMethods;
        defaultMethod = ShippingMgr.getDefaultShippingMethod();

        if (!defaultMethod) {
            // If no defaultMethod set, just use the first one
            shippingMethod = getFirstApplicableShippingMethod(methods);
        } else {
            // Look for defaultMethod in applicableMethods
            shippingMethod = collections.find(methods, function (method) {
                return method.ID === defaultMethod.ID;
            });
        }

        // If found, use it.  Otherwise return the first one
        if (!shippingMethod && methods && methods.length > 0) {
            shippingMethod = getFirstApplicableShippingMethod(methods);
        }

        if (shippingMethod) {
            shipment.setShippingMethod(shippingMethod);
        }
    }
}

function getApplicableShippingMethods(shipment, address) {
    var filteredMethods = [];
    var shipmentShippingModel;
    var shippingMethods;

    if (!shipment) return null;

    shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    if (address) {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
    } else {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    // Filter out whatever the method associated with in store pickup & flow shipping methods
    collections.forEach(shippingMethods, function (shippingMethod) {
        if (!shippingMethod.custom.storePickupEnabled && !shippingMethod.custom.isFlowShippingMethod) {
            filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
        }
    });

    return filteredMethods;
}

module.exports = {
    getShippingModels: base.getShippingModels,
    selectShippingMethod: base.selectShippingMethod,
    ensureShipmentHasMethod: ensureShipmentHasMethod,
    getShipmentByUUID: base.getShipmentByUUID,
    getAddressFromRequest: base.getAddressFromRequest,
    getApplicableShippingMethods: getApplicableShippingMethods
};
