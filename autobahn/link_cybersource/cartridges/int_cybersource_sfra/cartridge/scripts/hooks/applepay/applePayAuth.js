'use strict';

var Status = require('dw/system/Status');
var server = require('server');
var CardHelper = require('~/cartridge/scripts/helper/CardHelper');
var paymentMethodID = 'DW_APPLE_PAY';
var Transaction = require('dw/system/Transaction');

/**
 *
 * @param {Object} responseBillingAddress billing data from apple response
 */
function setBillingAddress(responseBillingAddress) {
    var billingForm = server.forms.getForm('billing');
    var billingAddress = {
        firstName: responseBillingAddress.givenName,
        lastName: responseBillingAddress.lastName,
        address1: responseBillingAddress.addressLines[0],
        address2: responseBillingAddress.addressLines[1] ? responseBillingAddress.addressLines[1] : '',
        city: responseBillingAddress.locality,
        stateCode: responseBillingAddress.administrativeArea,
        postalCode: responseBillingAddress.postalCode,
        country: responseBillingAddress.countryCode,
        paymentMethod: paymentMethodID
    };
    billingForm.copyFrom(billingAddress);
}

/**
 *
 * @param {Object} responseShippingAddress billing data from apple response
 */
function setShippingAddress(responseShippingAddress) {
    var shippingForm = server.forms.getForm('shipping');
    var shippingAddress = {
        firstName: responseShippingAddress.givenName,
        lastName: responseShippingAddress.lastName,
        address1: responseShippingAddress.addressLines[0],
        address2: responseShippingAddress.addressLines[1] ? responseShippingAddress.addressLines[1] : '',
        city: responseShippingAddress.locality,
        stateCode: responseShippingAddress.administrativeArea,
        postalCode: responseShippingAddress.postalCode,
        country: responseShippingAddress.countryCode,
        phone: responseShippingAddress.phoneNumber
    };
    shippingForm.copyFrom(shippingAddress);
}

//AUTOBAHN MOD
exports.authorizeOrderPayment = function (order, responseData) {
    var status = Status.ERROR;
    var authResponseStatus;
    var PaymentMgr = require('dw/order/PaymentMgr');
    var HookMgr = require('dw/system/HookMgr');

    setBillingAddress(responseData.payment.billingContact);
    setShippingAddress(responseData.payment.shippingContact);

    if (empty(order.getPaymentInstruments()) ) {
        return new Status(status);
    }

    Transaction.wrap(function () {
        for (var i in order.paymentInstruments) {
            var paymentInstrument = order.paymentInstruments[i];
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).paymentProcessor;
            if (paymentInstrument.paymentMethod === dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
                //important to call "authorize" hook on gift certificates so the transaction history is complete in business manager
                var result = HookMgr.callHook(
                    'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                    'Authorize',
                    order.orderNo,
                    paymentInstrument,
                    paymentProcessor
                );
                if (result.error) {
                    return new Status(status);
                }
            } else if (paymentInstrument.paymentMethod === dw.order.PaymentInstrument.METHOD_DW_APPLE_PAY) {
                paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
                authResponseStatus = require('~/cartridge/scripts/mobilepayments/adapter/MobilePaymentsAdapter').processPayment(order);
            }
        }
    });


    if (CardHelper.HandleCardResponse(authResponseStatus.ServiceResponse.serviceResponse).authorized || CardHelper.HandleCardResponse(authResponseStatus.ServiceResponse.serviceResponse).review) {
        status = Status.OK;
    }

    return new Status(status);
};
