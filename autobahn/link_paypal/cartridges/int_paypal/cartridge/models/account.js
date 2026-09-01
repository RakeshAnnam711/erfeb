'use strict';

const account = module.superModule;

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
account.getCustomerPaymentInstruments = function(userPaymentInstruments) {
    const URLUtils = require('dw/web/URLUtils');

    const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');
    const constants = require('*/cartridge/config/constants');

    return userPaymentInstruments.map(function(paymentInstrument) {
        const result = {
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
            creditCardType: paymentInstrument.creditCardType,
            creditCardExpirationMonth: ['0', paymentInstrument.creditCardExpirationMonth.toString()].join('').slice(-2),
            creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
            UUID: paymentInstrument.UUID,
            creditCardExpired: paymentInstrument.creditCardExpired,
            creditCardNumberLastDigits: paymentInstrument.creditCardNumberLastDigits,
            creditCardExpirationYearShort: paymentInstrument.creditCardExpirationYear.toString().slice(-2),
            isDefault: paymentInstrument.custom ? paymentInstrument.custom.payPalDefaultCard : false
        };

        result.cardTypeImage = {
            src: URLUtils.staticURL([
                '/images/',
                paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, ''),
                '-dark.svg'
            ].join('')),
            alt: paymentInstrument.creditCardType
        };

        if (paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD) {
            paymentHelper.addExpirationDataForCC(result);
        }

        return result;
    });
};

module.exports = account;
