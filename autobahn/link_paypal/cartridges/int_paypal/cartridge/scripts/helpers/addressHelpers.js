'use strict';

const addressHelpers = module.superModule;

/**
 * Stores a new address for a given customer
 * @param {Object} address - New address to be saved
 * @param {Object} customer - Current customer
 * @param {string} addressId - Id of a new address to be created
 * @returns {void}
 */
addressHelpers.saveAddress = function(address, customer, addressId) {
    const preferences = require('*/cartridge/config/preferences');

    if (preferences.isDigitalGoodsFlowEnabled) {
        return;
    }

    const Transaction = require('dw/system/Transaction');

    const addressBook = customer.raw.getProfile().getAddressBook();

    Transaction.wrap(function() {
        // Fix an issue in app-storefront-base cartridge with the shipping address updating on the checkout page
        const newAddress = addressBook.getAddress(addressId) || addressBook.createAddress(addressId);

        addressHelpers.updateAddressFields(newAddress, address);
    });
};

module.exports = addressHelpers;
