'use strict';

var AbstractStrategy = require('*/cartridge/models/globale/checkoutApplyCoupon/AbstractStrategy');

/**
 * Represents JWTStrategy
 * @constructor
 * @param {string} basketId - basket id
 * @param {string} token - token
 * @param {Object} jsonPayload - JSON Payload
 */
function JWTStrategy(basketId, token, jsonPayload) {
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');
    AbstractStrategy.call(this, basketId, token, jsonPayload);

    this.service = geServiceMgr.getOcapiJwtService(this.token);
}

/* Inherits AbstarctField */
JWTStrategy.prototype = Object.create(AbstractStrategy.prototype);

/**
 * Applies coupon code
 * @param {string} couponCode - coupon code
 * @throws {Error}
 */
JWTStrategy.prototype.apply = function (couponCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');

    // apply coupon code
    var applyCouponUrl = globaleCAPIHelpers.getOCAPIShopUrl('/baskets/' + this.basketId + '/coupons');
    var applyCouponQueryParams = {};
    applyCouponQueryParams[globaleHelpers.consts.capi.LOCALE_PARAM] = globaleCAPIHelpers.getCAPIRequestLocaleId();
    applyCouponQueryParams[globaleHelpers.consts.capi.COUNTRY_CODE_PARAM] = this.jsonPayload.CountryCode;
    applyCouponQueryParams[globaleHelpers.consts.capi.CURRENCY_CODE_PARAM] = this.jsonPayload.CurrencyCode;
    applyCouponUrl = urlUtils.appendParametersToURL(applyCouponUrl, applyCouponQueryParams);

    this.service.setRequestMethod('POST');
    this.service.addHeader('Content-Type', 'application/json');
    this.service.setURL(applyCouponUrl);

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.checkout.beforeApplyCouponCode, this.service, this.jsonPayload);

    var applyCouponResponse = this.service.call(JSON.stringify({ code: couponCode }));
    if (!applyCouponResponse.isOk()) {
        throw new Error('Impossible to apply coupon code.');
    }

    var applyCouponResponsePayload = JSON.parse(applyCouponResponse.object.text);
    var couponLineItem = arrayUtils.find(applyCouponResponsePayload.coupon_items, function (couponItem) {
        return couponItem.code.toLowerCase() === couponCode.toLowerCase();
    });
    if (couponLineItem === undefined || couponLineItem.status_code !== 'applied') {
        throw new Error('The coupon code was not applied to the basket.');
    }
};

/**
 * Remove coupon code
 * @param {string} couponCode - coupon code
 * @throws {Error}
 */
JWTStrategy.prototype.remove = function (couponCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');

    // get coupon line item id
    var getBasketUrl = globaleCAPIHelpers.getOCAPIShopUrl('/baskets/' + this.basketId);
    var getBasketQueryParams = {};
    getBasketQueryParams[globaleHelpers.consts.capi.LOCALE_PARAM] = globaleCAPIHelpers.getCAPIRequestLocaleId();
    getBasketQueryParams[globaleHelpers.consts.capi.COUNTRY_CODE_PARAM] = this.jsonPayload.CountryCode;
    getBasketQueryParams[globaleHelpers.consts.capi.CURRENCY_CODE_PARAM] = this.jsonPayload.CurrencyCode;
    getBasketUrl = urlUtils.appendParametersToURL(getBasketUrl, getBasketQueryParams);

    this.service.setRequestMethod('GET');
    this.service.setURL(getBasketUrl);

    var getBasketResponse = this.service.call();
    if (!getBasketResponse.isOk()) {
        throw new Error('Impossible to get the basket.');
    }

    var getBasketResponsePayload = JSON.parse(getBasketResponse.object.text);
    if (!('coupon_items' in getBasketResponsePayload)) {
        throw new Error('The coupon code was not applied to the basket.');
    }
    var couponLineItem = arrayUtils.find(getBasketResponsePayload.coupon_items, function (couponItem) {
        return couponItem.code === couponCode;
    });
    if (couponLineItem === undefined) {
        throw new Error('The coupon code was not applied to the basket.');
    }

    // remove coupon code
    var removeCouponUrl = globaleCAPIHelpers.getOCAPIShopUrl('/baskets/' + this.basketId + '/coupons/' + couponLineItem.coupon_item_id);
    var removeCouponQueryParams = {};
    removeCouponQueryParams[globaleHelpers.consts.capi.LOCALE_PARAM] = globaleCAPIHelpers.getCAPIRequestLocaleId();
    removeCouponQueryParams[globaleHelpers.consts.capi.COUNTRY_CODE_PARAM] = this.jsonPayload.CountryCode;
    removeCouponQueryParams[globaleHelpers.consts.capi.CURRENCY_CODE_PARAM] = this.jsonPayload.CurrencyCode;
    removeCouponUrl = urlUtils.appendParametersToURL(removeCouponUrl, removeCouponQueryParams);

    this.service.setRequestMethod('DELETE');
    this.service.setURL(removeCouponUrl);

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.checkout.beforeRemoveCouponCode, this.service, this.jsonPayload);

    var removeCouponResponse = this.service.call();
    if (!removeCouponResponse.isOk()) {
        throw new Error('Impossible to remove coupon code.');
    }
};

module.exports = JWTStrategy;
