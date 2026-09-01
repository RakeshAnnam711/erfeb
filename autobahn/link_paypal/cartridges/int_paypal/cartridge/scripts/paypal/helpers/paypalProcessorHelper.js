'use strict';

const paypalApi = require('*/cartridge/scripts/paypal/api');
const payPalConstants = require('*/cartridge/config/constants');

const paypalProcessorHelper = {};

/**
 * Handle PayPal payment instrument
 * @param {dw.order.LineItemCtnr} basket - current basket
 * @param {Object} billingForm - billing from
 * @returns {dw.order.PaymentInstrument} - PayPal payment instrument
 */
paypalProcessorHelper.handlePaymentInstrument = function(basket, billingForm) {
    const fastlaneHelpers = require('*/cartridge/scripts/paypal/helpers/fastlane');
    const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

    const vaultedPaymentMethods = [
        payPalConstants.PAYMENT_METHOD_ID_PAYPAL,
        payPalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
    ];

    let paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrumentById(basket, billingForm.paypal.usedPaymentMethod.value);

    if (fastlaneHelpers.isSessionCardSelected(paymentInstrument, billingForm)) {
        return paymentInstrument;
    }

    delete session.privacy.paymentToken;

    if (!paymentInstrument || vaultedPaymentMethods.includes(paymentInstrument.paymentMethod)) {
        if (paymentInstrument) {
            basket.removePaymentInstrument(paymentInstrument);
        }

        paymentInstrument = paymentInstrumentHelper.createPaymentInstrument(basket, paypalProcessorHelper.getPaymentMethodId(billingForm));
    }

    return paymentInstrument;
};

/**
 * Remove current PayPal email from Payment Instrument
 * @param {dw.order.PaymentInstrument} paymentInstrument - the payment instrument
 */
paypalProcessorHelper.clearCurrentPaypalEmail = function(paymentInstrument) {
    const Transaction = require('dw/system/Transaction');

    Transaction.wrap(function() {
        paymentInstrument.custom.currentPaypalEmail = null;
    });
};

/**
 * Returns the appropriate payment method id (PayPal or PAYPAL_CREDIT_CARD)
 * @param {Object} billingForm Billing form
 * @returns {string} Payment method id
 */
paypalProcessorHelper.getPaymentMethodId = function(billingForm) {
    let paymentMethodId;

    switch (billingForm.paypal.usedPaymentMethod.value) {
        case payPalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD:
            paymentMethodId = payPalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;

            break;
        case payPalConstants.PAYMENT_METHOD_ID_APPLE_PAY:
            paymentMethodId = payPalConstants.PAYMENT_METHOD_ID_APPLE_PAY;

            break;
        case payPalConstants.PAYMENT_METHOD_ID_VENMO:
            paymentMethodId = payPalConstants.PAYMENT_METHOD_ID_VENMO;

            break;
        case payPalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY:
            paymentMethodId = payPalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY;

            break;
        default:
            paymentMethodId = billingForm.paymentMethod.value;

            break;
    }

    return paymentMethodId;
};

/**
 * Saves general transaction data
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument Current payment instrument
 * @param {Object} response A transaction create response object
 * @param {Object} request A transaction create request object
 */
paypalProcessorHelper.saveGeneralTransactionData = function(paymentInstrument, response, request) {
    const Transaction = require('dw/system/Transaction');
    const payPalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');

    const transactionId = payPalHelper.getTransactionId(response);
    const paymentTransaction = paymentInstrument.paymentTransaction;

    Transaction.wrap(function() {
        paymentInstrument.getPaymentTransaction().setTransactionID(transactionId);
        paymentInstrument.custom.paypalRequest = JSON.stringify(request);
        paymentInstrument.custom.paypalResponse = JSON.stringify(response);
        paymentInstrument.custom.paypalPaymentStatus = payPalHelper.getTransactionStatus(response);
        paymentTransaction.custom.paypalTransactionHistory = payPalHelper.prepareTransactionHistory(paymentTransaction, response);
    });
};

/**
 * Handles an error form the get Order details api call
 * @param {string} errorMessage An error message
 * @returns {Object} An error object
 */
paypalProcessorHelper.handleOrderDetailsError = function(errorMessage) {
    const Resource = require('dw/web/Resource');

    const paypalUtils = require('*/cartridge/scripts/paypal/utils');

    paypalUtils.createErrorLog(errorMessage);

    return {
        error: true,
        fieldErrors: [],
        serverErrors: [
            Resource.msg('paypal.error.general', 'paypalerrors', null)
        ]
    };
};

/**
 * Handles the Apple Pay in handle hook
 * @param {dw.order.LineItemCtnr} basket - current basket
 * @param {Object} billingForm - billing from
 * @param {dw.order.PaymentInstrument} paymentInstrument - PayPal payment instrument
 * @returns {Object} The shipping address object
 */
