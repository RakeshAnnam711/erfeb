'use strict';

exports.getCustomerAddresses = function (basket) {
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var customerAddressHelpers = require('*/cartridge/scripts/helpers/customerAddressHelpers');

    var customerAddresses = [];

    if (!basket) {
        return customerAddresses;
    }

    var customer = basket.getCustomer();
    var profile = customer.getProfile();
    var addressBook = customer.getAddressBook();

    // get addresses from SFCC address book
    if (addressBook) {
        var prefferedAddress = addressBook.getPreferredAddress();
        collections.forEach(addressBook.addresses, function (address) {
            var isPrefferedAddress = (prefferedAddress && address.ID === prefferedAddress.ID);
            customerAddresses.push(customerAddressHelpers.getAddressDetailsFromAddress(profile, address, isPrefferedAddress).toJSON());
        }, this);
    }

    // get address from profile
    if (!customerAddresses.length && profile) {
        customerAddresses.push(customerAddressHelpers.getAddressDetailsFromProfile(profile).toJSON());
    }

    return customerAddresses;
};
