/* eslint no-unused-vars: "off", no-useless-return: "off", consistent-return: "off" */

'use strict';

/**
 * dw.ocapi.shop.basket.beforePATCH hook for Global-e
 * @param {dw.order.Basket} basket - the basket to be updated
 * @param {dw.order.Basket} basketInput - the basket delta containing the desired changes
 */
exports.beforePATCH = function (basket, basketInput) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var geBasketMgr = require('*/cartridge/scripts/factories/globale/dw/basket');
    var geBasket = geBasketMgr.get(basket);

    // exit if Global-e integration is not enabled
    if (!globaleHelpers.isGlobaleEnabled()) {
        return;
    }

    // set request locale
    globaleCAPIHelpers.setCAPIRequestLocale();

    // initialize Global-e session
    globaleCAPIHelpers.initCAPIGlobaleSession();
};
