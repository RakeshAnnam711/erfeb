'use strict';

/**
 * Creates an account model for the current customer
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function getAccountModel(req) {
    var AccountModel = require('*/cartridge/models/account');
    var AddressModel = require('*/cartridge/models/address');
    var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');

    var preferredAddressModel;

    if (!req.currentCustomer.profile) {
        return null;
    }

    var ordersResult = OrderHelpers.getOrders(
        req.currentCustomer,
        req.querystring,
        req.locale.id
    );

    var order = !empty(ordersResult.orders) ? ordersResult.orders[0] : null;

    if (req.currentCustomer.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    return new AccountModel(req.currentCustomer, preferredAddressModel, order);
}

module.exports = {
    getAccountModel: getAccountModel
};

