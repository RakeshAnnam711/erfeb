'use strict';

const sdkConfig = require('./sdkConfig');
const PaymentMgr = require('dw/order/PaymentMgr');

const ALLOWED_PROCESSOR_ID = 'PAYPAL';
const ALLOWED_LPM_PROCESSOR_ID = 'PAYPAL_LOCAL';

const preferences = {};

/**
 * Returns whether the payment method is active
 * @param {string} paymentMethodId The payment method id
 * @returns {boolean} True or false
 */
function isPaymentMethodActive(paymentMethodId) {
    const activePaymentMethods = PaymentMgr.getActivePaymentMethods().toArray();

    return activePaymentMethods.some(function(paymentMethod) {
        if (!paymentMethod.paymentProcessor) {
            return false;
        }

        const isAllowedProcessorId = paymentMethod.paymentProcessor.ID === ALLOWED_PROCESSOR_ID
            || paymentMethod.paymentProcessor.ID === ALLOWED_LPM_PROCESSOR_ID;

        return isAllowedProcessorId && paymentMethodId === paymentMethod.ID;
    });
}

/**
 * Adds _whiteListedForStorefront object property with preferences which would be shown on the client side
 */
const addWhiteListPrefs = function() {
    preferences._whiteListedForStorefront = {};

    // List of custom preferences keys that should be visible on the client side
    const whiteList = ['partnerAttributionId', 'isDigitalGoodsFlowEnabled', 'isCWPPEnabled', 'merchantName',
        'isFastlaneEnabled', 'instanceType', 'isFastlanePaymentUiEnabled', 'fastlaneCardholderName',
        'isStreamlinedCheckout', 'appSwitchEnabled', 'threeDSecureFlow'];

    // Make prefs from whiteList visible on the client side
    whiteList.forEach(function(key) {
        preferences._whiteListedForStorefront[key] = JSON.parse(JSON.stringify(preferences[key]));
    });
};

/**
 * Returns active LPM's ids
 * @returns {Array} with LPM's ids
 */
const getActiveLPMs = function() {
    return PaymentMgr.getActivePaymentMethods().toArray()
        .filter(function(paymentMethod) {
            return paymentMethod.paymentProcessor && paymentMethod.paymentProcessor.ID === ALLOWED_LPM_PROCESSOR_ID;
        })
        .map(function(paymentMethod) {
            return paymentMethod.ID.toLowerCase();
        });
};

/**
 * Returns Active Payment Methods
 *
 * Setting isActive to true
 * Saves paymentMethodId to prefs.paymentMethods
 *
 * @returns {Object} an object with active payment Methods
 */
function getActivePaymentMethods() {
    const activePaymentMethods = require('dw/order/PaymentMgr').getActivePaymentMethods().toArray();

    return activePaymentMethods.reduce(function(paymentMethods, paymentMethod) {
        paymentMethods[paymentMethod.ID] = {
            isActive: paymentMethod.active,
            paymentMethodId: paymentMethod.ID
        };

        return paymentMethods;
    }, {});
}

/**
 * Returns PayPal custom and hardcoded preferences
 *
 * @returns {Object} static preferences
 */
