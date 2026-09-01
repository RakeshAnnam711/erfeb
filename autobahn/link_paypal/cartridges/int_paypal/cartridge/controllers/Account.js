'use strict';

const server = require('server');

const prefs = require('*/cartridge/config/preferences');
const constants = require('*/cartridge/config/constants');
const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');

/**
 * Determines if the payment block should be displayed on the "My Account" page.
 * @param {Object} data - The data object containing information about the payment method.
 * @param {string} data.paymentMethodId - The ID of the payment method to check.
 * @param {boolean} data.isPaymentMethodActive - Indicates if the payment method is active.
 * @param {boolean} data.isVaultEnabled - Indicates if the vault (stored payment methods) is enabled.
 * @returns {boolean} True if the payment block should be displayed, otherwise false.
 */
function isPaymentBlockVisible(data) {
    const customerPaymentInstruments = customerHelper.getCustomerPaymentInstruments(data.paymentMethodId);

    return data.isPaymentMethodActive && (data.isVaultEnabled || !empty(customerPaymentInstruments));
}

server.extend(module.superModule);

server.append('Show',
    function(req, res, next) {
        if (!prefs.isPayPalPmActive && !prefs.isCreditCardActive) {
            return next();
        }

        const paypalSDK = require('*/cartridge/config/sdk');
        const utils = require('*/cartridge/scripts/paypal/utils');
        const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
        const connectWithPaypalHelper = require('*/cartridge/scripts/paypal/helpers/connectWithPaypalHelper');

        connectWithPaypalHelper.handleAddressOnAccountPage(res);

        const billingAgreements = utils.tryParseJSON(customer.profile.custom.PP_API_billingAgreement);

        // Converts BA tokens for Enabled and Partially Disabled Vault mode
        const convertBillingAgreements = !prefs.paypalVaultModeDisabled && !empty(billingAgreements);

        if (convertBillingAgreements) {
            paypalHelper.convertBillingAgreements(billingAgreements, customer.profile);
        }

        const AccountModel = require('*/cartridge/models/account');
        const CustomerModel = require('*/cartridge/models/customer');

        const customerInstance = new CustomerModel(customer);
        const customerSavedCreditCards = AccountModel.getCustomerPaymentInstruments(
            customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD)
        );

        const customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL);

        const viewData = res.getViewData();
        const orderHistory = viewData.account.orderHistory;

        if (req.httpParameterMap.isAPMAFlow.booleanValue && customerInstance.isEnabledFeatureAPMA()) {
            const Transaction = require('dw/system/Transaction');

            Transaction.wrap(function() {
                customerInstance.disableFeatureAPMA();
            });
        }

        if (orderHistory) {
            const orderHelper = require('*/cartridge/scripts/paypal/helpers/orderHelper');

            const orders = orderHelper.fillOrderDetails(req, [orderHistory]);

            if (orders.length) {
                viewData.account.orderHistory = orders[0];
            }
        }

        const billingAddressForm = server.forms.getForm('address');
        const creditCardForm = server.forms.getForm('paypalCreditCard');

        billingAddressForm.clear();
        creditCardForm.clear();

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

        res.setViewData(viewData);

        paypalHelper.updateViewDataForFraudNet(res);

        return next();
    });

server.append('Login',
    function(req, res, next) {
        const Resource = require('dw/web/Resource');
        const Transaction = require('dw/system/Transaction');

        const CustomerModel = require('*/cartridge/models/customer');

        if (customer.authenticated && customer.registered) {
            const externalProfileExist = CustomerModel.externalProfileExist(customer.profile.email);

            if (externalProfileExist) {
                const customerInstance = new CustomerModel(customer);

                Transaction.wrap(function() {
                    customerInstance.addFlashMessage(Resource.msg('account.legacy', 'notifications', null),
                        CustomerModel.FLASH_MESSAGE_INFO);
                });
            }

            // CC expire notification is enabled
            if (prefs.creditCardExpireNotification !== -1) {
                const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');

                const customerSavedCreditCards = customerHelper.getCustomerPaymentInstruments(
                    constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
                );

                paymentHelper.addExpirationNotificationForCC(customerSavedCreditCards);
            }
        }

        next();
    });

module.exports = server.exports();
