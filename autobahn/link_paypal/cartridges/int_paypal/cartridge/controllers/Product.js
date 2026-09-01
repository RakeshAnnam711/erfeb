'use strict';

const server = require('server');

const BasketMgr = require('dw/order/BasketMgr');

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const prefs = require('*/cartridge/config/preferences');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');
const googlePayHelper = require('*/cartridge/scripts/paypal/helpers/googlePayHelper');
const constants = require('*/cartridge/config/constants');
const paypalApi = require('*/cartridge/scripts/paypal/api');

server.extend(module.superModule);

server.append('Show', csrfProtection.generateToken, function(req, res, next) {
    if ((!prefs.isPayPalPmActive && !prefs.isVenmoEnabled) || !paypalHelper.isAtLeastOnePaymentMethodEnabled()) {
        return next();
    }

    const paypalSDK = require('*/cartridge/config/sdk');

    const isExpressCheckout = true;
    const isPaypalButtonEnabled = prefs.isPayPalPmActive
        && paymentHelper.isElementEnabled(constants.PAGE_FLOW_PDP, constants.PAYPAL_BUTTON_LOCATION);
    const isVenmoButtonEnabled = paymentHelper.isVenmoEnabled(constants.PAGE_FLOW_PDP);

    const isPayPalButtonMessageEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_PDP, constants.PAYPAL_BUTTON_MESSAGE);

    paypalHelper.processPaylaterMessagingConfiguration(req, res, constants.PAGE_FLOW_PRODUCT);

    const basket = BasketMgr.getCurrentBasket();
    const paypalPaymentInstrument = basket && paymentInstrumentHelper.getPaypalPaymentInstrument(basket) || null;
    const isReturningCustomerEnabled = paypalHelper.isReturningCustomerExperienceEnabled(isExpressCheckout);

    let userIdToken = null;

    if (isReturningCustomerEnabled) {
        userIdToken = paypalApi.generateUserIdToken();
    }

    res.setViewData({
        paypal: {
            sdkUrl: paypalSDK.cartSdkUrl,
            partnerAttributionId: prefs.partnerAttributionId,
            venmoOrPayPalButtonEnabled: isPaypalButtonEnabled || isVenmoButtonEnabled,
            buttonsToRender: JSON.stringify({
                paypal: isPaypalButtonEnabled,
                venmo: isVenmoButtonEnabled
            }),
            isPayPalButtonMessageEnabled: isPayPalButtonMessageEnabled,
            buttonConfig: prefs.paypalPdpButtonConfig,
            buttonMessageConfig: paypalHelper.getButtonMessageConfig(constants.PAGE_FLOW_PDP, res),
            billingFormFields: paypalHelper.getPreparedBillingFormFields(paypalPaymentInstrument),
            userIdToken: userIdToken,
            customerEmail: paypalHelper.getCustomerEmailOrEmpty()
        }
    });

    const isApplePayPdpButtonEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_PDP, constants.APPLE_PAY_BUTTON_LOCATION);
    const isApplePayEnabled = isApplePayPdpButtonEnabled && prefs.isApplePayPmActive;

    res.viewData.paypal.isApplePayPdpButtonEnabled = isApplePayEnabled;

    if (isApplePayEnabled) {
        res.viewData.paypal.applePayConfigs = paymentHelper.getApplePayConfigs(constants.PAGE_FLOW_PDP);
        res.viewData.paypal.applePayFormFields = paypalHelper.getApplePayFormFields();
    }

    const isGooglePayPdpButtonEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_PDP, constants.GOOGLE_PAY_BUTTON_LOCATION);
    const isGooglePayEnabled = isGooglePayPdpButtonEnabled && prefs.isGooglePayActive;

    res.viewData.paypal.isGooglePayPdpButtonEnabled = isGooglePayEnabled;

    if (isGooglePayEnabled) {
        const billingForm = server.forms.getForm('billing');

        billingForm.clear();

        res.viewData.paypal.googlePayFormFields = JSON.stringify(googlePayHelper.getGooglePayFormFields(billingForm));
        res.viewData.paypal.googlePayConfigs = googlePayHelper.getGooglePayConfigs(constants.PAGE_FLOW_PDP);
    }

    paypalHelper.updateViewDataForFraudNet(res);

    return next();
});

