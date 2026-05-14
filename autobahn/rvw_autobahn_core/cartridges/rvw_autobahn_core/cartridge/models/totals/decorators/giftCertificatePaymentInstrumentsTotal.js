'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'giftCertificatePaymentInstrumentsTotalFormatted', {
        enumerable: true,
        value: function(object, apiObject) {
            var collections = require('*/cartridge/scripts/util/collections');
            var giftCertificatesTotal = collections.reduce(apiObject.giftCertificatePaymentInstruments, function (value, item, index, collection) {
                return value.add(item.paymentTransaction.amount);
            }, new dw.value.Money(0, apiObject.currencyCode))

            if (giftCertificatesTotal.valueOrNull) {
                return dw.util.StringUtils.formatMoney(giftCertificatesTotal);
            } else {
                return '';
            }
        } (object, apiObject)
    })

    Object.defineProperty(object, 'giftCertificatePaymentInstrumentsTotalValue', {
        enumerable: true,
        value: function(object, apiObject) {
            var collections = require('*/cartridge/scripts/util/collections');
            var giftCertificatesTotal = collections.reduce(apiObject.giftCertificatePaymentInstruments, function (value, item, index, collection) {
                return value.add(item.paymentTransaction.amount);
            }, new dw.value.Money(0, apiObject.currencyCode))

            if (giftCertificatesTotal.valueOrNull) {
                return giftCertificatesTotal.decimalValue.valueOf();
            } else {
                return '';
            }
        } (object, apiObject)
    })
}
