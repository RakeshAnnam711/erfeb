'use strict';

const constants = require('*/cartridge/config/constants');
const preferences = require('*/cartridge/config/preferences');

/**
 * Get payment token from billing form
 * @param {Object} billingForm - Billing form
 * @returns {string} - Payment token
 */
function getPaymentToken(billingForm) {
    return billingForm.paypal.fastlanePaymentToken.htmlValue;
}

/**
 * Checks if Fastlane payments via session are enabled in preferences.
 * @returns {boolean} `true` if Fastlane session payments are enabled; otherwise, `false`.
 */
function isFastlaneSessionPaymentsEnabled() {
    return preferences.isFastlaneEnabled
        && preferences.isFastlanePaymentUiEnabled;
}

/**
 * Checks if a session-stored payment card is selected and matches the provided billing form.
 * @param {dw.order.PaymentInstrument} paymentInstrument - The payment instrument to check.
 * @param {Object} billingForm - The billing form containing payment details.
 * @returns {boolean} `true` if session payments are enabled, the session card is selected,
 * and the payment token matches the session; otherwise, `false`.
 */
function isSessionCardSelected(paymentInstrument, billingForm) {
    if (!paymentInstrument) {
        return false;
    }

    const isTokenMatch = session.privacy.paymentToken === getPaymentToken(billingForm);
    const isSessionCard = request.httpParameterMap.fastlaneCreditCardList.stringValue === constants.SESSION_CARD;

    return isFastlaneSessionPaymentsEnabled() && isSessionCard && isTokenMatch;
}

/**
 * Generates the 3D Secure (3DS) parameters for Fastlanr payment
 * based on the current basket.
 *
 * This function retrieves the payment instrument associated with PayPal Credit Card,
 * determines the payment token (from custom attribute or session), and constructs
 * the 3DS parameters including amount, currency, and nonce.
 *
 * If the `threeDSecureFlow` preference is set to `SCA_ALWAYS`, the function also
 * adds the `threeDSRequested` flag to force Strong Customer Authentication (SCA).
 * @param {dw.order.Basket} currentBasket - The current basket object
 * @returns {Object} An object containing 3D Secure parameters
 */
function createThreeDSecureParameters(currentBasket) {
    const paymentInstruments = currentBasket.getPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);

    if (paymentInstruments.empty) {
        return {};
    }

    const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');

    const paymentInstrument = paymentInstruments[0];
    const fastlanePaymentToken = paymentInstrument.custom.fastlanePaymentToken || session.privacy.paymentToken;

    const threeDSecureParameters = {
        amount: paymentHelper.getAmountPaid(currentBasket).getValue().toFixed(2),
        currency: currentBasket.currencyCode,
        nonce: fastlanePaymentToken
    };

    // Sets SCA_ALWAYS in the eligibility API request, otherwise defaults to SCA_WHEN_REQUIRED
    if (preferences.threeDSecureFlow === constants.SCA_ALWAYS) {
        threeDSecureParameters.threeDSRequested = true;
    }

    return threeDSecureParameters;
}

module.exports = {
    isSessionCardSelected: isSessionCardSelected,
    isFastlaneSessionPaymentsEnabled: isFastlaneSessionPaymentsEnabled,
    createThreeDSecureParameters: createThreeDSecureParameters
};
