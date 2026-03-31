'use strict';

/**
 * Creates order from customer basket
 * @param {string} currencyCode - currency code
 * @param {boolean} validateBasketHash - validate basket hash
 * @returns {dw.system.Status} - operation status
 */
function createOrder(currencyCode, validateBasketHash) {
    var Status = require('dw/system/Status');
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');
    var geBasketMgr = require('*/cartridge/scripts/factories/globale/dw/basket');

    var basket = this.basket;
    try {
        // get basket
        if (!basket) {
            return new Status(Status.ERROR, '108', 'Basket has been already expired');
        }

        var geBasket = geBasketMgr.get(basket);

        // validate basket hash
        if (validateBasketHash) {
            var basketSnapShot = globaleBasketHelpers.getStorefrontBasketSnapshot(basket);
            var payloadHash = this.request.payload.h;
            if (payloadHash !== basketSnapShot.getHash()) {
                return new Status(Status.ERROR, '109', 'Basket hash does not match. Basket hash: ' + basketSnapShot.getHash() + '; SnapShot: ' + basketSnapShot.getData() + '.');
            }
        }

        // update basket
        geBasket.geUpdateCurrency(currencyCode);
        geBasket.geUpdateShipments();
        geBasket.geSetDefaultShippingMethod();
        geBasket.geSetDefaultPaymentInstrument();
        geBasket.geSetDefaultBillingAddress();
        geBasket.geSetDefaultShippingAddress();

        // create order
        var order = null;
        var merchantOrderId = basket.custom[globaleHelpers.customAttr.basket.geMerchantOrderId];

        try {
            order = merchantOrderId ? OrderMgr.createOrder(basket, merchantOrderId) : OrderMgr.createOrder(basket);
        } catch (e) {
            var geBasketValidation = geBasket.geValidateBasket();
            var geBasketValidationMsg = geBasketValidation.error ? geBasketValidation.message + '; ' : '';
            return new Status(Status.ERROR, '110', (geBasketValidationMsg + 'CREATE ORDER EXCEPTION: ' + e.message + '; ' + e.stack));
        }

        this.addNote('New Order ' + order.orderNo + ' has been successfully created, Basket has been removed from Session');

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterCreateOrder, order, this.request.payload);

        this.order = order;
    } catch (e) {
        return new Status(Status.ERROR, '110', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'createOrder', {
        value: createOrder
    });
};
