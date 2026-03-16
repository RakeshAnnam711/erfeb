'use strict';

var Encoding = require('dw/crypto/Encoding');

/**
 * Updates SFCC Customer Address
 * @param {dw.customer.CustomerAddress} customerAddress - SFCC Customer Address
 * @param {Object} geAddress - Global-e Address
 */
function updateAddress(customerAddress, geAddress) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var addressFieldsMap = {
        Address1: 'setAddress1',
        Address2: 'setAddress2',
        City: 'setCity',
        Company: 'setCompanyName',
        CountryCode: 'setCountryCode',
        FirstName: 'setFirstName',
        LastName: 'setLastName',
        MiddleName: 'setSecondName',
        Phone1: 'setPhone',
        Salutation: 'setSalutation',
        StateCode: 'setStateCode',
        Zip: 'setPostalCode'
    };

    var customCustomerAddressFieldsMap = {
        CityRegion: globaleHelpers.customAttr.customerAddress.geCityRegion
    };

    Object.keys(addressFieldsMap).forEach(function (addressField) {
        if ((addressField in geAddress) && geAddress[addressField] !== null) {
            customerAddress[addressFieldsMap[addressField]](geAddress[addressField]);
        }
    });

    Object.keys(customCustomerAddressFieldsMap).forEach(function (customAddressField) {
        if ((customAddressField in geAddress) && geAddress[customAddressField] !== null) {
            // eslint-disable-next-line no-param-reassign
            customerAddress.custom[customCustomerAddressFieldsMap[customAddressField]] = geAddress[customAddressField];
        }
    });
}

/**
 * Creates/Updates AddressBook address
 * @param {dw.customer.AddressBook} addressBook - AddressBook
 * @param {Object} geAddress - Global-e Address
 */
function processAddress(addressBook, geAddress) {
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    var addressId = objectUtils.getValueByPath(geAddress, 'AddressBookName', '');
    var dwAddress = null;

    if (!addressId) {
        addressId = [];
        var fisrtName = objectUtils.getValueByPath(geAddress, 'FirstName', '');
        if (fisrtName) {
            addressId.push(fisrtName);
        }

        var lastName = objectUtils.getValueByPath(geAddress, 'LastName', '');
        if (lastName) {
            addressId.push(lastName);
        }

        var addressCountry = objectUtils.getValueByPath(geAddress, 'CountryCode', '');
        if (addressCountry) {
            addressId.push(addressCountry);
        }

        addressId = addressId.join(' ');
    }

    dwAddress = addressBook.getAddress(addressId);

    if (dwAddress === null) {
        dwAddress = addressBook.createAddress(addressId);
    }

    updateAddress(dwAddress, geAddress);

    if (!addressBook.getPreferredAddress()) {
        addressBook.setPreferredAddress(dwAddress);
    }
}

/**
 * Creates/Updates Cutomer Addresses (AddressBook)
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function updateCustomerAddresses(order, payload) {
    var Status = require('dw/system/Status');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var orderCustomer = order.getCustomer();
        if (!orderCustomer || !orderCustomer.isRegistered()) {
            return new Status(Status.OK, '0', '');
        }

        var addressBook = orderCustomer.getAddressBook();

        if (objectUtils.getValueByPath(payload, 'PrimaryShipping.SaveAddress', null) === true) {
            var primaryShippingAddress = objectUtils.getValueByPath(payload, 'PrimaryShipping', {});
            var localizedPrimaryShippingAddress = objectUtils.getValueByPath(payload, 'OrderAddressInCulture.PrimaryShipping', {}) || {};
            var shippingAddress = objectUtils.map(objectUtils.merge(primaryShippingAddress, localizedPrimaryShippingAddress), function (val) {
                return val !== null ? Encoding.fromURI(val) : null;
            });

            processAddress(addressBook, shippingAddress);
        }

        if (objectUtils.getValueByPath(payload, 'PrimaryBilling.SaveAddress', null) === true) {
            var primaryBillingAddress = objectUtils.getValueByPath(payload, 'PrimaryBilling', {});
            var localizedPrimaryBillingAddress = objectUtils.getValueByPath(payload, 'OrderAddressInCulture.PrimaryBilling', {}) || {};
            var billingAddress = objectUtils.map(objectUtils.merge(primaryBillingAddress, localizedPrimaryBillingAddress), function (val) {
                return val !== null ? Encoding.fromURI(val) : null;
            });

            processAddress(addressBook, billingAddress);
        }
    } catch (e) {
        return new Status(Status.ERROR, '210', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'updateCustomerAddresses', {
        value: updateCustomerAddresses
    });
};
