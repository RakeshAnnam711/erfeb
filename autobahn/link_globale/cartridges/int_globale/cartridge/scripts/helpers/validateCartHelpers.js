/* eslint-disable no-param-reassign */

'use strict';

/**
 * Returns OCAPI basket
 * @param {Object} validateCartPayload - validate cart payload
 * @param {dw/svc/Service} service - OCAPI service
 * @param {string} basketId - basket ID
 * @returns {Object} - OCAPI basket
 */
function getOcapiBasket(validateCartPayload, service, basketId) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');

    var geIsEndCustomerPrimary = objectUtils.getValueByPath(validateCartPayload, 'Customer.IsEndCustomerPrimary', null);
    var countryCode = geIsEndCustomerPrimary ?
        objectUtils.getValueByPath(validateCartPayload, 'PrimaryShipping.CountryCode', null) :
        objectUtils.getValueByPath(validateCartPayload, 'SecondaryShipping.CountryCode', null);
    var currencyCode = objectUtils.getValueByPath(validateCartPayload, 'CurrencyCode', null);

    // get basket
    var getBasketUrl = globaleCAPIHelpers.getOCAPIShopUrl('/baskets/' + basketId);
    var getBasketQueryParams = {};
    getBasketQueryParams[globaleHelpers.consts.capi.LOCALE_PARAM] = globaleCAPIHelpers.getCAPIRequestLocaleId();
    getBasketQueryParams[globaleHelpers.consts.capi.COUNTRY_CODE_PARAM] = countryCode;
    getBasketQueryParams[globaleHelpers.consts.capi.CURRENCY_CODE_PARAM] = currencyCode;
    getBasketUrl = urlUtils.appendParametersToURL(getBasketUrl, getBasketQueryParams);

    service.setRequestMethod('GET');
    service.setURL(getBasketUrl);

    var getBasketResponse = service.call();
    if (!getBasketResponse.isOk()) {
        throw new Error('Impossible to get the basket: ' + basketId);
    }

    return JSON.parse(getBasketResponse.object.text);
}

/**
 * Returns OCAPI basket
 * @param {Object} validateCartPayload - validate cart payload
 * @param {Object} validateCartResult - validate cart result
 * @returns {void}
 */
function validateOCAPIBasket(validateCartPayload, validateCartResult) {
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleCrypto = require('*/cartridge/scripts/factories/globale/crypto');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');

    var geCrypto = globaleCrypto.getAESCrypto();

    var basketId = objectUtils.getValueByPath(validateCartPayload, 'CartId', null);
    var sessionId = geCrypto.decrypt(objectUtils.getValueByPath(validateCartPayload, 'SessionId', null));
    var authToken = geCrypto.decrypt(objectUtils.getValueByPath(validateCartPayload, 'AuthToken', null));

    // get OCAPI basket
    var ocapiBasket = null;
    try {
        var ocapiService = sessionId ? geServiceMgr.getOcapiSessionBridgeService(sessionId) : geServiceMgr.getOcapiJwtService(authToken);
        ocapiBasket = getOcapiBasket(validateCartPayload, ocapiService, basketId);
    } catch (e) {
        validateCartResult.errorMessage = (e.message + '; ' + e.stack);
        throw Error(validateCartResult.errorMessage);
    }

    // check cart hash
    var payloadCartHash = objectUtils.getValueByPath(validateCartPayload, 'CartHash', null);
    var basketSnapShot = globaleBasketHelpers.getOcapiBasketSnapshot(ocapiBasket);

    if (payloadCartHash !== basketSnapShot.getHash()) {
        validateCartResult.errorCode = '1'; // invalid cart content error
        validateCartResult.errorMessage = 'Basket hash does not match. Basket hash: ' + basketSnapShot.getHash() + '; SnapShot: ' + basketSnapShot.getData() + '.';
        throw Error(validateCartResult.errorMessage);
    }

    // check products availability using the customer basket
    var plis = ('product_items' in ocapiBasket) ? ocapiBasket.product_items : [];
    plis.forEach(function (pli) { // all option and bundled products are skipped
        var productAvailability = geProductMgr.geGetProductAvailability(pli.product_id, pli.quantity);
        if (productAvailability.hasInventory === false) {
            validateCartResult.amendedProducts.push({ CartItemID: pli.c_geCartItemId, QuantityInStock: productAvailability.inStock });
        }
    });
}

