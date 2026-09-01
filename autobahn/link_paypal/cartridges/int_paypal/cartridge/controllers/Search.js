'use strict';

/**
 * @namespace Search
 */

const server = require('server');

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);

server.append('Show', csrfProtection.generateToken, function(req, res, next) {
    const BasketMgr = require('dw/order/BasketMgr');

    const prefs = require('*/cartridge/config/preferences');
    const constants = require('*/cartridge/config/constants');
    const paypalSDK = require('*/cartridge/config/sdk');
    const paypalApi = require('*/cartridge/scripts/paypal/api');
    const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
    const payLaterMessagingConfig = require('*/cartridge/config/payLaterMessagingConfig');
    const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');

    const isExpressCheckout = true;
    const isReturningCustomerEnabled = paypalHelper.isReturningCustomerExperienceEnabled(isExpressCheckout);
    const payLaterMessageAvailable = prefs.isPayPalPmActive
        && payLaterMessagingConfig[constants.PAGE_FLOW_CATEGORY].status === constants.STATUS_ENABLED;
    const isPayPalEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_MINICART, constants.PAYPAL_BUTTON_LOCATION)
        || paymentHelper.isElementEnabled(constants.PAGE_FLOW_PVP, constants.PAYPAL_BUTTON_LOCATION);
    const isVenmoEnabled = paymentHelper.isVenmoEnabled(constants.PAGE_FLOW_PVP)
        || paymentHelper.isVenmoEnabled(constants.PAGE_FLOW_MINICART);

    if (payLaterMessageAvailable) {
        res.setViewData({
            paypal: {
                partnerAttributionId: prefs.partnerAttributionId,
                sdkUrl: isPayPalEnabled || isVenmoEnabled
                    ? paypalSDK.cartSdkUrl
                    : paypalHelper.createCreditMessageSdkUrl()
            },
            paylaterMessaging: {
                config: Object.assign({}, payLaterMessagingConfig.category, {
                    amount: BasketMgr.currentOrNewBasket.totalGrossPrice.value
                })
            },
            paylaterMessagingAvailable: payLaterMessageAvailable
        });

        paypalHelper.updateViewDataForPayLaterCrossBorderMessaging(res, req);
    }

    if (isReturningCustomerEnabled) {
        if ('paypal' in res.viewData) {
            res.viewData.paypal.userIdToken = paypalApi.generateUserIdToken();
        } else {
            res.setViewData({
                paypal: {
                    userIdToken: paypalApi.generateUserIdToken()
                }
            });
        }
    }

    res.viewData.applePaySdk = prefs.applePaySdk;

    next();
});

module.exports = server.exports();
