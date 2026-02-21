'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'giftCertificateID', {
        enumerable: true,
        value: apiProduct.giftCertificateID
    });
};
