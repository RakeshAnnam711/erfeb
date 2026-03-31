'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents SendCartOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function SendCartOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
SendCartOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorCode - operation data
 * @param {string} errorMessage - result object
 * @throws {Error}
 */
SendCartOperation.prototype.triggerError = function (errorCode, errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorCode = errorCode;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Sends SendCart
 * @throws {Error}
 */
SendCartOperation.prototype.run = function () {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var HookMgr = require('dw/system/HookMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');

    var basket = BasketMgr.getCurrentBasket();

    // check if basket exists
    if (!basket) {
        this.triggerError(101, 'Basket doesn\'t exist');
    }
    this.operationResult.basket = basket;

    // calculate basket before generating SendCart data
    Transaction.wrap(function () {
        HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    });

    // reserve inventory if enabled
    var enableStockReservation = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geEnableStockReservation);
    var stockReservationTime = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geStockReservationTime);
    if (enableStockReservation && basket.reserveInventory(stockReservationTime).isError()) {
        this.triggerError(102, 'Inventory reservation is failed');
    }

    Transaction.wrap(function () {
        basket.custom[globaleHelpers.customAttr.basket.geCartId] = basket.UUID;
        basket.custom[globaleHelpers.customAttr.basket.geMerchantOrderId] = OrderMgr.createOrderNo();
    });

    // get SendCart data
    try {
        var sendCartData = this.getSendCartData(basket);
        this.operationResult.sendCartData = sendCartData;
        this.operationResult.cartHash = sendCartData.MerchantCartHash;
        this.operationResult.sessionId = globaleSession.getID();
    } catch (e) {
        this.triggerError(103, 'Impossible to get SendCart data: ' + e.message + '; ' + e.stack);
    }

    // call event hook
    try {
        globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.sendCart.beforeSendCartRequest, basket, this.operationResult.sendCartData);
    } catch (e) {
        this.triggerError(104, 'beforeSendCartRequest hook error: ' + e.message + '; ' + e.stack);
    }

    // get cart token
    try {
        var basketSnapShot = globaleBasketHelpers.getStorefrontBasketSnapshot(basket);
        if (
            this.operationData.enableCartTokenCache === true &&
            basket.custom[globaleHelpers.customAttr.basket.geCartToken] &&
            globaleSession.getPrivacy('geCheckoutCartToken') === basketSnapShot.getHash()
        ) {
            this.operationResult.cartToken = basket.custom[globaleHelpers.customAttr.basket.geCartToken];
        } else {
            var cartToken = this.getCartToken(this.operationResult.sendCartData);
            Transaction.wrap(function () {
                basket.custom[globaleHelpers.customAttr.basket.geCartToken] = cartToken;
            });
            globaleSession.setPrivacy('geCheckoutCartToken', this.operationResult.sendCartData.MerchantCartHash);
            this.operationResult.cartToken = cartToken;
        }
    } catch (e) {
        this.triggerError(105, 'Impossible to get Cart Token: ' + e.message + '; ' + e.stack);
    }

    this.operationResult.success = true;
};

module.exports = SendCartOperation;
