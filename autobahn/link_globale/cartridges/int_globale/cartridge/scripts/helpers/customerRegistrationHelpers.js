'use strict';

/**
 * Checks if a customer has account
 * @param {Object} jsonPayload - payload
 * @returns {Object} - verification result
 */
function customerVerification(jsonPayload) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var result = {
        success: false, registered: null, errorCode: null, eventName: 'status'
    };
    try {
        result.registered = CustomerMgr.getCustomerByLogin(jsonPayload.eventData.Customer.Email) !== null;
        result.success = true;
    } catch (e) {
        result.success = false;
        result.errorCode = 1;
        logger.error('GLOBALE_REGISTER_CUSTOMER: {0}', logger.message(e));
    }

    return result;
}

/**
 * Registers a new customer account
 * @param {Object} jsonPayload - payload
 * @returns {Object} - registration result
 */
function customerRegistration(jsonPayload) {
    var Transaction = require('dw/system/Transaction');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var result = {
        success: false, registered: null, errorCode: null, eventName: 'register'
    };
    var customer = null;
    try {
        try {
            Transaction.begin();
            // check if customer exists
            if (CustomerMgr.getCustomerByLogin(jsonPayload.eventData.Customer.Email) !== null) {
                result.errorCode = 3;
                throw new Error('Customer already exists.');
            }

            // create a new customer
            customer = CustomerMgr.createCustomer(jsonPayload.eventData.Customer.Email, jsonPayload.eventData.Customer.Password);
            if (customer === null) {
                result.errorCode = 4;
                throw new Error('New customer was not created.');
            }

            // update customer profile
            customer.profile.setEmail(jsonPayload.eventData.Customer.Email);
            customer.profile.setFirstName(jsonPayload.eventData.Customer.BillingAddress.FirstName);
            customer.profile.setLastName(jsonPayload.eventData.Customer.BillingAddress.LastName);

            if (jsonPayload.eventData.Customer.BillingAddress.PhoneNumber) {
                customer.profile.setPhoneMobile(jsonPayload.eventData.Customer.BillingAddress.PhoneNumber);
            }

            if (jsonPayload.eventData.Customer.BillingAddress.Salutation) {
                // eslint-disable-next-line radix
                customer.profile.custom[globaleHelpers.customAttr.profile.geSalutation] = parseInt(globaleHelpers.salutation[jsonPayload.eventData.Customer.BillingAddress.Salutation]);
            }

            // authorize the customer
            var authStatus = CustomerMgr.authenticateCustomer(jsonPayload.eventData.Customer.Email, jsonPayload.eventData.Customer.Password);
            if (!authStatus.isAuthenticated()) {
                result.errorCode = 5;
                throw new Error('New customer was not authenticated.');
            }

            // login the customer
            CustomerMgr.loginCustomer(authStatus, false);

            Transaction.commit();

            result.success = true;
            result.registered = true;
        } catch (e) {
            result.success = false;
            result.registered = null;
            result.errorCode = result.errorCode || 2;
            Transaction.rollback();
            logger.error('GLOBALE_REGISTER_CUSTOMER: {0}', logger.message(e));
            throw new Error('Customer registration error.');
        }

        try {
            var order = OrderMgr.getOrder(jsonPayload.eventData.Order.MerchantOrderId);
            if (order === null) {
                order = OrderMgr.searchOrder('custom.' + globaleHelpers.customAttr.order.geOrderNumber + ' = {0}', jsonPayload.eventData.Order.OrderId);
            }
            if (order === null) {
                throw new Error('The order does not exist. Were used for search MerchantOrderID = ' + jsonPayload.eventData.Order.MerchantOrderId + '; OrderID = ' + jsonPayload.eventData.Order.OrderId);
            }

            // assign the order to the new customer
            if (order.status.value === Order.ORDER_STATUS_CREATED && order.customer.anonymous) {
                // if registration request is done before SOTM
                Transaction.wrap(function () {
                    order.setCustomer(customer);
                });
            } else if (
                order.custom.geOrderNumber &&
                order.custom.geOrderNumber === jsonPayload.eventData.Order.OrderId &&
                order.customer.anonymous
            ) {
                // if registration request is done after SOTM
                Transaction.wrap(function () {
                    order.setCustomer(customer);
                });

                // save customer addresses
                Transaction.wrap(function () {
                    try {
                        var Encoding = require('dw/crypto/Encoding');
                        var customerAddressHelpers = require('*/cartridge/scripts/helpers/customerAddressHelpers');

                        var addressBook = customer.getAddressBook();

                        // Save Shipping Address
                        var shippingAddressId = [];
                        shippingAddressId.push(Encoding.fromURI(jsonPayload.eventData.Customer.ShippingAddress.FirstName));
                        shippingAddressId.push(Encoding.fromURI(jsonPayload.eventData.Customer.ShippingAddress.LastName));
                        shippingAddressId.push(Encoding.fromURI(jsonPayload.eventData.Customer.ShippingAddress.CountryCode));
                        shippingAddressId = shippingAddressId.join(' ');

                        var shippingAddress = addressBook.createAddress(shippingAddressId);
                        addressBook.setPreferredAddress(shippingAddress);
                        customerAddressHelpers.updateCustomerAddress(shippingAddress, jsonPayload.eventData.Customer.ShippingAddress);
                    } catch (e) {
                        logger.error('GLOBALE_REGISTER_CUSTOMER: {0}', logger.message(e));
                    }
                });
            }
        } catch (e) {
            logger.error('GLOBALE_REGISTER_CUSTOMER: {0}', logger.message(e));
        }
    } catch (e) {
        logger.error('GLOBALE_REGISTER_CUSTOMER: {0}', logger.message(e));
    }

    return result;
}

module.exports = {
    customerVerification: customerVerification,
    customerRegistration: customerRegistration
};
