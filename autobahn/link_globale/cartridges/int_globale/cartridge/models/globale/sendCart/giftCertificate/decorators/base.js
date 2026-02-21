'use strict';

module.exports = function (object, giftCertificateLineItem) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        },
        giftCertificateLineItem: {
            enumerable: true,
            value: giftCertificateLineItem
        }
    });
};
