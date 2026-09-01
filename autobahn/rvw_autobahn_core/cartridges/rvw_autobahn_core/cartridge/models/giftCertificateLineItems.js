'use strict';


/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.GiftCertificateLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createGiftCertificateLineItemsObject(allLineItems, view) {
    var lineItems = [];

    var GiftCertificateLineItemModel = require('*/cartridge/models/giftCertificateLineItem/giftCertificateLineItem');
    var collections = require('*/cartridge/scripts/util/collections');
    collections.forEach(allLineItems, function (item) {
        var giftCertificateLineItemModel = new GiftCertificateLineItemModel({}, item);
        lineItems.push(giftCertificateLineItemModel);
    });
    return lineItems;
}

/**
 * @constructor
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 *
 * @param {dw.util.Collection<dw.order.GiftCertificateLineItem>} giftCertificateLineItems - the gift cerfiticate line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function GiftCertificateLineItems(giftCertificateLineItems, view) {
    if (giftCertificateLineItems) {
        var lineItems = createGiftCertificateLineItemsObject(giftCertificateLineItems, view);
        this.items = lineItems;
        this.totalQuantity = lineItems.length;
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

module.exports = GiftCertificateLineItems;
