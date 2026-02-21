'use strict';

module.exports = function (object, apiLineItemCtnr, apiCustomer, countryCode) {
    var giftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var paymentInstruments = object.selectedPaymentInstruments;
    for (var i in paymentInstruments) {
        var paymentInstrument = paymentInstruments[i];
        paymentInstrument.formattedAmount = dw.util.StringUtils.formatMoney(new dw.value.Money(paymentInstrument.amount, apiLineItemCtnr.currencyCode));
        if (paymentInstrument.paymentMethod === 'CREDIT_CARD') {
            if (paymentInstrument.expirationYear) {
                var unmaskedYear = paymentInstrument.expirationYear.toString();
                paymentInstrument.maskedExpirationYear = '***' + unmaskedYear.slice(-1);
            }
        } else if (paymentInstrument.paymentMethod === "GIFT_CERTIFICATE") {
            var giftCertificate = giftCertificateMgr.getGiftCertificateByCode(paymentInstrument.giftCertificateCode);
            if (giftCertificate) {
                if (apiLineItemCtnr instanceof dw.order.Order && apiLineItemCtnr.confirmationStatus.value === dw.order.Order.CONFIRMATION_STATUS_CONFIRMED) {
                    // order has been created, and placed successfully
                        paymentInstrument.formattedRemainingBalance = dw.util.StringUtils.formatMoney(giftCertificate.balance);
                } else {
                    // otherwise this is still a basket, simulate how much will be remaining
                    paymentInstrument.formattedRemainingBalance = dw.util.StringUtils.formatMoney(new dw.value.Money(Math.max(giftCertificate.balance.subtract(new dw.value.Money(paymentInstrument.amount, apiLineItemCtnr.currencyCode)), 0), apiLineItemCtnr.currencyCode));
                }
            }
        }
    }
}
