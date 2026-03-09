/* globals session */

'use strict';

var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Find SFCC Shipping Method by ID
 * @param {string|null} shippingMethodId - Shipping Method Id
 * @param {string} currencyCode - order currency code
 * @returns {dw.order.ShippingMethod} - SFCC ShippingMethod
 */
function getShippingMethodByID(shippingMethodId, currencyCode) {
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var shippingMgr = (require('*/cartridge/scripts/factories/globale/shippingMgr'))();

    if (shippingMethodId === null) {
        return null;
    }

    // set session currency
    session.setCurrency(require('dw/util/Currency').getCurrency(currencyCode));

    var shippingMethod = collections.find(shippingMgr.getAllShippingMethods(true), function (shipMethod) {
        return shipMethod.ID === shippingMethodId;
    });

    return shippingMethod;
}

/**
 * Updates SFCC Order Shipping Method to what is received in Payload Data from Global-e
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function updateShippingMethod(order, payload) {
    var Status = require('dw/system/Status');
    var Money = require('dw/value/Money');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var shipmentFactory = require('*/cartridge/scripts/factories/globale/dw/shipment');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var baseCurrencyUsed = order.currencyCode === globaleHelpers.getMerchantBaseCurrencyCode();
        var shippingMethodCode = objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingMethodCode', null);
        var shippingMethodId = baseCurrencyUsed ? shippingMethodCode : (shippingMethodCode + '_' + order.currencyCode);
        var shippingMethod = getShippingMethodByID(shippingMethodId, order.currencyCode);

        if (shippingMethod === null) {
            shippingMethodCode = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geDefaultShippingMethod);
            shippingMethodId = baseCurrencyUsed ? shippingMethodCode : (shippingMethodCode + '_' + order.currencyCode);
            shippingMethod = getShippingMethodByID(shippingMethodId, order.currencyCode);
        }

        if (shippingMethod === null) {
            return new Status(Status.ERROR, '203', 'Can\'t find Shipping Method with ID: ' + shippingMethodId);
        }

        if (shippingMethod.currencyCode !== order.currencyCode) {
            return new Status(Status.ERROR, '203', 'Shipping Method ' + shippingMethodId + 'currency code doesn\'t match order currency code');
        }

        var shippingPriceInMerchantCurrency = new Money(Number(objectUtils.getValueByPath(payload, 'DiscountedShippingPrice', 0)), order.currencyCode);
        var shippingVatRate = Number(objectUtils.getValueByPath(payload, 'ShippingVATRate', 0));

        collections.forEach(order.shipments, function (shipment) {
            var geShipment = shipmentFactory.get(shipment);
            geShipment.setShippingMethod(shippingMethod);
            if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccUseGEShippingPrice, false, 'boolean')) {
                geShipment.geSetShipmentShippingPrice(shippingPriceInMerchantCurrency, (shippingVatRate / 100));
            }
        });

        // update order totals
        order.updateTotals();

        this.addNote('ShippingMethod \'' + shippingMethodId + '\' has been set to each Order.shipment');
    } catch (e) {
        return new Status(Status.ERROR, '203', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'updateShippingMethod', {
        value: updateShippingMethod
    });
};
