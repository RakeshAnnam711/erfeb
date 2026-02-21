'use strict';

var Resource = require('dw/web/Resource');

/**
 * Update the view data with information from the confirmed Salesforce Payments payment intent.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var BasketMgr = require('dw/order/BasketMgr');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = viewFormData;
    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };
    viewData.paymentInformation = {
        // responsible for telling Handle hook not to validate a payment (that should only happen from SubmitPayment, not SubmitBilling)
        routeName: viewFormData.routeName || ''
    };

    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentAmount = paymentHelpers.getPaymentAmount(currentBasket);
    if (paymentAmount.value > 0 && (!viewFormData.routeName || viewFormData.routeName !== 'SubmitBilling')) {
        var paymentIntent = paymentHelpers.getPaymentIntent(currentBasket);
        if (!paymentIntent || !paymentIntent.paymentMethod) {
            return {
                error: true,
                serverErrors: [Resource.msg('error.technical', 'checkout', null)]
            };
        }

        /* var method = Resource.msg('label.method.' + paymentIntent.paymentMethod.type, 'payment', null); */

        /* viewData.paymentMethod = { */
        /*     value: method, */
        /*     htmlName: method */
        /* }; */

        /* viewData.paymentInformation = { */
        /*     method: { */
        /*         value: method, */
        /*         htmlName: method */
        /*     }, */
        /*     // responsible for telling Handle hook not to validate a payment (that should only happen from SubmitPayment, not SubmitBilling) */
        /*     routeName: viewFormData.routeName || '' */
        /* }; */

        /* viewData.saveCard = false; */
    }

    var result = {
        error: false,
        viewData: viewData
    };

    var formFieldErrors = {};
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var creditCardFormErrors = COHelpers.validateCreditCard(paymentForm);
    var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);

    if (Object.keys(creditCardFormErrors).length) {
        Object.keys(creditCardFormErrors).forEach(function (key) {
            formFieldErrors[key] = creditCardFormErrors[key];
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
 * default hook if no save payment information processor is supported
 */
function savePaymentInformation() {
    return;
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
