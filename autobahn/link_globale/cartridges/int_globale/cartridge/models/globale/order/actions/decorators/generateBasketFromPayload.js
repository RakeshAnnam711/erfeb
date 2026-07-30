'use strict';

/**
 * Creates SFCC basket from Global-e API payload
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function generateBasketFromPayload(payload) {
    var System = require('dw/system/System');
    var Status = require('dw/system/Status');
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var globaleWebStoreHelpers = require('*/cartridge/scripts/helpers/globaleWebStoreHelpers');

    try {
        var merchantOrderId = objectUtils.getValueByPath(payload, 'MerchantOrderId', null);

        // validate web store
        if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccDoWebStoreValidation, System.instanceType !== System.PRODUCTION_SYSTEM, 'boolean')) {
            var geWebStoreUUID = globaleHelpers.getUrlParametersValue(payload.UrlParameters, globaleHelpers.preferenceKeys.geWebStoreUUID);
            globaleWebStoreHelpers.validateWebStore(geWebStoreUUID);
        }

        // init Global-e session data
        var geIsEndCustomerPrimary = objectUtils.getValueByPath(payload, 'Customer.IsEndCustomerPrimary', null);
        var countryCode = geIsEndCustomerPrimary ?
            objectUtils.getValueByPath(payload, 'PrimaryShipping.CountryCode', null) :
            objectUtils.getValueByPath(payload, 'SecondaryShipping.CountryCode', null);
        var currencyCode = objectUtils.getValueByPath(payload, 'InternationalDetails.CurrencyCode', null);
        globaleHelpers.setSession(countryCode, currencyCode);

        var basket = BasketMgr.getCurrentOrNewBasket();
        var shipment = basket.shipments.length ? basket.shipments[0] : basket.createShipment(UUIDUtils.createUUID());
        var products = objectUtils.getValueByPath(payload, 'Products', []);

        products.forEach(function (p) {
            var product = null;
            var pli = null;
            var sku = decodeURIComponent(p.Sku);
            // generate object with metadata attributes
            var metadataObj = {};
            if (p.Attributes && Array.isArray(p.Attributes) && p.Attributes.length > 0) {
                p.Attributes.forEach(function (attr) {
                    metadataObj[attr.AttributeKey] = attr.AttributeValue;
                });
            }
            if (p.IsGiftCard && globaleHelpers.isNativeGiftCertificateEnabled()) {
                var recipientEmail = metadataObj.recipientEmail;
                var gePrice = Number(metadataObj.gePrice);
                pli = basket.createGiftCertificateLineItem(gePrice, recipientEmail);
                pli.custom[globaleHelpers.customAttr.giftCertificateLineItem.geGiftCertificateID] = sku;
                pli.custom[globaleHelpers.customAttr.giftCertificateLineItem.geCartItemId] = p.CartItemId;
                pli.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice] = gePrice;

                if (metadataObj.message) {
                    pli.setMessage(metadataObj.message);
                }
                if (metadataObj.recipientName) {
                    pli.setRecipientName(metadataObj.recipientName);
                }
                if (metadataObj.senderName) {
                    pli.setSenderName(metadataObj.senderName);
                }
            } else if (p.ParentCartItemId == null) { // only regular product
                // check 'hasProductOptions' key in payload
                var hasPliProductOptions = [].concat(p.Attributes).some(function (attr) {
                    return attr && attr.AttributeKey === 'hasProductOptions' && [true, 'true'].indexOf(attr.AttributeValue) !== -1;
                });

                product = ProductMgr.getProduct(sku);
                if (!product) {
                    throw Error('Product ' + sku + ' doesn\'t exist.');
                }

                pli = !hasPliProductOptions ? basket.createProductLineItem(product, null, shipment) : basket.createProductLineItem(sku, shipment);
                if (!pli.product) {
                    throw Error('Product ' + sku + ' doesn\'t exist in current site catalog.');
                }

                pli.setPriceValue(p.Price);
                pli.setQuantityValue(p.Quantity);
                pli.custom[globaleHelpers.customAttr.productLineItem.geCartItemId] = p.CartItemId;

                // update bundled products
                var bundledProductLineItems = pli.getBundledProductLineItems();
                if (!bundledProductLineItems.isEmpty()) {
                    collections.forEach(bundledProductLineItems, function (bpli) {
                        var payloadProduct = arrayUtils.find(products, function (payloadProductItem) {
                            return payloadProductItem.ParentCartItemId === p.CartItemId &&
                                decodeURIComponent(payloadProductItem.Sku) === bpli.getProductID();
                        });
                        bpli.custom[globaleHelpers.customAttr.productLineItem.geCartItemId] = payloadProduct.CartItemId; // eslint-disable-line no-param-reassign
                    });
                }

                // update product options
                var optionProductLineItems = pli.getOptionProductLineItems();
                var productOptionModel = pli.getOptionModel();
                if (!optionProductLineItems.isEmpty()) {
                    collections.forEach(optionProductLineItems, function (opli) {
                        var payloadProduct = arrayUtils.find(products, function (payloadProductItem) {
                            return payloadProductItem.ParentCartItemId === p.CartItemId &&
                                decodeURIComponent(payloadProductItem.Sku) === opli.optionID;
                        });
                        var productOption = productOptionModel.getOption(opli.optionID);
                        var productOptionValue = productOptionModel.getOptionValue(productOption, decodeURIComponent(payloadProduct.CartItemOptionId));

                        opli.updateOptionValue(productOptionValue);
                        opli.custom[globaleHelpers.customAttr.productLineItem.geCartItemId] = payloadProduct.CartItemId; // eslint-disable-line no-param-reassign
                    });
                }
            }
        });

        // update positions
        var pliIter = basket.allProductLineItems.iterator();
        while (pliIter.hasNext()) {
            var currentPli = pliIter.next();
            currentPli.setPosition(Number(currentPli.custom[globaleHelpers.customAttr.productLineItem.geCartItemId]));
        }

        // apply coupons
        var discounts = objectUtils.getValueByPath(payload, 'Discounts', []);
        try {
            discounts.forEach(function (discount) {
                if (discount.CouponCode && !basket.getCouponLineItem(discount.CouponCode)) {
                    basket.createCouponLineItem(discount.CouponCode, true);
                }
            });
        } catch (e) {
            // no need to handle
        }

        // set merchant order ID if it's not equal to ORDER_CREATE_FORCE_NEW_NO
        if (merchantOrderId && String(merchantOrderId) !== globaleHelpers.consts.orderNo.ORDER_CREATE_FORCE_NEW_NO) {
            basket.custom[globaleHelpers.customAttr.basket.geMerchantOrderId] = merchantOrderId;
        }

        // set the flag which identifies that order is created from a new SFCC basket
        basket.custom[globaleHelpers.customAttr.basket.geIsOrderCreatedFallbackScenario] = true;

        // invoke basket calculate hook
        HookMgr.callHook('dw.order.calculate', 'calculate', basket);

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onGenerateBasketFromPayload, basket, payload);

        this.addNote('Basket has been generated from payload');
        this.basket = basket;
    } catch (e) {
        this.basket = null;
        return new Status(Status.ERROR, '110', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK, '0', 'generateBasketFromPayload:OK');
}

module.exports = function (object) {
    Object.defineProperty(object, 'generateBasketFromPayload', {
        value: generateBasketFromPayload
    });
};
