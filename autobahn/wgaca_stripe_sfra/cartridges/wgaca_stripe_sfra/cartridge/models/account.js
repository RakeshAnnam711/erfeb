'use strict';

var account = module.superModule;

/**
 * Normalizes month value to two digits or empty string.
 * @param {*} value input month value
 * @returns {string} formatted month
 */
function normalizeMonth(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return ['0', String(value)].join('').slice(-2);
}

/**
 * Normalizes year value to string or empty.
 * @param {*} value input year value
 * @returns {string} formatted year
 */
function normalizeYear(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

/**
 * Returns a safe lowercase card type token for icon path generation.
 * @param {*} creditCardType card type value
 * @returns {string} normalized card type token
 */
function normalizeCardTypeToken(creditCardType) {
    if (creditCardType === null || creditCardType === undefined) {
        return 'unknown';
    }

    return String(creditCardType).toLowerCase().replace(/\s/g, '');
}

/**
 * Creates a plain object that contains payment instrument information.
 * @param {Object} userPaymentInstruments - current customer's payment instruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
account.getCustomerPaymentInstruments = function(userPaymentInstruments) {
    const URLUtils = require('dw/web/URLUtils');

    const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');
    const constants = require('*/cartridge/config/constants');

    return userPaymentInstruments.map(function(paymentInstrument) {
        var expirationYear = normalizeYear(paymentInstrument.creditCardExpirationYear);
        var creditCardType = paymentInstrument.creditCardType;

        var result = {
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
            creditCardType: creditCardType,
            creditCardExpirationMonth: normalizeMonth(paymentInstrument.creditCardExpirationMonth),
            creditCardExpirationYear: expirationYear,
            UUID: paymentInstrument.UUID,
            creditCardExpired: paymentInstrument.creditCardExpired,
            creditCardNumberLastDigits: paymentInstrument.creditCardNumberLastDigits,
            creditCardExpirationYearShort: expirationYear.slice(-2),
            isDefault: paymentInstrument.custom ? paymentInstrument.custom.payPalDefaultCard : false
        };

        result.cardTypeImage = {
            src: URLUtils.staticURL([
                '/images/',
                normalizeCardTypeToken(creditCardType),
                '-dark.svg'
            ].join('')),
            alt: creditCardType
        };

        if (paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD) {
            paymentHelper.addExpirationDataForCC(result);
        }

        return result;
    });
};

module.exports = account;