/**
 * Returns SCAPI basket
 * @param {Object} validateCartPayload - validate cart payload
 * @param {dw/svc/Service} service - SCAPI service
 * @param {string} basketId - basket ID
 * @returns {Object} - OCAPI basket
 */
function getScapiBasket(validateCartPayload, service, basketId) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');

    var geIsEndCustomerPrimary = objectUtils.getValueByPath(validateCartPayload, 'Customer.IsEndCustomerPrimary', null);
    var countryCode = geIsEndCustomerPrimary ?
        objectUtils.getValueByPath(validateCartPayload, 'PrimaryShipping.CountryCode', null) :
        objectUtils.getValueByPath(validateCartPayload, 'SecondaryShipping.CountryCode', null);
    var currencyCode = objectUtils.getValueByPath(validateCartPayload, 'CurrencyCode', null);

    // get basket
    var getBasketUrl = globaleCAPIHelpers.getSCAPIShopUrl({
        family: 'checkout/',
        name: 'shopper-baskets/',
        resource: '/baskets/' + basketId
    });
    var getBasketQueryParams = {};
    getBasketQueryParams[globaleHelpers.consts.capi.SITE_ID_PARAM] = globaleCAPIHelpers.getCAPIRequestSiteId();
    getBasketQueryParams[globaleHelpers.consts.capi.LOCALE_PARAM] = globaleCAPIHelpers.getCAPIRequestLocaleId();
    getBasketQueryParams[globaleHelpers.consts.capi.COUNTRY_CODE_PARAM] = countryCode;
    getBasketQueryParams[globaleHelpers.consts.capi.CURRENCY_CODE_PARAM] = currencyCode;
    getBasketUrl = urlUtils.appendParametersToURL(getBasketUrl, getBasketQueryParams);

    service.setRequestMethod('GET');
    service.setURL(getBasketUrl);

    var getBasketResponse = service.call();
    if (!getBasketResponse.isOk()) {
        throw new Error('Impossible to get the basket: ' + basketId);
    }

    return JSON.parse(getBasketResponse.object.text);
}

/**
 * Returns SCAPI basket
 * @param {Object} validateCartPayload - validate cart payload
 * @param {Object} validateCartResult - validate cart result
 * @returns {void}
 */
function validateSCAPIBasket(validateCartPayload, validateCartResult) {
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleCrypto = require('*/cartridge/scripts/factories/globale/crypto');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');

    var geCrypto = globaleCrypto.getAESCrypto();

    var basketId = objectUtils.getValueByPath(validateCartPayload, 'CartId', null);
    var sessionId = geCrypto.decrypt(objectUtils.getValueByPath(validateCartPayload, 'SessionId', null));
    var authToken = geCrypto.decrypt(objectUtils.getValueByPath(validateCartPayload, 'AuthToken', null));

    // get OCAPI basket
    var scapiBasket = null;
    try {
        var scapiService = sessionId ? geServiceMgr.getScapiSessionBridgeService(sessionId) : geServiceMgr.getScapiJwtService(authToken);
        scapiBasket = getScapiBasket(validateCartPayload, scapiService, basketId);
    } catch (e) {
        validateCartResult.errorMessage = (e.message + '; ' + e.stack);
        throw Error(validateCartResult.errorMessage);
    }

    // check cart hash
    var payloadCartHash = objectUtils.getValueByPath(validateCartPayload, 'CartHash', null);
    var basketSnapShot = globaleBasketHelpers.getScapiBasketSnapshot(scapiBasket);

    if (payloadCartHash !== basketSnapShot.getHash()) {
        validateCartResult.errorCode = '1'; // invalid cart content error
        validateCartResult.errorMessage = 'Basket hash does not match. Basket hash: ' + basketSnapShot.getHash() + '; SnapShot: ' + basketSnapShot.getData() + '.';
        throw Error(validateCartResult.errorMessage);
    }

    // check products availability using the customer basket
    var plis = ('productItems' in scapiBasket) ? scapiBasket.productItems : [];
    plis.forEach(function (pli) { // all option and bundled products are skipped
        var productAvailability = geProductMgr.geGetProductAvailability(pli.productId, pli.quantity);
        if (productAvailability.hasInventory === false) {
            validateCartResult.amendedProducts.push({ CartItemID: pli.c_geCartItemId, QuantityInStock: productAvailability.inStock });
        }
    });
}

