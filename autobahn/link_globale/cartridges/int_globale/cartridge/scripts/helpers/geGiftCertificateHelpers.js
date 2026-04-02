/* eslint-disable no-param-reassign */

'use strict';

var redeemStatus = {
    PENDING: 'PENDING',
    REDEEMED: 'REDEEMED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    REFUNDEDTONEW: 'REFUNDEDTONEW'
};

/**
 * Sets custom attributes to Gift Certificate
 * @param {dw.order.GiftCertificate} giftCertificate - Gift Certificate
 * @param {Object} payload  - Gift Certificate data
 */
function setGiftCertificateCustomAttr(giftCertificate, payload) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    giftCertificate.custom[globaleHelpers.customAttr.giftCertificate.geInternationalPrice] = payload.geInternationalPrice;
    giftCertificate.custom[globaleHelpers.customAttr.giftCertificate.geCurrencyCode] = payload.geCurrencyCode;
    giftCertificate.custom[globaleHelpers.customAttr.giftCertificate.originalCurrencyCode] = payload.originalCurrencyCode;
    giftCertificate.custom[globaleHelpers.customAttr.giftCertificate.initialBalance] = payload.gePriceValue;
    giftCertificate.custom[globaleHelpers.customAttr.giftCertificate.currentBalance] = payload.gePriceValue;
}

/**
 * Creates SFCC Gift Certificate and sets data to it
 * @param {dw.order.GiftCertificateLineItem} payload - payload with data for Gift Certificate
 * @returns {dw.system.Status} - status of creation Gift Certificate
 */
function createGiftCertificate(payload) {
    var Status = require('dw/system/Status');
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');

    try {
        var giftCertificate = GiftCertificateMgr.createGiftCertificate(payload.gePriceValue);
        giftCertificate.setRecipientEmail(payload.recipientEmail);
        giftCertificate.setRecipientName(payload.recipientName);
        giftCertificate.setSenderName(payload.senderName);
        giftCertificate.setMessage(payload.message);
        giftCertificate.setOrderNo(payload.orderNo);

        setGiftCertificateCustomAttr(giftCertificate, payload);

        if (payload.giftCertificateLineItem) {
            payload.giftCertificateLineItem.setGiftCertificateID(giftCertificate.giftCertificateCode);
        }

        return new Status(Status.OK);
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }
}

module.exports = {
    redeemStatus: redeemStatus,
    createGiftCertificate: createGiftCertificate,
    setGiftCertificateCustomAttr: setGiftCertificateCustomAttr
};
