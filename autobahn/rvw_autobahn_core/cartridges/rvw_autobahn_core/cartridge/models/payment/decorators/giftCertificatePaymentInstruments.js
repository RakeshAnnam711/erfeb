'use strict';

module.exports = function (object, apiBasket, apiCustomer, countryCode) {
    Object.defineProperty(object, 'giftCertificatePaymentInstruments', {
        enumerable: true,
        value: function(object, apiBasket, apiCustomer, countryCode) {
            var result = [];
            for (var i in object.selectedPaymentInstruments) {
                var paymentInstrument = object.selectedPaymentInstruments[i];
                if (paymentInstrument.paymentMethod === dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
                    result.push(paymentInstrument);
                }
            }
            return result;
        } (object, apiBasket, apiCustomer, countryCode)
    })
}
