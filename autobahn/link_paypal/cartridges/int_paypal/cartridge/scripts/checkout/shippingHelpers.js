'use strict';

const base = module.superModule;

const ShippingMgr = require('dw/order/ShippingMgr');

/**
 * Returns the first shipping method (and maybe prevent in store pickup)
 * @param {dw.util.Collection} methods - Applicable methods from ShippingShipmentModel
 * @param {boolean} filterPickupInStore - whether to exclude PUIS method
 * @returns {dw.order.ShippingMethod} - the first shipping method (maybe non-PUIS)
 */
function getFirstApplicableShippingMethod(methods, filterPickupInStore) {
    const prefs = require('*/cartridge/config/preferences');

    if (prefs.isDigitalGoodsFlowEnabled) {
        return methods[0];
    }

    const firstApplicableSM = base.excludeOnlinePickUpSM(methods).find(function(method) {
        return !filterPickupInStore || !method.custom.storePickupEnabled;
    });

    return firstApplicableSM || methods.toArray().pop();
}

/**
 * Updates fields of shipping address
 * @param {Object} address - the address
 * @param {dw.order.Shipment} shipment - Any shipment for the current basket
 */
function updateShippingAddressFields(address, shipment) {
    if (address && shipment) {
        const shippingAddress = shipment.shippingAddress;

        if (shippingAddress) {
            if (address.stateCode && shippingAddress.stateCode !== address.stateCode) {
                shippingAddress.stateCode = address.stateCode;
            }

            if (address.postalCode && shippingAddress.postalCode !== address.postalCode) {
                shippingAddress.postalCode = address.postalCode;
            }
        }
    }
}

/**
 * Excludes the 'onlinePickUp' shipping method from list
 * @param {Collection|Array} shippingMethods A shipping methods list
 * @returns {Array} An array of shipping methods
 */
base.excludeOnlinePickUpSM = function(shippingMethods) {
    const Collection = require('dw/util/Collection');

    const methodsAsArray = shippingMethods instanceof Collection ? shippingMethods.toArray() : shippingMethods;

    return methodsAsArray.filter(function(method) {
        return !method.custom.onlinePickupEnabled;
    });
};

/**
 * Sets the shipping method of the basket's default shipment
 * @param {dw.order.Shipment} shipment - Any shipment for the current basket
 * @param {string} shippingMethodID - The shipping method ID of the desired shipping method
 * @param {dw.util.Collection} shippingMethods - List of applicable shipping methods
 * @param {Object} address - the address
 */
base.selectShippingMethod = function(shipment, shippingMethodID, shippingMethods, address) { // eslint-disable-line max-params
    let applicableShippingMethods;
    let isShipmentSet = false;

    const defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();

    updateShippingAddressFields(address, shipment);

    if (shippingMethods) {
        applicableShippingMethods = shippingMethods;
    } else {
        const shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);

        applicableShippingMethods = address ? shipmentModel.getApplicableShippingMethods(address)
            : shipmentModel.applicableShippingMethods;
    }

    if (shippingMethodID) {
        // loop through the shipping methods to get shipping method
        applicableShippingMethods.toArray().forEach(function(methods) {
            if (methods.ID === shippingMethodID) {
                shipment.setShippingMethod(methods);
                isShipmentSet = true;
            }
        });
    }

    if (!isShipmentSet) {
        if (applicableShippingMethods.toArray().find(function(sMethod) {
            return sMethod.ID === defaultShippingMethod.ID;
        })) {
            shipment.setShippingMethod(defaultShippingMethod);
        } else if (applicableShippingMethods.length > 0) {
            shipment.setShippingMethod(getFirstApplicableShippingMethod(applicableShippingMethods, true));
        } else {
            shipment.setShippingMethod(null);
        }
    }
};

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * Updates base functionality by adding filtering by onlinePickupEnabled custom attribute
 * @param {dw.order.Shipment} shipment - the target Shipment
 * @param {Object} [address] - optional address object
 * @returns {dw.util.Collection} an array of ShippingModels
 */
base.getApplicableShippingMethods = function(shipment, address) {
    const prefs = require('*/cartridge/config/preferences');

    if (!shipment) {
        return null;
    }

    const ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');

    let applicableShippingMethods;
    let shippingMethods;

    if (prefs.isDigitalGoodsFlowEnabled) {
        const Site = require('dw/system/Site');
        const currencyCode = shipment ? shipment.shippingMethod.currencyCode : Site.getCurrent().getDefaultCurrency();
        const onlinePickupShippingMethod = base.getOnlinePickupShippingMethod(currencyCode);

        applicableShippingMethods = [new ShippingMethodModel(onlinePickupShippingMethod, shipment)];
    } else {
        const shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

        if (address) {
            shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
        } else {
            shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
        }

        // Filter out whatever the method associated with in store pickup or with online pick up
        const filteredMethods = shippingMethods.toArray().filter(function(shippingMethod) {
            return !shippingMethod.custom.storePickupEnabled;
        });

        applicableShippingMethods = base.excludeOnlinePickUpSM(filteredMethods).reduce(function(accum, cur) {
            accum.push(new ShippingMethodModel(cur, shipment));

            return accum;
        }, []);
    }

    return applicableShippingMethods;
};

/**
 * Returns an online pickup shipping method for current locale
 * @param {string} currencyCode The basket currency code
 * @returns {dw.order.ShippingMethod} An online pickup shipping method for current locale
 */
base.getOnlinePickupShippingMethod = function(currencyCode) {
    return ShippingMgr.allShippingMethods.toArray().find(function(shippingMethod) {
        return shippingMethod.currencyCode === currencyCode && shippingMethod.custom.onlinePickupEnabled;
    });
};

/**
 * Update prices based on current basket for applicable shipping options
 * @param {Array} applicableShippingMethods - applicable shipping methods
 * @param {Array} allShippingMethods - all the shipping methods
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {Array} updated shipping options with price adjustments
 */
base.getShippingOptionsPricesWithAdjustments = function(applicableShippingMethods, allShippingMethods, basket) {
    const Transaction = require('dw/system/Transaction');
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    const shipment = basket.defaultShipment;
    const selectedShippingMethod = shipment.shippingMethod;

    Transaction.wrap(function() {
        applicableShippingMethods.forEach(function(shippingOption) {
            const shippingMethod = allShippingMethods.find(function(method) {
                return method.ID === shippingOption.ID;
            });

            shipment.setShippingMethod(shippingMethod);
            basketCalculationHelpers.calculateTotals(basket);

            const shippingTotal = shipment.getShippingTotalPrice();

            shippingOption.shippingCost = shippingTotal.value;
        });

        shipment.setShippingMethod(selectedShippingMethod);
        basketCalculationHelpers.calculateTotals(basket);
    });

    return applicableShippingMethods;
};

module.exports = base;
