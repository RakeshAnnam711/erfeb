"use strict";

var base = module.superModule;

var Resource = require('dw/web/Resource');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
function errorHandler() {
    var serverErrors = [Resource.msg('error.payment.processor.not.supported', 'checkout', null)];
    return {
        authorized: false,
        fieldErrors: [],
        serverErrors: serverErrors,
        error: true
    };
}
function paymentErrorHandler(result) {
    AdyenLogs.error_log("Payment failed, result: ".concat(JSON.stringify(result)));
    Transaction.rollback();
    return {
        error: true
    };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {dw.order.Order} order - The current order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function authorize(order, paymentInstrument, paymentProcessor) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(order);
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    Transaction.begin();
    var result = adyenCheckout.createPaymentRequest({
        Order: order,
        PaymentInstrument: paymentInstrument
    });
    if (result.error) {
        return errorHandler();
    }
    var checkoutResponse = AdyenHelper.createAdyenCheckoutResponse(result);
    if (!checkoutResponse.isFinal) {
        return checkoutResponse;
    }
    if (!checkoutResponse.isSuccessful) {
        return paymentErrorHandler(result);
    }
    AdyenHelper.savePaymentDetails(paymentInstrument, order, result.fullResponse);
    Transaction.commit();

    request.session.privacy.currentOrderNumber = order.orderNo;
    request.session.privacy.currentOrderToken = order.orderToken;

    //Check if gift card was used
    if(session.privacy.giftCardResponse) {
        const mainPaymentInstrument = paymentInstrument;
        const divideBy = AdyenHelper.getDivisorForCurrency(mainPaymentInstrument.paymentTransaction.getAmount());
        const parsedGiftCardObj = JSON.parse(session.privacy.giftCardResponse);
        const amount = {value: parsedGiftCardObj.remainingAmount.value, currency: parsedGiftCardObj.remainingAmount.currency};
        const formattedAmount = new Money(amount.value, amount.currency).divide(divideBy);
        Transaction.wrap(() => {
            mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount); //update amount from order total to PM total
        });

        createGiftcardPM(parsedGiftCardObj, divideBy);
    }

    return {
        authorized: true,
        error: false
    };
}

function createGiftcardPM(parsedGiftCardObj, divideBy) {
    let paymentInstrument;
    const paidGiftcardAmount = {value: parsedGiftCardObj.value, currency: parsedGiftCardObj.currency};
    const paidGiftcardAmountFormatted = new Money(paidGiftcardAmount.value, paidGiftcardAmount.currency).divide(divideBy);
    Transaction.wrap(() => {
        paymentInstrument = order.createPaymentInstrument(
            constants.METHOD_ADYEN_COMPONENT,
            paidGiftcardAmountFormatted,
        );
        const { paymentProcessor } = PaymentMgr.getPaymentMethod(
            paymentInstrument.paymentMethod,
        );
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;

      paymentInstrument.custom.adyenPaymentMethod = parsedGiftCardObj.brand;
      paymentInstrument.paymentTransaction.custom.Adyen_log = session.privacy.giftCardResponse;
      paymentInstrument.paymentTransaction.custom.Adyen_pspReference = parsedGiftCardObj.giftCardpspReference;
    })
}

module.exports = {
    authorize: authorize,
    createGiftcardPM: createGiftcardPM,
    errorHandler: errorHandler,
    paymentErrorHandler: paymentErrorHandler
}

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
