'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'grandTotalLessGiftCertificatePaymentInstrumentsFormatted', {
        enumerable: true,
        value: function(object, apiObject) {
            var collections = require('*/cartridge/scripts/util/collections');
            var giftCertificatesTotal = collections.reduce(apiObject.giftCertificatePaymentInstruments, function (value, item, index, collection) {
                return value.add(item.paymentTransaction.amount);
            }, new dw.value.Money(0, apiObject.currencyCode))

            return dw.util.StringUtils.formatMoney(apiObject.totalGrossPrice.subtract(giftCertificatesTotal));
        } (object, apiObject)
    })

    Object.defineProperty(object, 'grandTotalLessGiftCertificatePaymentInstrumentsValue', {
        enumerable: true,
        value: function(object, apiObject) {
            var collections = require('*/cartridge/scripts/util/collections');
            var giftCertificatesTotal = collections.reduce(apiObject.giftCertificatePaymentInstruments, function (value, item, index, collection) {
                return value.add(item.paymentTransaction.amount);
            }, new dw.value.Money(0, apiObject.currencyCode))

            return apiObject.totalGrossPrice.subtract(giftCertificatesTotal).valueOrNull;
        } (object, apiObject)
    })
}