function getPreferences() {
    const utils = require('*/cartridge/scripts/paypal/utils');
    const paypalConstants = require('*/cartridge/config/constants');
    const dwSystem = require('dw/system/System');

    const site = require('dw/system/Site').current;
    const registeredUser = customer.registered && customer.authenticated;
    const isCapture = site.getCustomPreferenceValue('PP_Payment_Model').value === 'Sale';
    const paypalButtonLocation = site.getCustomPreferenceValue('PP_Button_Location');
    const paypalButtonMessageLocation = site.getCustomPreferenceValue('PP_Message_Button_Location');
    const applePayButtonLocation = site.getCustomPreferenceValue('PP_ApplePay_Button_Location');
    const googlePayButtonLocation = site.getCustomPreferenceValue('PP_Google_Pay_Button_Location');
    const venmoButtonLocation = site.getCustomPreferenceValue('PP_Venmo_Button_Location');
    const isPayPalPmActive = isPaymentMethodActive(paypalConstants.PAYMENT_METHOD_ID_PAYPAL);
    const isCreditCardPmActive = isPaymentMethodActive(paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);

    const creditCardVaultMode = site.getCustomPreferenceValue('PP_Store_CC_To_Vault');
    const ppVaultMode = site.getCustomPreferenceValue('PP_Vault_Enabled');
    const isDigitalGoodsFlowEnabled = site.getCustomPreferenceValue('PP_Digital_Goods_Flow_Enabled');
    const isFastlaneEnabled = isCreditCardPmActive && isPayPalPmActive
        && site.getCustomPreferenceValue('PP_Fastlane_Checkout_Enabled') && !registeredUser;

    const isStreamlinedCheckout = site.getCustomPreferenceValue('PP_Streamlined_Checkout');
    const threeDSecureFlow = site.getCustomPreferenceValue('PP_3DS_Verification').getValue();

    preferences.threeDSecureFlow = threeDSecureFlow;
    preferences.isThreeDSecureEnabled = threeDSecureFlow !== paypalConstants.DISABLED;
    preferences.isCreditCardActive = isCreditCardPmActive;
    preferences.isVenmoEnabled = isPaymentMethodActive(paypalConstants.PAYMENT_METHOD_ID_VENMO);
    preferences.isGooglePayActive = isPaymentMethodActive(paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY);
    preferences.enabledLPMs = getActiveLPMs();

    preferences.isCreditCardVaultOnAccountEnabled = site.getCustomPreferenceValue('PP_Save_CC_On_My_Account');
    preferences.creditCardVaultLimit = site.getCustomPreferenceValue('PP_Save_CC_Limit').value;
    preferences.paypalAccountVaultLimit = site.getCustomPreferenceValue('PP_Saved_Accounts_Limit').value;
    preferences.isCapture = isCapture;
    preferences.isPayPalPmActive = isPayPalPmActive;
    preferences.paypalButtonLocation = paypalButtonLocation.length ? paypalButtonLocation.join(',') : 'Billing';
    preferences.paypalButtonMessagesLocation = paypalButtonMessageLocation.length ? paypalButtonMessageLocation.join(',') : '';
    preferences.applePayButtonLocation = applePayButtonLocation.length ? applePayButtonLocation.join(',') : 'Billing';
    preferences.googlePayButtonLocation = googlePayButtonLocation.length ? googlePayButtonLocation.join(',') : 'Billing';
    preferences.venmoButtonLocation = venmoButtonLocation.length ? venmoButtonLocation.join(',') : '';
    preferences.webHookId = site.getCustomPreferenceValue('PP_WH_ID');
    preferences.paypalMerchantId = site.getCustomPreferenceValue('PP_MERCHANT_ID');
    preferences.paypalCartButtonConfig = sdkConfig.paypalCartButtonConfig;
    preferences.paypalBillingButtonConfig = sdkConfig.paypalBillingButtonConfig;
    preferences.buttonMessageConfig = sdkConfig.buttonMessageConfig;
    preferences.paypalPdpButtonConfig = sdkConfig.paypalPdpButtonConfig;
    preferences.paypalPvpButtonConfig = sdkConfig.paypalPvpButtonConfig;
    preferences.paypalMinicartButtonConfig = sdkConfig.paypalMinicartButtonConfig;
    preferences.paypalProcessorId = ALLOWED_PROCESSOR_ID;
    preferences.partnerAttributionId = 'SFCC_EC_B2C_25_3_0';
    preferences.debitCreditButtonEnabled = site.getCustomPreferenceValue('PP_Debit_Credit_Button_Enabled');
    preferences.paypalPayLaterButtonEnabled = site.getCustomPreferenceValue('PP_Pay_Later_Button_Enabled');
    preferences.enableFundingList = site.getCustomPreferenceValue('PP_Enable_Funding_List');
    preferences.disableFundingList = site.getCustomPreferenceValue('PP_Disable_Funding_List');
    preferences.automaticPmAddingEnabled = site.getCustomPreferenceValue('PP_Automatic_Payment_Method_Adding_Enabled');
    preferences.isDigitalGoodsFlowEnabled = isDigitalGoodsFlowEnabled && isCapture && !isFastlaneEnabled;
    preferences.isFraudNetEnabled = site.getCustomPreferenceValue('PP_FraudNet_Enabled');
    preferences.customerServiceEmail = site.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com';
    preferences.creditCardExpireNotification = site.getCustomPreferenceValue('PP_Credit_Card_Expire_Notification').getValue();
    preferences.verifyCardOnAccountPage = site.getCustomPreferenceValue('PP_Verify_CC_On_My_Account').value;
    preferences.isApplePayPmActive = isPaymentMethodActive(paypalConstants.PAYMENT_METHOD_ID_APPLE_PAY);
    preferences.applePaySdk = sdkConfig.applePaySdk;
    preferences.simplifiedDisputePage = site.getCustomPreferenceValue('PP_Simplified_Dispute_Page');
    preferences.l2l3DataEnabled = site.getCustomPreferenceValue('PP_Level2_Level3_Data_Enabled');
    preferences.returningCustomerExperienceEnabled = site.getCustomPreferenceValue('PP_Returning_Customer_Experience_Enabled')
        && !isStreamlinedCheckout;
    preferences.appSwitchEnabled = site.getCustomPreferenceValue('PP_App_Switch_Enabled');
    preferences.merchantName = site.getCustomPreferenceValue('PP_Merchant_Name');
    preferences.isStreamlinedCheckout = isStreamlinedCheckout;
    preferences.googleMerchantId = site.getCustomPreferenceValue('PP_GOOGLEPAY_Google_Merchant_Id');
    preferences.googlePayStyles = site.getCustomPreferenceValue('PP_Google_Pay_Button_Styles');

    // Used only for 'Connect with Paypal's feature
    preferences.isCWPPEnabled = site.getCustomPreferenceValue('PP_CWPP_Button_Enabled');
    preferences.accountLinkingSecurityLayerEnabled = site.getCustomPreferenceValue('PP_CWPP_Account_Linking_Security_Layer_Enabled');
    preferences.PP_CWPP_Agent_Login = site.getCustomPreferenceValue('PP_CWPP_Agent_Login');
    preferences.PP_CWPP_Agent_Password = site.getCustomPreferenceValue('PP_CWPP_Agent_Password');
    preferences.cwppButtonStyles = sdkConfig.cwppButtonStyles;
    preferences.payPalExternalApiSdk = sdkConfig.payPalExternalApiSdk;
    preferences.instanceType = dwSystem.instanceType === dwSystem.PRODUCTION_SYSTEM ? 'production' : 'sandbox';
    preferences.paymentMethods = getActivePaymentMethods();
    preferences.cardFieldsStyles = sdkConfig.cardFieldsStyles;

    preferences.creditCardVaultModeEnabled = creditCardVaultMode.value === paypalConstants.VAULT_MODE_ENABLED;
    preferences.creditCardVaultModePartiallyDisabled = creditCardVaultMode.value === paypalConstants.VAULT_MODE_PARTIALLY_DISABLED;
    preferences.creditCardVaultModeDisabled = creditCardVaultMode.value === paypalConstants.VAULT_MODE_DISABLED;

    preferences.paypalVaultModeEnabled = ppVaultMode.value === paypalConstants.VAULT_MODE_ENABLED;
    preferences.paypalVaultModePartiallyDisabled = ppVaultMode.value === paypalConstants.VAULT_MODE_PARTIALLY_DISABLED;
    preferences.paypalVaultModeDisabled = ppVaultMode.value === paypalConstants.VAULT_MODE_DISABLED;

    // PayPal Pay later messaging
    preferences.ppPayLaterCrossBorderMessagingEnabled = site.getCustomPreferenceValue('PP_Pay_Later_Cross_Border_Messaging_Enabled');

    // Fastlane by PayPal
    preferences.isFastlaneEnabled = isFastlaneEnabled;
    preferences.isFastlanePaymentUiEnabled = site.getCustomPreferenceValue('PP_Fastlane_Payment_UI');
    preferences.isFastlanePrivacyEnabled = site.getCustomPreferenceValue('PP_Fastlane_Privacy_Enabled');
    preferences.fastlaneCardholderName = site.getCustomPreferenceValue('PP_Fastlane_Cardholder_Name');
    // Up to 5 domains
    preferences.domainList = [].concat(site.getCustomPreferenceValue('PP_Fastlane_Domain_List')).slice(0, 5);

    preferences.ocapiConfig = utils.tryParseJSON(site.getCustomPreferenceValue('PP_OCAPI_Config'));

    addWhiteListPrefs();

    return preferences;
}

module.exports = getPreferences();
