/* eslint-disable no-param-reassign */

'use strict';

/**
 * Creates order from agent basket
 * @param {dw.order.Basket} basket - SFCC basket
 */
function createOrder(basket) {
    var HookMgr = require('dw/system/HookMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geBasketMgr = require('*/cartridge/scripts/factories/globale/dw/basket');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');

    try {
        var geBasket = geBasketMgr.get(basket);
        var orderCurrencyConfigs = geConfigurationMgr.getOrderCurrencyConfig();

        // get correct currency from config if reconciliation currency for a country is different from base merchant currency
        var basketCurrencyCode = orderCurrencyConfigs.getOrderCurrency() || basket.getCurrencyCode();

        // update basket
        geBasket.geUpdateCurrency(basketCurrencyCode);
        geBasket.geUpdateShipments();
        geBasket.geSetDefaultShippingMethod();
        geBasket.geSetDefaultPaymentInstrument();
        geBasket.geSetDefaultBillingAddress();
        geBasket.geSetDefaultShippingAddress();

        // invoke basket calculate hook
        HookMgr.callHook('dw.order.calculate', 'calculate', basket, null, true);

        var merchantOrderId = basket.custom[globaleHelpers.customAttr.basket.geMerchantOrderId];
        // create order
        var order = merchantOrderId ? OrderMgr.createOrder(basket, merchantOrderId) : OrderMgr.createOrder(this.basket);

        this.order = order;

        // invoke custom hook
        globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.payByLink.onAfterCreateOrder, this.order);
    } catch (e) {
        throw new Error(e.message + '; ' + e.stack);
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        createOrder: {
            value: createOrder
        }
    });
};
