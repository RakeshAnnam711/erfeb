'use strict';

var server = require('server');

server.extend(module.superModule);

server.prepend('List', function (req, res, next) {
    var prefs = require('*/cartridge/config/preferences');

    if (!customer || !customer.authenticated || !customer.profile) {
        return next();
    }

    if (prefs && prefs.paypalVaultModeDisabled) {
        return next();
    }

    try {
        var utils = require('*/cartridge/scripts/paypal/utils');
        var paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
        var billingAgreements = utils.tryParseJSON(customer.profile.custom.PP_API_billingAgreement);

        if (!empty(billingAgreements)) {
            paypalHelper.convertBillingAgreements(billingAgreements, customer.profile);
        }
    } catch (e) {
        // Keep saved payment list usable even if PayPal BA conversion fails.
    }

    return next();
});

module.exports = server.exports();
