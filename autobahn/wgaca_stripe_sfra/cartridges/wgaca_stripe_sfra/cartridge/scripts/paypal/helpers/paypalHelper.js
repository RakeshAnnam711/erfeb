'use strict';

var Transaction = require('dw/system/Transaction');

var superModule = module.superModule;

/**
 * Saves PayPal account to customer wallet with null-safe payload handling.
 * @param {Object} responseData response from PayPal token API
 * @returns {Object} save result
 */
function savePaypalToCustomerWallet(responseData) {
    var Resource = require('dw/web/Resource');
    var constants = require('*/cartridge/config/constants');
    var customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');

    var profile = customer.profile;

    if (!profile) {
        return profile;
    }

    var paypalApi = require('*/cartridge/scripts/paypal/api');

    var paypalData = responseData.payment_source.paypal;
    var attributes = paypalData.attributes;
    var email = paypalData.email_address;
    var address = paypalData.address || {};
    var name = paypalData.name || {};
    var phoneNumber = paypalData.phone ? paypalData.phone.phone_number : {};

    var vaultId;
    var customerId;

    var isMyAccountFlow = paypalData && !attributes;

    if (isMyAccountFlow) {
        vaultId = responseData.id;
        customerId = responseData.customer ? responseData.customer.id : null;

        var isDuplicate = superModule.isDuplicatedPpAccount(email);

        if (isDuplicate) {
            var paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
            var duplicateAccountMessage = Resource.msg('paypal.account.list.already.saved', 'locale', null);

            if (!paymentInstrumentHelper.getCustomerPiByCreditCardToken(vaultId, profile)) {
                paypalApi.deletePaymentToken(vaultId);
            }

            return {
                error: true,
                msg: duplicateAccountMessage
            };
        }
    } else {
        vaultId = attributes.vault.id;
        customerId = attributes.vault.customer.id;
    }

    Transaction.wrap(function() {
        if (!profile.custom.payPalCustomerId && customerId) {
            profile.custom.payPalCustomerId = customerId;
        }

        var customerPaymentInstrument = profile.wallet.createPaymentInstrument(constants.PAYMENT_METHOD_ID_PAYPAL);

        customerPaymentInstrument.setCreditCardType(constants.CREDIT_CARD_TYPE_VISA);
        customerPaymentInstrument.custom.currentPaypalEmail = email;
        customerPaymentInstrument.custom.paypalBillingAddress = JSON.stringify(
            Object.assign({}, address, name, phoneNumber)
        );
        customerPaymentInstrument.creditCardToken = vaultId;

        customerHelper.setPayPalSavedCardsPaymentToken(profile.custom, vaultId);
    });

    return {
        error: false
    };
}

module.exports = Object.assign({}, superModule, {
    savePaypalToCustomerWallet: savePaypalToCustomerWallet
});
