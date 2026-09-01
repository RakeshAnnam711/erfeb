'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

function isPaymentBlockVisible(data) {
    var customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
    var customerPaymentInstruments = customerHelper.getCustomerPaymentInstruments(data.paymentMethodId);

    return data.isPaymentMethodActive && (data.isVaultEnabled || !empty(customerPaymentInstruments));
}

function toStringOrEmpty(value) {
    return value === null || value === undefined ? '' : String(value);
}

function formatMonth(value) {
    var month = toStringOrEmpty(value);

    return month ? ['0', month].join('').slice(-2) : '';
}

function formatYearShort(value) {
    var year = toStringOrEmpty(value);

    return year ? year.slice(-2) : '';
}

function buildStripeSavedMethods() {
    var methods = [];

    try {
        var stripeHelper = require('*/cartridge/scripts/stripe/helpers/stripeHelper');

        if (stripeHelper.isStripeEnabled()) {
            var wallet = stripeHelper.getStripeWallet(customer);
            var stripeMethods = wallet.getPaymentInstruments() || [];

            stripeMethods.forEach(function (method) {
                methods.push({
                    id: method.UUID,
                    provider: 'stripe',
                    cardType: toStringOrEmpty(method.creditCardType),
                    maskedNumber: toStringOrEmpty(method.maskedCreditCardNumber),
                    expirationMonth: formatMonth(method.creditCardExpirationMonth),
                    expirationYearShort: formatYearShort(method.creditCardExpirationYear),
                    isDefault: method.custom && method.custom.isDefault === true
                });
            });
        }
    } catch (e) {
        // Keep account dashboard resilient when Stripe cartridge is not present.
    }

    return methods;
}

function buildPayPalCardSavedMethods(customerSavedCreditCards) {
    return (customerSavedCreditCards || []).map(function (method) {
        return {
            id: method.UUID,
            provider: 'paypal-card',
            cardType: toStringOrEmpty(method.creditCardType),
            maskedNumber: toStringOrEmpty(method.maskedCreditCardNumber),
            expirationMonth: formatMonth(method.creditCardExpirationMonth),
            expirationYearShort: formatYearShort(method.creditCardExpirationYearShort || method.creditCardExpirationYear),
            isDefault: method.isDefault === true
        };
    });
}

function buildPayPalAccountSavedMethods(savedPpAccounts, paypalHelper) {
    return (savedPpAccounts || []).map(function (method, index) {
        return {
            id: ['paypal-account-', index].join(''),
            provider: 'paypal-account',
            paypalEmail: toStringOrEmpty(paypalHelper.getCustomAttributePaypalEmail(method)),
            isDefault: false
        };
    });
}

server.extend(module.superModule);

server.prepend('Show', csrfProtection.generateToken, function (req, res, next) {
    if (!customer || !customer.authenticated || !customer.profile) {
        return next();
    }

    var prefs = require('*/cartridge/config/preferences');

    if (!(prefs && prefs.paypalVaultModeDisabled)) {
        try {
            var utils = require('*/cartridge/scripts/paypal/utils');
            var paypalHelperForBA = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
            var billingAgreements = utils.tryParseJSON(customer.profile.custom.PP_API_billingAgreement);

            if (!empty(billingAgreements)) {
                paypalHelperForBA.convertBillingAgreements(billingAgreements, customer.profile);
            }
        } catch (e) {
            // Keep dashboard usable even if PayPal BA conversion fails.
        }
    }

    return next();
});

server.append('Show', function (req, res, next) {
    if (!customer || !customer.authenticated || !customer.profile) {
        return next();
    }

    var viewData = res.getViewData() || {};

    var prefs = require('*/cartridge/config/preferences');

    var constants = require('*/cartridge/config/constants');
    var paypalSDK = require('*/cartridge/config/sdk');
    var customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
    var paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
    var AccountModel = require('*/cartridge/models/account');
    var CustomerModel = require('*/cartridge/models/customer');
    var customerInstance = new CustomerModel(customer);

    var customerSavedCreditCards = AccountModel.getCustomerPaymentInstruments(
        customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD)
    );
    var customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL);

    var billingAddressForm = server.forms.getForm('address');
    var creditCardForm = server.forms.getForm('paypalCreditCard');

    billingAddressForm.clear();
    creditCardForm.clear();

    // Always rebuild from current customer wallet so upstream partial viewData does not hide PayPal vault UI.
    viewData.paypal = {
        prefs: prefs,
        savedPpAccounts: customerSavedPaypalAccounts,
        customerSavedCreditCards: customerSavedCreditCards,
        isPaypalVaultAllowed: prefs.paypalVaultModeEnabled,
        isCreditCardBlockVisible: isPaymentBlockVisible({
            isVaultEnabled: prefs.creditCardVaultModeEnabled && prefs.isCreditCardVaultOnAccountEnabled,
            isPaymentMethodActive: prefs.isCreditCardActive,
            paymentMethodId: constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
        }),
        isPayPalBlockVisible: isPaymentBlockVisible({
            isVaultEnabled: prefs.paypalVaultModeEnabled,
            isPaymentMethodActive: prefs.isPayPalPmActive,
            paymentMethodId: constants.PAYMENT_METHOD_ID_PAYPAL
        }),
        sdkUrl: paypalSDK.accountSDKUrl,
        isExternalProfile: customerInstance.isExternalProfile(),
        billingAddressForm: billingAddressForm,
        creditCardForm: creditCardForm,
        getPaypalEmail: paypalHelper.getCustomAttributePaypalEmail
    };

    var unifiedSavedPaymentMethods = [];
    var stripeSavedMethods = buildStripeSavedMethods();

    unifiedSavedPaymentMethods = unifiedSavedPaymentMethods
        .concat(stripeSavedMethods)
        .concat(buildPayPalCardSavedMethods(customerSavedCreditCards))
        .concat(buildPayPalAccountSavedMethods(customerSavedPaypalAccounts, paypalHelper));

    if (stripeSavedMethods.length) {
        var preferredStripeMethod = stripeSavedMethods.find(function (method) {
            return method.isDefault;
        }) || stripeSavedMethods[0];

        viewData.payment = {
            creditCardType: preferredStripeMethod.cardType,
            maskedCreditCardNumber: preferredStripeMethod.maskedNumber,
            creditCardExpirationMonth: preferredStripeMethod.expirationMonth,
            creditCardExpirationYear: preferredStripeMethod.expirationYearShort
        };
    }

    viewData.unifiedSavedPaymentMethods = unifiedSavedPaymentMethods;
    viewData.hasUnifiedSavedPaymentMethods = unifiedSavedPaymentMethods.length > 0;

    res.setViewData(viewData);

    return next();
});

module.exports = server.exports();
