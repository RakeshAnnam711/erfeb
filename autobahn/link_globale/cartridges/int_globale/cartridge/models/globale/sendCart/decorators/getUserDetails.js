'use strict';

/**
 * Calculates UserDetails for Global-e SendCart API object
 * @returns {Object} - Global-e SendCart.UserDetails API object
 */
function getUserDetails() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var customerAddressHelpers = require('*/cartridge/scripts/helpers/customerAddressHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    var customer = this.basket.getCustomer();
    var profile = customer.getProfile();

    var userDetails = {
        UserId: customer.isRegistered() ? profile.customerNo : null,
        AddressDetails: []
    };

    try {
        var addressDetails = globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.sendCart.getCustomerAddresses, this.basket);
        if (addressDetails) {
            userDetails.AddressDetails = ('toArray' in addressDetails) ? addressDetails.toArray() : addressDetails;
        }
    } catch (e) {
        userDetails.AddressDetails = [];
    }

    // get empty address (at least one address required)
    if (!userDetails.AddressDetails.length) {
        userDetails.AddressDetails.push(customerAddressHelpers.getAddressDetailsDefault().toJSON());
    }

    return userDetails;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getUserDetails', {
        value: getUserDetails
    });
};
