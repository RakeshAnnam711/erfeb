'use strict';

/**
 * Creates SFCC Gift Certificate if it exists in the order
 * @param {dw.order.Order} order - SFCC order
 * @returns {dw.system.Status} - order status
 */
function createGiftCertificate(order) {
    var Status = require('dw/system/Status');

    try {
        if (!order) {
            throw new Error('order is null');
        }

        var giftCertificateLineItems = order.giftCertificateLineItems;
        if (giftCertificateLineItems.length > 0) {
            require('*/cartridge/scripts/factories/globale/alternativePayments')({
                giftCertificateLineItems: giftCertificateLineItems,
                order: order,
                GiftCardTypeId: 'GiftCard'
            }).create();
        }
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK, '0', 'createGiftCertificate:OK');
}

module.exports = function (object) {
    Object.defineProperty(object, 'createGiftCertificate', {
        value: createGiftCertificate
    });
};
