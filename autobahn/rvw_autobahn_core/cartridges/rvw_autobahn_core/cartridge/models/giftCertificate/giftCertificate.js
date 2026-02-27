'use strict';

var giftCertificateDecorators = require('*/cartridge/models/giftCertificate/decorators/index');

module.exports = function giftCertificate(giftCertificate, apiObject) {
    giftCertificateDecorators.giftCertificateCode(giftCertificate, apiObject);
    giftCertificateDecorators.message(giftCertificate, apiObject);
    giftCertificateDecorators.amount(giftCertificate, apiObject);
    giftCertificateDecorators.balance(giftCertificate, apiObject);
    giftCertificateDecorators.senderName(giftCertificate, apiObject);
    giftCertificateDecorators.recipientName(giftCertificate, apiObject);
    giftCertificateDecorators.recipientEmail(giftCertificate, apiObject);

    return giftCertificate;
}
