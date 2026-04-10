"use strict";

var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

module.exports = {
    submit: function(order) {
        try {
            if (order.getCustomerEmail()) {
                COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
            }
            return {
                order_created: true
            };
        } catch (e) {
            Transaction.wrap(function () {
                order.addNote('Failed sending order confirmation email: ', e.message);
            });
            Logger.error('Failed sending order confirmation email: {0} - {1}', e.message, e.stack);
            return {
                error: true
            };
        }
    }
};