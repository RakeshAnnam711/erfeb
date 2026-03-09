/* eslint-disable no-undef */

'use strict';

/**
 * Calculates and returns Global-e SendCart.UrlParameters API
 * @param {dw.order.Basket} basket - SFCC basket
 * @returns {string} - Global-e SendCart.UrlParameters API
 */
function getUrlParameters(basket) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var customAttributeHelpers = require('*/cartridge/scripts/helpers/customAttributeHelpers');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');

    var urlParameters = [{ Key: 'locale', Value: globaleRequest.get('locale') }];
    var cookieParameter = { Key: 'ClientCookie', Value: '' };
    var httpCookies = globaleRequest.get('httpCookies');
    var allowedCookiesNames = [globaleHelpers.consts.geCookieName];
    var httpCookie;
    var customUrlParams;
    for (var i = 0; i < httpCookies.cookieCount; i++) {
        httpCookie = httpCookies[i];
        // skip not allowed cookies
        if (allowedCookiesNames.indexOf(httpCookie.name) === -1) {
            continue; // eslint-disable-line no-continue
        }
        cookieParameter.Value += (httpCookie.name + '=');
        cookieParameter.Value += (httpCookie.value + '; ');
    }
    urlParameters.push(cookieParameter);

    if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccCartHashValidation, false, 'boolean')) {
        let basketSnapShot = globaleBasketHelpers.getStorefrontBasketSnapshot(basket, { products: ['pid', 'qty'] });
        urlParameters.push({ Key: globaleHelpers.consts.urlParameters.sfccCartHash, Value: basketSnapShot.getHash() });
    }

    // push SFCC custom attributes data
    urlParameters.push({ Key: globaleHelpers.consts.urlParameters.customAttributesData, Value: JSON.stringify(customAttributeHelpers.getCustomAttributesData(basket)) });

    // push discounts taxation mode
    urlParameters.push({ Key: globaleHelpers.consts.urlParameters.isTaxationBasedOnAdjustedPrice, Value: (this.isTaxationBasedOnAdjustedPrice || false) });

    // add SFCC site identification
    if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccDoWebStoreValidation, true, 'boolean')) {
        urlParameters.push({ Key: globaleHelpers.preferenceKeys.geWebStoreUUID, Value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geWebStoreUUID) });
    }

    urlParameters.push({ Key: globaleHelpers.customAttr.basket.geMerchantOrderId, Value: basket.custom[globaleHelpers.customAttr.basket.geMerchantOrderId] });

    // call event hook
    customUrlParams = globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getUrlParameters, this.basket);
    if (customUrlParams) {
        Object.keys(customUrlParams).forEach(function (paramName) {
            if (['locale', 'ClientCookie'].indexOf(paramName) === -1) {
                urlParameters.push({ Key: paramName, Value: customUrlParams[paramName] });
            }
        });
    }

    return JSON.stringify(urlParameters);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getUrlParameters', {
        value: getUrlParameters
    });
};
