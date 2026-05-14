'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

server.append('Show', function (_, res, next) {
    const {
        billingAgreementEnabled,
        paypalPaymentMethodId
    } = require('../config/paypalPreferences');

    if (!paypalPaymentMethodId) {
        next();
        return;
    }
    const BillingAgreementModel = require('../models/billingAgreement');
    const billingAgreementModel = new BillingAgreementModel();
    const { createAccountSDKUrl, getUrls } = require('../scripts/paypal/paypalUtils');
    const { filterBillingAgreements } = require('../scripts/paypal/helpers/billingAgreementHelper');
    var savedBA = billingAgreementModel.getBillingAgreements();

    if (!empty(savedBA)) {
        filterBillingAgreements(savedBA, billingAgreementModel);
        savedBA = billingAgreementModel.getBillingAgreements();
    }

    res.setViewData({
        paypal: {
            savedBA: savedBA,
            billingAgreementEnabled: billingAgreementEnabled,
            isBaLimitReached: billingAgreementModel.isBaLimitReached(),
            sdkUrl: createAccountSDKUrl(),
            paypalUrls: JSON.stringify(getUrls())
        }
    });
    next();
});

module.exports = server.exports();
