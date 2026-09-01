'use strict';

const currentSite = require('dw/system/Site').getCurrent();
const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');

/**
 * Get client id
 * @returns {string} client id
 */
function getClientId() {
    const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    const serviceName = 'int_paypal.http.rest';
    const paypalService = LocalServiceRegistry.createService(serviceName, {});

    return paypalService.configuration.credential.user;
}

module.exports = {
    simplifiedDisputePage: currentSite.getCustomPreferenceValue('PP_Simplified_Dispute_Page'),
    ocapiConfig: coreHelpers.tryParseJSON(currentSite.getCustomPreferenceValue('PP_OCAPI_Config')),
    webdavConfig: coreHelpers.tryParseJSON(currentSite.getCustomPreferenceValue('PP_WebDAV_Config')),
    isTransactionLogEnabled: currentSite.getCustomPreferenceValue('PP_Transaction_Log_Enabled'),

    clientId: getClientId(),
    paypalMerchantId: currentSite.getCustomPreferenceValue('PP_MERCHANT_ID'),
    buttonStyles: {
        cwpp: currentSite.getCustomPreferenceValue('PP_CWPP_Button_Styles'),
        payPalSmart: currentSite.getCustomPreferenceValue('PP_Smart_Button_Styles'),
        applePay: currentSite.getCustomPreferenceValue('PP_AP_API_Button_Styles'),
        buttonMessage: currentSite.getCustomPreferenceValue('PP_Button_Message_Styles'),
        googlePay: currentSite.getCustomPreferenceValue('PP_Google_Pay_Button_Styles'),
        payLaterMessaging: currentSite.getCustomPreferenceValue('PP_Pay_Later_Messaging_Styles')
    },
    cardFieldsStyles: currentSite.getCustomPreferenceValue('PP_Card_Fields_Styles'),
    payPalButtonLocation: currentSite.getCustomPreferenceValue('PP_Button_Location'),
    venmoButtonLocation: currentSite.getCustomPreferenceValue('PP_Venmo_Button_Location'),
    applePayButtonLocation: currentSite.getCustomPreferenceValue('PP_ApplePay_Button_Location'),
    googlePayButtonLocation: currentSite.getCustomPreferenceValue('PP_Google_Pay_Button_Location'),
    paypalButtonMessagesLocation: currentSite.getCustomPreferenceValue('PP_Message_Button_Location'),
    payLaterButtonEnabled: currentSite.getCustomPreferenceValue('PP_Pay_Later_Button_Enabled'),
    debitCreditButtonEnabled: currentSite.getCustomPreferenceValue('PP_Debit_Credit_Button_Enabled'),
    merchantName: currentSite.getCustomPreferenceValue('PP_Merchant_Name'),
    defaultLocale: currentSite.defaultLocale
};
