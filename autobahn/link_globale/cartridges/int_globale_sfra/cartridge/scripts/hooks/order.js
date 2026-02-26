/* eslint no-unused-vars: "off", no-useless-return: "off", consistent-return: "off" */

'use strict';

/**
 * dw.ocapi.shop.order.beforePOST hook for Global-e
 * @param {dw.order.Basket} basket - the basket based on which the order is created
 * @returns {dw.system.Status|undefined} - error status or nothing/undefined
 */
exports.beforePOST = function (basket) {
    var Status = require('dw/system/Status');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');
    var geBasketMgr = require('*/cartridge/scripts/factories/globale/dw/basket');

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return;
    }

    // check if there is S2S order create request and if yes, handle it
    if (globaleCAPIHelpers.isCAPIOrderCreateRequest()) {
        var geBasket = geBasketMgr.get(basket);

        // validate basket hash
        var basketSnapShot = globaleBasketHelpers.getStorefrontBasketSnapshot(basket);
        var payloadHash = globaleCAPIHelpers.getCAPIRequestBasketHash();
        if (payloadHash !== basketSnapShot.getHash()) {
            return new Status(Status.ERROR, '109', 'Basket hash does not match. Basket hash: ' + basketSnapShot.getHash() + '; SnapShot: ' + basketSnapShot.getData() + '.');
        }

        // update basket
        var basketCurrencyCode = globaleCAPIHelpers.getCAPIRequestBasketCurrencyCode();
        geBasket.geUpdateCurrency(basketCurrencyCode);
        geBasket.geUpdateShipments();
        geBasket.geSetDefaultShippingMethod();
        geBasket.geSetDefaultPaymentInstrument();
        geBasket.geSetDefaultBillingAddress();
        geBasket.geSetDefaultShippingAddress();

        // set gift certificate line item price
        if (globaleHelpers.isNativeGiftCertificateEnabled() && basket.giftCertificateLineItems.length > 0) {
            collections.forEach(basket.giftCertificateLineItems, function (giftCertificateLineItem) {
                giftCertificateLineItem.setPriceValue(giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice]);
            });
        }

        // set request locale
        globaleCAPIHelpers.setCAPIRequestLocale();
    }
};

/**
 * dw.ocapi.shop.order.afterPOST hook for Global-e
 * @param {dw.order.Order} order - the order that was created for the basket
 */
exports.afterPOST = function (order) {
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var GiftCertificate = require('dw/order/GiftCertificate');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return;
    }

    // check if there is S2S order create request and if yes, handle it
    if (globaleCAPIHelpers.isCAPIOrderCreateRequest()) {
        // set request locale
        globaleCAPIHelpers.setCAPIRequestLocale();

        if (globaleHelpers.isNativeGiftCertificateEnabled() && order.giftCertificateLineItems.length > 0) {
            collections.forEach(order.giftCertificateLineItems, function (giftCertificateLineItem) {
                var giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(giftCertificateLineItem.getGiftCertificateID());
                if (giftCertificate) {
                    giftCertificate.setStatus(GiftCertificate.STATUS_PENDING);
                    giftCertificate.setEnabled(false);
                }
            });

            // invoke custom hook
            globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.giftCertificate.afterGiftCertificateOrderCreate);
        }
    }
};
/**
 * dw.order.createOrderNo hook for Global-e
 * @returns {string|null} - order number
 */
exports.createOrderNo = function () {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return null;
    }

    var result = null;

    // check if there is S2S order create request and if yes, handle it
    if (globaleCAPIHelpers.isCAPIOrderCreateRequest()) {
        result = globaleCAPIHelpers.getCAPIRequestReservedOrderNo();
    }

    return result;
};
