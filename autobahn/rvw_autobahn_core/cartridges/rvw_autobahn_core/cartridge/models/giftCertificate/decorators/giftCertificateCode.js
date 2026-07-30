'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'giftCertificateCode', {
        enumerable: true,
        value: apiObject.giftCertificateCode
    });
};