/**
 * Validates cart
 * @param {Object} validateCartPayload - validate cart payload
 * @returns {Object} - validate cart result
 */
function validateCart(validateCartPayload) {
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var requestHelpers = require('*/cartridge/scripts/helpers/requestHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');

    var capiBasketCheck = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geEnableCartValidationCAPIBasket);
    var validateCartResult = {
        errorCode: null,
        errorMessage: null,
        amendedProducts: [],
        reservationRequestId: null,
        titleTextResourceId: null,
        bodyTextResourceId: null,
        buttonTextResourceId: null,
        redirectUrl: null,
        textResourcesPlaceholders: {}
    };

    if (capiBasketCheck && globaleCAPIHelpers.isSCAPIEnabled()) { // validate SCAPI basket
        validateSCAPIBasket(validateCartPayload, validateCartResult);
    } else if (capiBasketCheck) { // validate OCAPI basket
        validateOCAPIBasket(validateCartPayload, validateCartResult);
    } else {
        // check products availability using the request payload
        var products = objectUtils.getValueByPath(validateCartPayload, 'Products', []);

        // check sub orders
        if (requestHelpers.isSubOrdersInPayload(validateCartPayload)) {
            validateCartPayload.Subs.forEach(function (subOrderPayload) {
                var subOrderProducts = objectUtils.getValueByPath(subOrderPayload, 'Products', []);
                products = products.concat(subOrderProducts);
            });
        }

        products.forEach(function (payloadProduct) {
            var qty = Number(objectUtils.getValueByPath(payloadProduct, 'Quantity', 0));
            var sku = decodeURIComponent(objectUtils.getValueByPath(payloadProduct, 'Sku', null));
            var parentCartItemId = objectUtils.getValueByPath(payloadProduct, 'ParentCartItemId', null);
            var cartItemOptionId = objectUtils.getValueByPath(payloadProduct, 'CartItemOptionId', null);

            if (!parentCartItemId && !cartItemOptionId && sku.indexOf('GC') === -1) { // all option and bundled products are skipped
                var productAvailability = geProductMgr.geGetProductAvailability(sku, qty);
                if (productAvailability.hasInventory === false) {
                    validateCartResult.amendedProducts.push({
                        CartItemID: objectUtils.getValueByPath(payloadProduct, 'CartItemId', null),
                        QuantityInStock: productAvailability.inStock
                    });
                }
            }
        });
    }

    return validateCartResult;
}

/**
 * Validates order for Pay By Link Scenario
 * @param {Object} validateCartPayload - validate cart payload
 * @returns {Object} - validate cart result
 */
function validateCartPayByLink(validateCartPayload) {
    var URLUtils = require('dw/web/URLUtils');
    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var payByLinkConfig = geConfigurationMgr.getPayByLinkConfig();
    var orderId = globaleHelpers.getUrlParametersValue(validateCartPayload.UrlParameters, globaleHelpers.customAttr.basket.geMerchantOrderId);
    var payByLinkResources = payByLinkConfig.getResources();

    var validateCartResult = {
        errorCode: null,
        errorMessage: null,
        amendedProducts: [],
        reservationRequestId: null,
        titleTextResourceId: null,
        bodyTextResourceId: null,
        buttonTextResourceId: null,
        redirectUrl: null,
        textResourcesPlaceholders: {}
    };

    var order = orderId ? OrderMgr.getOrder(orderId) : null;

    // invoke custom hook
    globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.payByLink.onBeforeOrderValidate, validateCartPayload, order, validateCartResult);

    if (order.status.value === Order.ORDER_STATUS_FAILED || order.status.value === Order.ORDER_STATUS_CANCELLED) {
        validateCartResult.errorMessage = 'The link is expired. Order status: ' + order.status.displayValue;
        validateCartResult.errorCode = '1';
        validateCartResult.buttonTextResourceId = payByLinkResources.buttonTextResourceId;
        validateCartResult.titleTextResourceId = payByLinkResources.titleTextResourceId;
        validateCartResult.bodyTextResourceId = payByLinkResources.bodyTextResourceId;
        validateCartResult.redirectUrl = URLUtils.http('Home-Show').toString();
    }

    // invoke custom hook
    globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.payByLink.onAfterOrderValidate, validateCartPayload, order, validateCartResult);

    return validateCartResult;
}

module.exports = {
    validateCart: validateCart,
    validateCartPayByLink: validateCartPayByLink
};
