'use strict';

/**
 * Updates Order Shipping Address
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function updateOrderShippingAddress(order, payload) {
    var Status = require('dw/system/Status');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var orderAddressHelpers = require('*/cartridge/scripts/helpers/orderAddressHelpers');

    try {
        // update shipping address
        var geAddress = objectUtils.getValueByPath(payload, globaleHelpers.consts.geAddresses.PRIMARY_SHIPPING, null);

        if (geAddress !== null && ('CountryCode' in geAddress) && geAddress.CountryCode) {
            collections.forEach(order.shipments, function (shipment) {
                if (('shippingAddress' in shipment) && shipment.shippingAddress) {
                    orderAddressHelpers.updateOrderAddress(shipment.shippingAddress, geAddress);
                }
            });
            this.addNote('Order Shipping Address was updated');
        }
    } catch (e) {
        return new Status(Status.ERROR, '210', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

/**
 * Updates Order Billing Address
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function updateOrderBillingAddress(order, payload) {
    var Status = require('dw/system/Status');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var orderAddressHelpers = require('*/cartridge/scripts/helpers/orderAddressHelpers');

    try {
        // update billing address
        var geAddress = objectUtils.getValueByPath(payload, globaleHelpers.consts.geAddresses.PRIMARY_BILLING, null);

        if (geAddress !== null && ('CountryCode' in geAddress) && geAddress.CountryCode) {
            orderAddressHelpers.updateOrderAddress(order.billingAddress, geAddress);
            this.addNote('Order Billing Address was updated');
        }
    } catch (e) {
        return new Status(Status.ERROR, '210', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        updateOrderShippingAddress: {
            value: updateOrderShippingAddress
        },
        updateOrderBillingAddress: {
            value: updateOrderBillingAddress
        }
    });
};
