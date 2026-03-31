'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'giftCertificatePaymentInstrumentsLabel', {
        enumerable: true,
        value: function(object, apiObject) {
            var Resource = require('dw/web/Resource');
            if (apiObject.giftCertificatePaymentInstruments.length) {
                return dw.web.Resource.msg((apiObject.giftCertificatePaymentInstruments.length > 1 ? 'giftcertificate.purchase.giftcertificates' : 'giftcertificate.purchase.giftcertificate'), 'checkout', null) + dw.util.StringUtils.format(dw.web.Resource.msg('giftcertificate.checkout.applied.quantitydisplay', 'checkout', null), apiObject.giftCertificatePaymentInstruments.length)
            } else {
                 return '';
            }
        } (object, apiObject)
    })
}
