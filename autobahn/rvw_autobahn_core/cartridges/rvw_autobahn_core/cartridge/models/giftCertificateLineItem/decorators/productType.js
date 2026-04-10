'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'productType', {
        enumerable: true,
        value: 'giftCertificate'
    });
};
