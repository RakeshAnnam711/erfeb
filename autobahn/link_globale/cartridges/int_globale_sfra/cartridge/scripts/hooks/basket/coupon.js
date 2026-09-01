/* eslint no-unused-vars: "off", no-param-reassign: "off", no-useless-return: "off", consistent-return: "off" */

'use strict';

/**
 * dw.ocapi.shop.basket.coupon.beforePOST hook for Global-e
 * @param {dw.order.Basket} basket - the basket the coupon get added to
 * @param {Object} couponItem - the coupon information
 */
exports.beforePOST = function (basket, couponItem) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return;
    }

    // set request locale
    globaleCAPIHelpers.setCAPIRequestLocale();

    // initialize Global-e session
    globaleCAPIHelpers.initCAPIGlobaleSession();
};

/**
 * dw.ocapi.shop.basket.coupon.modifyPOSTResponse hook for Global-e
 * @param {dw.order.Basket} basket - the target basket
 * @param {Object} basketResponse - basket response object
 * @param {Object} couponRequest - coupon request object
 */
exports.modifyPOSTResponse = function (basket, basketResponse, couponRequest) {
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return;
    }

    // update basket response currency if there is Global-e operated country
    if (globaleSession.get('geOperatedCountry') && ('currency' in basketResponse)) {
        basketResponse.currency = globaleSession.get('geCurrency');
    }
};

/**
 * dw.ocapi.shop.basket.coupon.beforeDELETE hook for Global-e
 * @param {dw.order.Basket} basket - the basket the coupon get removed from
 * @param {string} couponItemID - the coupon information
 */
exports.beforeDELETE = function (basket, couponItemID) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return;
    }

    // set request locale
    globaleCAPIHelpers.setCAPIRequestLocale();

    // initialize Global-e session
    globaleCAPIHelpers.initCAPIGlobaleSession();
};

/**
 * dw.ocapi.shop.basket.coupon.modifyDELETEResponse hook for Global-e
 * @param {dw.order.Basket} basket - the target basket
 * @param {Object} basketResponse - basket response object
 * @param {string} couponItemID - the coupon information
 */
exports.modifyDELETEResponse = function (basket, basketResponse, couponItemID) {
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return;
    }

    // update basket response currency if there is Global-e operated country
    if (globaleSession.get('geOperatedCountry') && ('currency' in basketResponse)) {
        basketResponse.currency = globaleSession.get('geCurrency');
    }
};
