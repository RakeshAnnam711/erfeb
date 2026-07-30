/* eslint-disable no-param-reassign */

'use strict';

/**
 * Updates SFCC Order Address
 * @param {dw.order.OrderAddress} orderAddress - SFCC Order Address
 * @param {Object} geAddress - Global-e Address
 */
function updateOrderAddress(orderAddress, geAddress) {
    var Encoding = require('dw/crypto/Encoding');
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

    var customOrderAddressFieldsMap = {
        CityRegion: globaleHelpers.customAttr.orderAddress.geCityRegion,
        VATRegistrationNumber: globaleHelpers.customAttr.orderAddress.geVATRegistrationNumber,
        CustomerTaxId: globaleHelpers.customAttr.orderAddress.geCustomerTaxId
    };

    // update sytem attributes
    Object.keys(addressFieldsMap).forEach(function (addressField) {
        if ((addressField in geAddress) && geAddress[addressField] !== null) {
            orderAddress[addressFieldsMap[addressField]](Encoding.fromURI(geAddress[addressField]));
        }
    });

    // update custom attributes
    Object.keys(customOrderAddressFieldsMap).forEach(function (customAddressField) {
        if ((customAddressField in geAddress) && geAddress[customAddressField] !== null) {
            orderAddress.custom[customOrderAddressFieldsMap[customAddressField]] = Encoding.fromURI(geAddress[customAddressField]);
        }
    });
}

module.exports = {
    updateOrderAddress: updateOrderAddress
};
