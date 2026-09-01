'use strict';

const server = require('server');

server.extend(module.superModule);

server.append('Begin',
    function(req, res, next) {
        const Money = require('dw/value/Money');
        const BasketMgr = require('dw/order/BasketMgr');
        const StringUtils = require('dw/util/StringUtils');

        const paypalApi = require('*/cartridge/scripts/paypal/api');
        const prefs = require('*/cartridge/config/preferences');
        const utils = require('*/cartridge/scripts/paypal/utils');
        const constants = require('*/cartridge/config/constants');
        const paypalSDK = require('*/cartridge/config/sdk');
        const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
        const buttonConfigHelper = require('*/cartridge/scripts/paypal/helpers/buttonConfigHelper');
        const creditCardHelper = require('*/cartridge/scripts/paypal/helpers/creditCardHelper');
        const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');
        const googlePayHelper = require('*/cartridge/scripts/paypal/helpers/googlePayHelper');
        const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
        const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

        const basket = BasketMgr.getCurrentBasket();
        const currency = basket.getCurrencyCode();
        const isReturningCustomerEnabled = paypalHelper.isReturningCustomerExperienceEnabled();
        const paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(basket);
        const isPaypalCardFieldsEnabled = prefs.isCreditCardActive;
        const isApplePayEnabled = prefs.isApplePayPmActive;
        const isPayPalButtonMessageEnabled = paymentHelper.isElementEnabled(constants.PAGE_FLOW_BILLING, constants.PAYPAL_BUTTON_MESSAGE);
        const isGooglePayEnabled = prefs.isGooglePayActive;
        const viewData = res.getViewData();

        let paymentAmount = new Money(0, currency);
        let amount;
        let paypalEmail;
        let isVenmoUsed = false;
        let isPayPalUsed = false;
        let customerSavedPaypalAccounts = [];
        let userIdToken = null;
        let showSavePaypalCheckbox = false;
        let isNonFastlaneUsed = false;

        if ((!prefs.isPayPalPmActive && !prefs.isVenmoEnabled) || !basket) {
            paymentHelper.filterValidCustomerCreditCards(viewData.customer);

            return next();
        }

        if (paypalHelper.isExpiredTransaction(paypalPaymentInstrument)) {
            paymentInstrumentHelper.removePaypalPaymentInstrument(basket);
        }

        if (customer.authenticated && !prefs.paypalVaultModeDisabled) {
            const billingAgreements = utils.tryParseJSON(customer.profile.custom.PP_API_billingAgreement);

            if (!empty(billingAgreements)) {
                paypalHelper.convertBillingAgreements(billingAgreements, customer.profile);
            }

            customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL);
            showSavePaypalCheckbox = !customerSavedPaypalAccounts.length && prefs.paypalVaultModeEnabled;
        }

        if (isReturningCustomerEnabled) {
            userIdToken = paypalApi.generateUserIdToken();
        }

        if (paypalPaymentInstrument) {
            amount = paypalPaymentInstrument.paymentTransaction.amount.value;
            paymentAmount = new Money(amount, currency);
            paypalEmail = paypalPaymentInstrument.custom.currentPaypalEmail;
            isPayPalUsed = paypalPaymentInstrument.custom.paymentId === constants.PAYMENT_METHOD_ID_PAYPAL;
            isVenmoUsed = paypalPaymentInstrument.custom.paymentId === constants.PAYMENT_METHOD_ID_VENMO;
            isNonFastlaneUsed = paypalPaymentInstrument.paymentMethod !== constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
        }

        if (viewData.customer.customerPaymentInstruments) {
            paymentHelper.filterValidCustomerCreditCards(viewData.customer);
            viewData.customer.customerPaymentInstruments.forEach(function(paymentInstrument) {
                paymentHelper.addExpirationDataForCC(paymentInstrument);
            });
        }

        paypalHelper.processPaylaterMessagingConfiguration(req, res, constants.PAGE_FLOW_CHECKOUT);

        const fastlaneConfig = prefs.isFastlaneEnabled ? paymentHelper.createFastlaneConfig() : null;

        res.setViewData({
            paypal: {
                paymentAmount: StringUtils.formatMoney(paymentAmount),
                paypalPaymentMethodId: constants.PAYMENT_METHOD_ID_PAYPAL,
                paypalEmail: paypalEmail,
                partnerAttributionId: prefs.partnerAttributionId,
                buttonConfig: prefs.paypalBillingButtonConfig,
                buttonMessageConfig: paypalHelper.getButtonMessageConfig(constants.PAGE_FLOW_BILLING, res),
                getPaypalEmail: paypalHelper.getCustomAttributePaypalEmail,
                customerPaypalPaymentInstruments: customerSavedPaypalAccounts,
                lastAddedPaypalPaymentInstrument: paymentInstrumentHelper.getLastAddedPaypalPaymentInstrument(customerSavedPaypalAccounts),
                ppVaultEnabled: prefs.paypalVaultModeEnabled,
                showSavePaypalCheckbox: showSavePaypalCheckbox,
                sdkUrl: paypalSDK.billingSdkUrl.baseSdkUrl,
                lpmSdk: paypalSDK.billingSdkUrl.lpmSdk,
                isVenmoUsed: isVenmoUsed,
                isPayPalUsed: isPayPalUsed,
                isActiveVenmo: prefs.isVenmoEnabled,
                isPayPalActive: prefs.isPayPalPmActive,
                isPayPalButtonMessageEnabled: isPayPalButtonMessageEnabled,
                availableLPMSArray: buttonConfigHelper.getAvailableLPMSArray(),
                isPaypalCardFieldsEnabled: isPaypalCardFieldsEnabled,
                isFastlaneEnabled: prefs.isFastlaneEnabled,
                fastlaneConfig: fastlaneConfig,
                isFastlanePrivacyEnabled: prefs.isFastlanePrivacyEnabled,
                isApplePayEnabled: isApplePayEnabled,
                isGooglePayEnabled: isGooglePayEnabled,
                googlePayConfigs: googlePayHelper.getGooglePayConfigs(constants.PAGE_FLOW_BILLING),
                googlePayPaymentMethodId: constants.PAYMENT_METHOD_ID_GOOGLE_PAY,
                messagesForLPM: JSON.stringify(buttonConfigHelper.getLPMSMessages()),
                userIdToken: userIdToken,
                customerEmail: paypalHelper.getCustomerEmailOrEmpty(),
                isNonFastlaneUsed: isNonFastlaneUsed
            }
        });

        if (isApplePayEnabled) {
            res.viewData.paypal.applePayConfigs = paymentHelper.getApplePayConfigs(constants.PAGE_FLOW_BILLING);
        }

        // Card fields required property
        if (isPaypalCardFieldsEnabled) {
            res.viewData.paypal.cardFieldsConfigs = creditCardHelper.getCardFieldsConfigs(viewData, basket);
        }

        paypalHelper.updateViewDataForDigitalGoods(res, currency);
        paypalHelper.updateViewDataForFraudNet(res);

        return next();
    }
);

module.exports = server.exports();
