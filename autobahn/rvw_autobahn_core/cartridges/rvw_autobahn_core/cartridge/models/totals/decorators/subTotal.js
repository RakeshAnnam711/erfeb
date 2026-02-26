'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'subTotal', {
        enumerable: true,
        value: function(object, apiObject) {
            var currentSubTotal = apiObject.getAdjustedMerchandizeTotalPrice(false);
            var collections = require('*/cartridge/scripts/util/collections');

            var giftCertificatesSubTotal = collections.reduce(apiObject.giftCertificateLineItems, function (value, item, index, collection) {
                return value.add(item.price);
            }, new dw.value.Money(0, apiObject.currencyCode))

            var formatMoney = require('dw/util/StringUtils').formatMoney;
            if (!currentSubTotal.available && giftCertificatesSubTotal.value == 0) {
                //I don't know why, but the base implementation returns this, so we'll do the same
                return '-';
            } else if (!currentSubTotal.available && giftCertificatesSubTotal.value > 0) {
                return formatMoney(giftCertificatesSubTotal);
            } else {
                return formatMoney(currentSubTotal.add(giftCertificatesSubTotal));
            }
        } (object, apiObject)
    })
}
