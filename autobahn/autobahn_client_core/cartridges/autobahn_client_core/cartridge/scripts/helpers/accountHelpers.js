'use strict';

var base = module.superModule;
var baseSendCreateAccountEmail = base.sendCreateAccountEmail;
var CustomerMgr = require('dw/customer/CustomerMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
const query = 'customerEmail = {0}';
const sort = 'creationDate desc';

/**
 * Send an email that would notify the user that account was created
 * @param {obj} registeredUser - object that contains user's email address and name information.
 */
base.sendCreateAccountEmail = function (registeredUser) {
    var Site = require('dw/system/Site');

    if (!Site.getCurrent().getCustomPreferenceValue('disableAccountRegistrationEmailSend')) {
        baseSendCreateAccountEmail.apply(this, arguments);
    }
};

/**
 * Link given orders to given email customer account
 * @param {string[]} orderIds
 * @param {string} customerEmail
 */
base.linkOrdersToCustomerAccount = function (orderIds, customerEmail) {
    const queryForOrderId = 'orderNo = {0}';
    try {
        var customer = CustomerMgr.getCustomerByLogin(customerEmail);
        if (customer) {
            orderIds.forEach((orderId) => {
                try {
                    var order = OrderMgr.searchOrder(queryForOrderId, orderId);
                    linkOrderToCustomer(order, customer);
                } catch(orderErr) {
                    Logger.error('linkOrdersToCustomerAccount(): Failed to link OrderId: [{0}] to CustomerEmail: [{1}]', orderId, customerEmail, orderErr);
                }
            });
        }
    } catch(err) {
        Logger.error('linkOrdersToCustomerAccount(): Failed to link OrderId to CustomerEmail: [{0}]', customerEmail, err);
    }
}

/**
 * Link given order to given customer
 * @param {dw.order.Order} order
 * @param {dw.customer.Customer} customer
 * @returns
 */
function linkOrderToCustomer(order, customer) {
    if (!order || !customer) {
        Logger.error('linkOrderToCustomer(): Unable to fetch OrderId: [{0}] or CustomerEmail: [{1}]', order.orderNo, customer.profile.email, orderErr);
        return;
    }
    try {
        Transaction.wrap(function () {
            order.setCustomer(customer);
        });
    } catch(orderErr) {
        Logger.error('linkOrderToCustomer(): Failed to link OrderId: [{0}] to CustomerEmail: [{1}]', order.orderNo, customer.profile.email, orderErr);
    }
}

module.exports = base;
