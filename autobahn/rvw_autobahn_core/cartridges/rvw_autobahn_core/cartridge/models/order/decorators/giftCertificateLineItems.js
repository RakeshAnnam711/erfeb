'use strict';

module.exports = function (object, apiObject, view) {
    Object.defineProperty(object, 'giftCertificateLineItems', {
        enumerable: true,
        value: function(object, apiObject, view) {
          var GiftCertificateLineItemsModel = require('*/cartridge/models/giftCertificateLineItems');
          return new GiftCertificateLineItemsModel(apiObject.giftCertificateLineItems, view)
        } (object, apiObject, view)
    })
}