paypalProcessorHelper.handleApplePay = function(basket, billingForm, paymentInstrument) {
    const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
    const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');

    const Transaction = require('dw/system/Transaction');

    Transaction.wrap(function() {
        paymentInstrument.custom.paypalOrderID = session.privacy.paypalOrderID;
        paymentInstrument.custom.currentPaypalEmail = billingForm.paypal.applePay.applePayEmailAddress.value;
        paymentInstrument.custom.paymentId = billingForm.paypal.usedPaymentMethod.value;
    });

    session.privacy.paypalPayerEmail = billingForm.paypal.applePay.applePayEmailAddress.value;

    const applePayPaymentSource = JSON.parse(billingForm.paypal.applePay.applePayPaymentSource.value);
    const splittedFullName = paypalHelper.splitFullName(applePayPaymentSource.apple_pay.name);
    const orderDetails = paypalApi.getOrderDetails(paymentInstrument);
    const applePayShippingAddress = billingForm.paypal.applePay.applePayShippingAddressAsString.value;

    if (orderDetails.err) {
        return paypalProcessorHelper.handleOrderDetailsError(orderDetails.err);
    }

    addressHelper.updateOrderBillingAddress(basket, {
        address: applePayPaymentSource.apple_pay.card.billing_address,
        phone: {
            phone_number: {
                national_number: billingForm.paypal.applePay.applePayPhoneNumber.value
            }
        },
        name: {
            given_name: splittedFullName.firstName,
            surname: splittedFullName.lastName
        }
    });
    addressHelper.setCustomerEmailToBasket(billingForm.paypal.applePay.applePayEmailAddress.value, basket);

    const prefs = require('*/cartridge/config/preferences');

    if (prefs.isDigitalGoodsFlowEnabled) {
        return {
            shippingAddress: {}
        };
    }

    return {
        shippingAddress: applePayShippingAddress
            ? paypalProcessorHelper.prepareShippingAddressFromApplePay(
                JSON.parse(applePayShippingAddress), billingForm.paypal.applePay.applePayEmailAddress.value
            )
            : orderDetails.purchase_units[0].shipping.address
    };
};

/**
 * Returns the well formatted shipping address object
 * @param {Object} shippingAddress The shipping address object
 * @param {string} email Email address
 * @returns {Object} A prepared shipping address object
 */
paypalProcessorHelper.prepareShippingAddressFromApplePay = function(shippingAddress, email) {
    return {
        name: {
            full_name: [shippingAddress.givenName, shippingAddress.familyName].join(' ')
        },
        address: {
            country_code: shippingAddress.countryCode,
            address_line_1: shippingAddress.addressLines[0],
            address_line_2: shippingAddress.addressLines[1],
            postal_code: shippingAddress.postalCode,
            admin_area_1: shippingAddress.administrativeArea,
            admin_area_2: shippingAddress.locality

        },
        phone: {
            phone_number: {
                national_number: shippingAddress.phoneNumber
            }
        },
        email_address: email
    };
};

/**
 * Check response from Get Order call is liability shifted
 * @param {Object} paymentData payment data from request
 * @return {Object|undefined} return error object or undefined
 */
paypalProcessorHelper.process3DSecureResponse = function(paymentData) {
    const paypalPreferences = require('*/cartridge/config/preferences');
    const Resource = require('dw/web/Resource');

    let result;

    const authenticationResult = paymentData.authentication_result;
    const threeDSFailureReasons = {
        scaAlwaysAuthenticationResultNotProvided: paypalPreferences.threeDSecureFlow === payPalConstants.SCA_ALWAYS && !authenticationResult
    };

    if (authenticationResult) {
        const isLiabilityShiftStatusNo = authenticationResult.liability_shift === payPalConstants.CC_3DS_LIABILITY_SHIFT_STATUS_NO;
        const isEnrollmentStatusProvided = authenticationResult.three_d_secure && authenticationResult.three_d_secure.enrollment_status;
        const isEnrollmentStatusYes = isEnrollmentStatusProvided
            && authenticationResult.three_d_secure.enrollment_status === payPalConstants.CC_3DS_ALLOWED_ENROLLMENT_STATUS_YES;

        const isEnrollmentStatusUnavailable = isEnrollmentStatusProvided
            && authenticationResult.three_d_secure.enrollment_status === payPalConstants.CC_3DS_ALLOWED_ENROLLMENT_STATUS_UNAVAILABLE;

        threeDSFailureReasons.isLiabilityShiftedUnknown
            = authenticationResult.liability_shift === payPalConstants.CC_3DS_LIABILITY_SHIFT_STATUS_UNKNOWN;
        threeDSFailureReasons.isLiabilityNotShifted = isLiabilityShiftStatusNo && (
            isEnrollmentStatusYes
            || !isEnrollmentStatusProvided
            || isEnrollmentStatusUnavailable);
    }

    if (threeDSFailureReasons.scaAlwaysAuthenticationResultNotProvided
        || threeDSFailureReasons.isLiabilityShiftedUnknown
        || threeDSFailureReasons.isLiabilityNotShifted) {
        result = {
            error: true,
            fieldErrors: [],
            serverErrors: [
                Resource.msg('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null)
            ]
        };
    }

    return result;
};

module.exports = paypalProcessorHelper;
