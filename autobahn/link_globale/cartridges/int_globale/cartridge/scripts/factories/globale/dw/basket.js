'use strict';

module.exports = {
    get: function (basket) {
        if (!basket) {
            throw Error('basket shouldn\'t be null');
        }

        var geBasket = Object.create(basket);
        var basketDecorators = require('*/cartridge/models/globale/dw/basket/decorators/index');
        basketDecorators.geShippingMethod(geBasket);
        basketDecorators.geUpdateCurrency(geBasket);
        basketDecorators.geValidateBasket(geBasket);
        basketDecorators.geCollectOriginalDiscountsData(geBasket);
        basketDecorators.gePreserveOriginalPrices(geBasket);
        basketDecorators.geUpdateDiscounts(geBasket);
        basketDecorators.geUpdateShipments(geBasket);
        basketDecorators.geSetZeroShippingPrice(geBasket);
        basketDecorators.geSetDefaultPaymentInstrument(geBasket);
        basketDecorators.geSetDefaultBillingAddress(geBasket);
        basketDecorators.geSetDefaultShippingAddress(geBasket);
        basketDecorators.geUpdateProductsCartItemId(geBasket);
        basketDecorators.geUpdateProductsInventoryList(geBasket);
        basketDecorators.gePreserveStorefrontPrices(geBasket);

        return geBasket;
    },
    geClearCart: function (basket) {
        var Transaction = require('dw/system/Transaction');
        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
        var logger = globaleHelpers.getLogger();
        try {
            if (basket) {
                Transaction.wrap(function () {
                    basket.custom[globaleHelpers.customAttr.basket.geCartToken] = null; // eslint-disable-line no-param-reassign
                    basket.custom[globaleHelpers.customAttr.basket.geMerchantOrderId] = null; // eslint-disable-line no-param-reassign
                    basket.custom[globaleHelpers.customAttr.basket.geIsOrderCreatedFallbackScenario] = null; // eslint-disable-line no-param-reassign
                    basket.custom[globaleHelpers.customAttr.basket.geIsOrderCreatedPayByLinkScenario] = null; // eslint-disable-line no-param-reassign
                });

                Transaction.wrap(function () {
                    var collections = require('*/cartridge/scripts/util/globale/collections');
                    collections.forEach(basket.getProductLineItems(), function (e) { basket.removeProductLineItem(e); });
                    collections.forEach(basket.getCouponLineItems(), function (e) { basket.removeCouponLineItem(e); });
                });
            }
            return true;
        } catch (e) {
            logger.error('GLOBALE_CLEAR_CART: {0}', logger.message(e));
            return false;
        }
    },
    geUpdateGiftCertificateCartItemId: function (basket) {
        var Transaction = require('dw/system/Transaction');
        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
        var collections = require('*/cartridge/scripts/util/globale/collections');
        var giftCertificateLineItems = basket.getGiftCertificateLineItems();
        if (basket && giftCertificateLineItems.length > 0) {
            var productLineItemsLength = basket.getAllProductLineItems().length;
            collections.forEach(giftCertificateLineItems, function (giftCertificateLineItem, index) {
                Transaction.wrap(function () {
                    giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.geCartItemId] = (productLineItemsLength + index + 1).toString(); // eslint-disable-line no-param-reassign
                    if (!basket.custom[globaleHelpers.customAttr.basket.geIsOrderCreatedFallbackScenario]) {
                        giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.geGiftCertificateID] = 'GC_' + giftCertificateLineItem.UUID; // eslint-disable-line no-param-reassign
                    }
                });
            });
        }
    },
    isGeBasket: function (basket, original) {
        var globaleSession = require('*/cartridge/models/globale/session');
        var result = false;

        if (globaleSession.get('geOperatedCountry') && original !== true) {
            result = true;
        }

        return result;
    }
};
