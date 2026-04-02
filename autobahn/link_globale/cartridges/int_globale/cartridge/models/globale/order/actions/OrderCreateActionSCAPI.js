/* eslint-disable no-underscore-dangle */

'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderCreateActionSCAPI
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderCreateActionSCAPI(requestObj, responseObj) {
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleCrypto = require('*/cartridge/scripts/factories/globale/crypto');

    AbstractAction.call(this, requestObj, responseObj);

    var geCrypto = globaleCrypto.getAESCrypto();
    var sessionId = geCrypto.decrypt(objectUtils.getValueByPath(this.request.payload, 'SessionId', null));
    var authToken = geCrypto.decrypt(objectUtils.getValueByPath(this.request.payload, 'AuthToken', null));

    this.service = sessionId ? geServiceMgr.getScapiSessionBridgeService(sessionId) : geServiceMgr.getScapiJwtService(authToken);
}

/* Inherits AbstractAction */
OrderCreateActionSCAPI.prototype = Object.create(AbstractAction.prototype);

/**
 * Creates order from customer basket
 * @throws {Error}
 */
OrderCreateActionSCAPI.prototype.run = function () {
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
        var placeOrderUrl = globaleCAPIHelpers.getSCAPIShopUrl({
            family: 'checkout/',
            name: 'shopper-orders/',
            resource: '/orders'
        });
        var placeOrderQueryParams = {};
        placeOrderQueryParams[globaleHelpers.consts.capi.SITE_ID_PARAM] = globaleCAPIHelpers.getCAPIRequestSiteId();
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
            orderNo: { required: true },
            orderToken: { required: true }
        };
        var poValidationResult = validator.validate(placeOrderResponsePayload, poJsonSchema);
        if (!poValidationResult.valid) {
            throw new Error('Invalid order create OCAPI response: ' + JSON.stringify(poValidationResult));
        }
        this.orderNotes.push('New Order ' + placeOrderResponsePayload.orderNo + ' has been successfully created, Basket has been removed from Session');

        // invoke custom hook
        var order = OrderMgr.getOrder(placeOrderResponsePayload.orderNo);
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterCreateOrder, order, this.request.payload);

        // write notes
        this.writeNotes(order, 'GLOBALE_ORDER_CREATE');

        this.response.sfccOrderNumber = placeOrderResponsePayload.orderNo;
        this.response.sfccOrderToken = placeOrderResponsePayload.orderToken;
    } catch (e) {
        // remove basket
        var deleteBasketUrl = globaleCAPIHelpers.getSCAPIShopUrl({
            family: 'checkout/',
            name: 'shopper-baskets/',
            resource: '/baskets/' + this.request.payload.MerchantCartToken
        });
        var deleteBasketQueryParams = {};
        deleteBasketQueryParams[globaleHelpers.consts.capi.SITE_ID_PARAM] = globaleCAPIHelpers.getCAPIRequestSiteId();
        deleteBasketQueryParams[globaleHelpers.consts.capi.ORDER_CREATE_REQUEST_PARAM] = true;
        deleteBasketUrl = urlUtils.appendParametersToURL(deleteBasketUrl, deleteBasketQueryParams);

        this.service.setRequestMethod('DELETE');
        this.service.setURL(deleteBasketUrl);
        this.service.call();

        throw e;
    }
};

module.exports = OrderCreateActionSCAPI;
