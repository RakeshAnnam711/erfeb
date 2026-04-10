/* eslint-disable no-param-reassign */

'use strict';

var geIsEndCustomerPrimary = null;

/**
 * Stores Global-e Address fields to SFCC Order custom attributes
 * @param {string} addressPrefix - Prefix for SFCC Order custom attribute, like 'geShipping' or 'geCustomerBilling'
 * @param {JSON} geAddress - Global-e Address
 * @param {dw.order.Order} order - SFCC order
 */
function updateOrderAddressCustomAttributes(addressPrefix, geAddress, order) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    if (!addressPrefix) {
        addressPrefix = ''; // eslint-disable-line no-param-reassign
    }
    [
        'Address1', 'Address2', 'City', 'CityRegion', 'Company', 'CountryCode', 'CountryName', 'Email', 'Fax',
        'FirstName', 'MiddleName', 'LastName', 'Phone1', 'Phone2', 'Salutation', 'StateCode',
        'StateOrProvince', 'Zip'
    ].forEach(function (addressField) {
        if ((addressField in geAddress) && geAddress[addressField] !== null) {
            var customAttr = (addressPrefix + addressField);
            order.custom[globaleHelpers.customAttr.order[customAttr]] = geAddress[addressField];
        }
    });
}

/**
 * Returns IsEndCustomerPrimary
 * @param {Object} payload - request payload
 * @returns {boolean} - IsEndCustomerPrimary
 */
function getGeIsEndCustomerPrimary(payload) {
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    if (geIsEndCustomerPrimary === null) {
        geIsEndCustomerPrimary = objectUtils.getValueByPath(payload, 'Customer.IsEndCustomerPrimary', true);
    }
    return geIsEndCustomerPrimary;
}

/**
 * Sets Global-e shipping address order custom attributes
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - Global-e shipping address order custom attributes status
 */
function setGeShippingAddressAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var geAddressProp = getGeIsEndCustomerPrimary(payload) ? globaleHelpers.consts.geAddresses.SECONDARY_SHIPPING : globaleHelpers.consts.geAddresses.PRIMARY_SHIPPING;
        var geAddress = objectUtils.getValueByPath(payload, geAddressProp, {});
        var geAddressPrefix = globaleHelpers.consts.geAddresses.GLOBALE_SHIPPING_PREFIX;

        updateOrderAddressCustomAttributes(geAddressPrefix, geAddress, order);
    } catch (e) {
        return new Status(Status.ERROR, '205', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

/**
 * Sets Customer shipping address order custom attributes
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - Customer shipping address order custom attributes status
 */
function setCustomerShippingAddressAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var Encoding = require('dw/crypto/Encoding');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var geAddressPrefix = globaleHelpers.consts.geAddresses.CUSTOMER_SHIPPING_PREFIX;
        var geAddressProp = getGeIsEndCustomerPrimary(payload) ? globaleHelpers.consts.geAddresses.PRIMARY_SHIPPING : globaleHelpers.consts.geAddresses.SECONDARY_SHIPPING;
        var geAddress = objectUtils.getValueByPath(payload, geAddressProp, {});
        var geLocalizedAddress = objectUtils.getValueByPath(payload, 'OrderAddressInCulture.PrimaryShipping', {}) || {};
        var geMergedAddress = objectUtils.map(objectUtils.merge(geAddress, geLocalizedAddress), function (val) {
            return val !== null ? Encoding.fromURI(val) : null;
        });

        updateOrderAddressCustomAttributes(geAddressPrefix, geMergedAddress, order);
    } catch (e) {
        return new Status(Status.ERROR, '205', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

/**
 * Sets Global-e billing address order custom attributes
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - Global-e billing address order custom attributes
 */
function setGeBillingAddressAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var geAddressProp = getGeIsEndCustomerPrimary(payload) ? globaleHelpers.consts.geAddresses.SECONDARY_BILLING : globaleHelpers.consts.geAddresses.PRIMARY_BILLING;
        var geAddress = objectUtils.getValueByPath(payload, geAddressProp, {});
        var geAddressPrefix = globaleHelpers.consts.geAddresses.GLOBALE_BILLING_PREFIX;

        updateOrderAddressCustomAttributes(geAddressPrefix, geAddress, order);
    } catch (e) {
        return new Status(Status.ERROR, '205', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

/**
 * Sets Customer billing address order custom attributes
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - Customer billing address order custom attributes
 */
function setCustomerBillingAddressAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var Encoding = require('dw/crypto/Encoding');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var geAddressPrefix = globaleHelpers.consts.geAddresses.CUSTOMER_BILLING_PREFIX;
        var geAddressProp = getGeIsEndCustomerPrimary(payload) ? globaleHelpers.consts.geAddresses.PRIMARY_BILLING : globaleHelpers.consts.geAddresses.SECONDARY_BILLING;
        var geAddress = objectUtils.getValueByPath(payload, geAddressProp, {});
        var geLocalizedAddress = objectUtils.getValueByPath(payload, 'OrderAddressInCulture.PrimaryBilling', {}) || {};
        var geMergedAddress = objectUtils.map(objectUtils.merge(geAddress, geLocalizedAddress), function (val) {
            return val !== null ? Encoding.fromURI(val) : null;
        });

        updateOrderAddressCustomAttributes(geAddressPrefix, geMergedAddress, order);
    } catch (e) {
        return new Status(Status.ERROR, '205', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geIsEndCustomerPrimary: {
            value: getGeIsEndCustomerPrimary
        },
        setGeShippingAddressAttributes: {
            value: setGeShippingAddressAttributes
        },
        setCustomerShippingAddressAttributes: {
            value: setCustomerShippingAddressAttributes
        },
        setGeBillingAddressAttributes: {
            value: setGeBillingAddressAttributes
        },
        setCustomerBillingAddressAttributes: {
            value: setCustomerBillingAddressAttributes
        }
    });
};
