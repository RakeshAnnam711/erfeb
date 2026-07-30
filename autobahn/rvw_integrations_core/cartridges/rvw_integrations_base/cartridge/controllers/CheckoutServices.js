'use strict';

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var checkoutServicesHelpers = require('*/cartridge/scripts/helpers/checkoutServicesHelpers');

server.replace('SubmitPayment', server.middleware.https, csrfProtection.validateAjaxRequest, checkoutServicesHelpers.submitPayment);

//TODO RVW modularize this so these alternate checkouts don't require manual syncing
//TODO RVW make "review" status configurable (created vs place order, unconfirmed vs confirmed, not exported vs ready for export etc...)
//NOTE Try to keep this in sync with both adyen and cybersource applepay checkouts
//NOTE Try to keep this in sync controller Adyen alternate checkouts (x4) (Adyen-ShowConfirmation is used for Klarna)
server.replace('PlaceOrder', server.middleware.https, checkoutServicesHelpers.placeOrder);

module.exports = server.exports();
