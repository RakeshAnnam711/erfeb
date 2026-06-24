'use strict';

var productDecorators = require('*/cartridge/models/product/decorators/index');
var productLineItemDecorators = require('*/cartridge/models/productLineItem/decorators/index');
var giftCertificateDecorators = require('*/cartridge/models/giftCertificate/decorators/index');
var giftCertificateLineItemDecorators = require('*/cartridge/models/giftCertificateLineItem/decorators/index');

/**
 * Decorate model with gift certificate line item information
 * @param {Object} giftCertificateLineItem - Gift Certificate Line Item Model to be decorated
 * @param {dw.order.GiftCertificateLineItem} apiObject - GiftCertificateLineItem information returned by the script API
 *
 * @returns {Object} - Decorated giftCertificateLineItem model
 */
module.exports = function giftCertificateLineItem(giftCertificateLineItem, apiObject, options) {
    productLineItemDecorators.uuid(giftCertificateLineItem, apiObject);
    productLineItemDecorators.shipment(giftCertificateLineItem, apiObject);

    giftCertificateLineItemDecorators.giftCertificateID(giftCertificateLineItem, apiObject);
    giftCertificateDecorators.message(giftCertificateLineItem, apiObject);
    giftCertificateDecorators.recipientEmail(giftCertificateLineItem, apiObject);
    giftCertificateDecorators.recipientName(giftCertificateLineItem, apiObject);
    giftCertificateDecorators.senderName(giftCertificateLineItem, apiObject);
    giftCertificateLineItemDecorators.priceTotal(giftCertificateLineItem, apiObject);
    giftCertificateLineItemDecorators.productType(giftCertificateLineItem, apiObject);

    giftCertificateLineItem.noProduct = true;
    giftCertificateLineItem.quantity = 1;

    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    giftCertificateLineItem.productName = Resource.msg('giftcertificate.purchase.giftcertificate', 'checkout', null);
    giftCertificateLineItem.images = {
        small: [
            {
                url: URLUtils.staticURL(URLUtils.CONTEXT_LIBRARY, '', 'images/gift-certificates.png'),
                alt: Resource.msg('giftcertificate.purchase.giftcertificate', 'checkout', null),
                title: Resource.msg('giftcertificate.purchase.giftcertificate', 'checkout', null)
            }
        ]
    }

    return giftCertificateLineItem;
};
