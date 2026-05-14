'use strict';
/**
 * Verifies that entered gift certificate information is a valid card.
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
exports.Handle = function Handle(basket, paymentInformation) {
    // Nothing to do, we already ajax'd the gift certificate codes as payment instruments
    // We'll handle the possibility that they tried to double use a gift certificate on two separate baskets
    // and inform them they now need a real payment instrument from the Authorize step
    return { fieldErrors: [], serverErrors: [], error: false };
}


/**
* Authorizes a gift certificate
*
* @param {number}  orderNumber - Order number.
* @param {PaymentInstrument}  paymentInstrument - Payment Instrument
* @param {PaymentProcessor}  paymentProcessor - Payment Processor
* @returns {Object} -  {fieldErrors: [], serverErrors: [], error: Boolean}
*/
exports.Authorize = function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        paymentInstrument.paymentTransaction.transactionID = orderNumber;

        // WE DO NOT TAKE OFF GC BALANCES HERE ON PURPOSE
        // If other payments fail to auth or the fraud check fails, we will be stuck with a drained gc
        // Alternatve instead is to only redeem the amount inside checkoutHelpers.placeOrder
        // return GiftCertificateMgr.redeemGiftCertificate(paymentInstrument);
    });

    return { authorized: true, error: false, authResponse: {}};
};

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
exports.processForm = function processForm(req, paymentForm, viewFormData) {
    paymentForm.paymentMethod.value = dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE;
    viewFormData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    var result = {
        error: false,
        viewData: viewFormData
    };

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    //Gift cert only transactions just need to ensure that we have a phone/email and first/last name
    var formFieldErrors = {};
    var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);
    var firstAndLast = {
        firstName: paymentForm.addressFields.firstName,
        lastName: paymentForm.addressFields.lastName,
    }
    var billingFormErrors = COHelpers.validateFields(firstAndLast);

    if (Object.keys(contactInfoFormErrors).length) {
        Object.keys(contactInfoFormErrors).forEach(function (key) {
            formFieldErrors[key] = contactInfoFormErrors[key];
        });
    }

    if (Object.keys(billingFormErrors).length) {
        Object.keys(billingFormErrors).forEach(function (key) {
            formFieldErrors[key] = billingFormErrors[key];
        });
    }

    if (Object.keys(formFieldErrors).length) {
        result.error = true;
        result.fieldErrors = formFieldErrors;
    }

    return result;
}

/**
 * its a gift certificate, so nothing to do
 */
exports.savePaymentInformation = function savePaymentInformation() {
    return;
}