server.append('ShowQuickView', csrfProtection.generateToken, function(req, res, next) {
    if ((!prefs.isPayPalPmActive && !prefs.isVenmoEnabled) || !paypalHelper.isAtLeastOnePaymentMethodEnabled()) {
        return next();
    }

    const isExpressCheckout = true;
    const basket = BasketMgr.getCurrentBasket();
    const isPayPalButtonMessageEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_PVP, constants.PAYPAL_BUTTON_MESSAGE);
    const isPvpButtonEnabled = prefs.isPayPalPmActive
        && paymentHelper.isElementEnabled(constants.PAGE_FLOW_PVP, constants.PAYPAL_BUTTON_LOCATION);
    const isVenmoButtonEnabled = paymentHelper.isVenmoEnabled(constants.PAGE_FLOW_PVP);

    const paypalPaymentInstrument = basket && paymentInstrumentHelper.getPaypalPaymentInstrument(basket) || null;
    const isReturningCustomerEnabled = paypalHelper.isReturningCustomerExperienceEnabled(isExpressCheckout);

    let userIdToken = null;

    if (isReturningCustomerEnabled) {
        userIdToken = paypalApi.generateUserIdToken();
    }

    paypalHelper.processPaylaterMessagingConfiguration(req, res, constants.PAGE_FLOW_PRODUCT_PREVIEW);

    res.setViewData({
        paypal: {
            partnerAttributionId: prefs.partnerAttributionId,
            venmoOrPayPalButtonEnabled: isPvpButtonEnabled || isVenmoButtonEnabled,
            buttonsToRender: JSON.stringify({
                paypal: isPvpButtonEnabled,
                venmo: isVenmoButtonEnabled
            }),
            isPayPalButtonMessageEnabled: isPayPalButtonMessageEnabled,
            buttonConfig: prefs.paypalPvpButtonConfig,
            buttonMessageConfig: paypalHelper.getButtonMessageConfig(constants.PAGE_FLOW_PVP, res),
            billingFormFields: paypalHelper.getPreparedBillingFormFields(paypalPaymentInstrument),
            digitalGoodsData: {
                isDigitalGoodsFlowEnabled: prefs.isDigitalGoodsFlowEnabled
            },
            isPayPalPmActive: prefs.isPayPalPmActive,
            userIdToken: userIdToken,
            customerEmail: paypalHelper.getCustomerEmailOrEmpty()
        }
    });

    const isApplePayPvpButtonEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_PVP, constants.APPLE_PAY_BUTTON_LOCATION);
    const isApplePayEnabled = isApplePayPvpButtonEnabled && prefs.isApplePayPmActive;

    res.viewData.paypal.isApplePayPvpButtonEnabled = isApplePayEnabled;

    if (isApplePayEnabled) {
        res.viewData.paypal.applePayConfigs = paymentHelper.getApplePayConfigs(constants.PAGE_FLOW_PVP);
        res.viewData.paypal.applePayFormFields = paypalHelper.getApplePayFormFields();
    }

    const isGooglePayPvpButtonEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_PVP, constants.GOOGLE_PAY_BUTTON_LOCATION);
    const isGooglePayEnabled = isGooglePayPvpButtonEnabled && prefs.isGooglePayActive;

    res.viewData.paypal.isGooglePayPvpButtonEnabled = isGooglePayEnabled;

    if (isGooglePayEnabled) {
        const billingForm = server.forms.getForm('billing');

        billingForm.clear();

        res.viewData.paypal.googlePayFormFields = JSON.stringify(googlePayHelper.getGooglePayFormFields(billingForm));
        res.viewData.paypal.googlePayConfigs = googlePayHelper.getGooglePayConfigs(constants.PAGE_FLOW_PVP);
    }

    return next();
});

module.exports = server.exports();
