/* eslint-disable no-underscore-dangle */

'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderCreateMixedOrdersActionSCAPI
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderCreateMixedOrdersActionSCAPI(requestObj, responseObj) {
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
OrderCreateMixedOrdersActionSCAPI.prototype = Object.create(AbstractAction.prototype);

/**
 * Creates order from customer basket
 * @throws {Error}
 */
OrderCreateMixedOrdersActionSCAPI.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');

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

    var removeBasketResponse = this.service.call();
    var isBasketExist = !removeBasketResponse.isOk();

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterCreateMixedOrder, isBasketExist, this.request.payload);

    // set response
    this.response.errorMessage = 'Skipped Order Create. Used Mixed Orders Flow';
};

module.exports = OrderCreateMixedOrdersActionSCAPI;
