'use strict';

/**
 * Updates SFCC Address
 * @param {dw.customer.CustomerAddress} apiAddress - Customer Address
 * @param {Object} geAddress - Global-e Address (customer registration)
 */
function updateCustomerAddress(apiAddress, geAddress) {
    var Encoding = require('dw/crypto/Encoding');

    if (apiAddress && geAddress) {
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
            ZipCode: 'setPostalCode'
        };

        Object.keys(geAddress).forEach(function (prop) {
            if (prop in addressFieldsMap) {
                apiAddress[addressFieldsMap[prop]](Encoding.fromURI((geAddress[prop] || '')));
            }
        });
    }
}

/**
 * Returns AddressDetails
 * @param {dw.customer.Profile} profile - profile
 * @param {dw.customer.CustomerAddress} address - SFCC address
 * @param {boolean} isPrefferedAddress - is preffered address
 * @returns {AddressDetails} - AddressDetails instance
 */
function getAddressDetailsFromAddress(profile, address, isPrefferedAddress) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var AddressDetails = require('*/cartridge/models/globale/api/AddressDetails');

    var addressDetails = new AddressDetails();

    addressDetails.Email = profile.getEmail();
    addressDetails.FirstName = address.getFirstName();
    addressDetails.LastName = address.getLastName();
    addressDetails.Salutation = address.getSalutation();
    addressDetails.Phone1 = address.getPhone();
    addressDetails.Address1 = address.getAddress1();
    addressDetails.Address2 = address.getAddress2();
    addressDetails.City = address.getCity();
    addressDetails.CityRegion = address.custom[globaleHelpers.customAttr.customerAddress.geCityRegion];
    addressDetails.StateOrProvince = address.getStateCode();
    addressDetails.StateCode = address.getStateCode();
    addressDetails.Zip = address.getPostalCode();
    addressDetails.IsShipping = true;
    addressDetails.IsBilling = true;
    addressDetails.SaveAddress = true;
    addressDetails.IsDefaultShipping = isPrefferedAddress;
    addressDetails.IsDefaultBilling = isPrefferedAddress;
    addressDetails.CountryCode = (address.countryCode && address.countryCode.value);

    // set 'AddressBookName'. Used the same approach as in the case when a new address is created from GE order
    addressDetails.AddressBookName = [address.getFirstName(), address.getLastName(), address.getCountryCode()].filter(function (item) { return item !== null; }).join(' ');

    return addressDetails;
}

/**
 * Returns AddressDetails
 * @param {dw.customer.Profile} profile - profile
 * @returns {AddressDetails} - AddressDetails instance
 */
function getAddressDetailsFromProfile(profile) {
    var globaleSession = require('*/cartridge/models/globale/session');
    var AddressDetails = require('*/cartridge/models/globale/api/AddressDetails');

    var addressDetails = new AddressDetails();

    addressDetails.FirstName = profile.getFirstName();
    addressDetails.LastName = profile.getLastName();
    addressDetails.Email = profile.getEmail();
    addressDetails.Fax = profile.getFax();
    addressDetails.IsShipping = true;
    addressDetails.IsBilling = true;
    addressDetails.SaveAddress = true;
    addressDetails.IsDefaultShipping = true;
    addressDetails.CountryCode = globaleSession.get('geCountry');

    return addressDetails;
}

/**
 * Returns AddressDetails
 * @returns {AddressDetails} - AddressDetails instance
 */
function getAddressDetailsDefault() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleSession = require('*/cartridge/models/globale/session');
    var AddressDetails = require('*/cartridge/models/globale/api/AddressDetails');

    var addressDetails = new AddressDetails();

    addressDetails.IsDefaultShipping = true;
    addressDetails.CountryCode = globaleSession.get('geCountry');

    // get guest email
    addressDetails.Email = globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getGuestEmail);

    return addressDetails;
}

module.exports = {
    updateCustomerAddress: updateCustomerAddress,
    getAddressDetailsFromAddress: getAddressDetailsFromAddress,
    getAddressDetailsFromProfile: getAddressDetailsFromProfile,
    getAddressDetailsDefault: getAddressDetailsDefault
};
