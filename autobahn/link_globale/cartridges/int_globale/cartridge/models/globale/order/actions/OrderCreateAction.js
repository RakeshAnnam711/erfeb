/* eslint-disable no-underscore-dangle */

'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderCreateAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderCreateAction(requestObj, responseObj) {
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleCrypto = require('*/cartridge/scripts/factories/globale/crypto');

    AbstractAction.call(this, requestObj, responseObj);

    var geCrypto = globaleCrypto.getAESCrypto();
    var sessionId = geCrypto.decrypt(objectUtils.getValueByPath(this.request.payload, 'SessionId', null));
    var authToken = geCrypto.decrypt(objectUtils.getValueByPath(this.request.payload, 'AuthToken', null));

    this.service = sessionId ? geServiceMgr.getOcapiSessionBridgeService(sessionId) : geServiceMgr.getOcapiJwtService(authToken);
}

/* Inherits AbstractAction */
OrderCreateAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Creates order from customer basket
 * @throws {Error}
 */
OrderCreateAction.prototype.run = function () {
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var validator = require('*/cartridge/scripts/util/globale/validator');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');

    // check if order already exists
    var existingOrder = OrderMgr.getOrder(this.request.payload.MerchantOrderId);

    if (existingOrder && existingOrder.custom[globaleHelpers.customAttr.order.geIsOrderCreatedPayByLinkScenario]) {
        this.response.sfccOrderNumber = existingOrder.orderNo;
        this.response.sfccOrderToken = existingOrder.orderToken;
        return;
    }

    if (existingOrder !== null) {
        throw new Error('Order ' + this.request.payload.MerchantOrderId + ' already exists!');
    }

    try {
        // place order
        var placeOrderUrl = globaleCAPIHelpers.getOCAPIShopUrl('/orders');
        var placeOrderQueryParams = {};
        placeOrderQueryParams[globaleHelpers.consts.capi.LOCALE_PARAM] = globaleCAPIHelpers.getCAPIRequestLocaleId();
        placeOrderQueryParams[globaleHelpers.consts.capi.ORDER_CREATE_REQUEST_PARAM] = true;
        placeOrderQueryParams[globaleHelpers.consts.capi.RESERVED_ORDER_NO_PARAM] = this.request.payload.MerchantOrderId;
        placeOrderQueryParams[globaleHelpers.consts.capi.BASKET_CURRENCY_CODE_PARAM] = this.request.payload.currency;
        placeOrderQueryParams[globaleHelpers.consts.capi.BASKET_HASH_PARAM] = this.request.payload.h;
        placeOrderUrl = urlUtils.appendParametersToURL(placeOrderUrl, placeOrderQueryParams);

        this.service.setRequestMethod('POST');
        this.service.addHeader('Content-Type', 'application/json');
        this.service.setURL(placeOrderUrl);

        var placeOrderResponse = this.service.call(JSON.stringify({ basket_id: this.request.payload.MerchantCartToken }));
        if (!placeOrderResponse.isOk()) {
            throw new Error(placeOrderResponse.errorMessage);
        }

        // validate create order response
        var placeOrderResponsePayload = JSON.parse(placeOrderResponse.object.text);
        var poJsonSchema = {
            order_no: { required: true },
            order_token: { required: true }
        };
        var poValidationResult = validator.validate(placeOrderResponsePayload, poJsonSchema);
        if (!poValidationResult.valid) {
            throw new Error('Invalid order create OCAPI response: ' + JSON.stringify(poValidationResult));
        }
        this.orderNotes.push('New Order ' + placeOrderResponsePayload.order_no + ' has been successfully created, Basket has been removed from Session');

        // invoke custom hook
        var order = OrderMgr.getOrder(placeOrderResponsePayload.order_no);
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterCreateOrder, order, this.request.payload);

        // write notes
        this.writeNotes(order, 'GLOBALE_ORDER_CREATE');

        this.response.sfccOrderNumber = placeOrderResponsePayload.order_no;
        this.response.sfccOrderToken = placeOrderResponsePayload.order_token;
    } catch (e) {
        // remove basket
        var deleteBasketUrl = globaleCAPIHelpers.getOCAPIShopUrl('/baskets/' + this.request.payload.MerchantCartToken);
        var deleteBasketQueryParams = {};
        deleteBasketQueryParams[globaleHelpers.consts.capi.ORDER_CREATE_REQUEST_PARAM] = true;
        deleteBasketUrl = urlUtils.appendParametersToURL(deleteBasketUrl, deleteBasketQueryParams);

        this.service.setRequestMethod('DELETE');
        this.service.setURL(deleteBasketUrl);
        this.service.call();

        throw e;
    }
};

module.exports = OrderCreateAction;
