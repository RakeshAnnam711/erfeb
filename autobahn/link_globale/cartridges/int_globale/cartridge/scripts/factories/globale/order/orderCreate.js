'use strict';

/**
 * Returns Order Create Action
 * @param {Object} payload - Request payload
 * @returns {Object} - Order Create Action
 */
function getOrderCreateAction(payload) {
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var orderCreateActions = {
        ocapi: require('*/cartridge/models/globale/order/actions/OrderCreateAction'), // default
        ocapiMixedOrders: require('*/cartridge/models/globale/order/actions/OrderCreateMixedOrdersAction'),
        scapi: require('*/cartridge/models/globale/order/actions/OrderCreateActionSCAPI'),
        scapiMixedOrders: require('*/cartridge/models/globale/order/actions/OrderCreateMixedOrdersActionSCAPI')
    };
    var scapiEnabled = globaleCAPIHelpers.isSCAPIEnabled();
    var isMixedOrder = objectUtils.getValueByPath(payload, 'isMixedOrder', null) === true;
    var action = null;

    // get Order Create Action
    if (scapiEnabled && isMixedOrder) {
        action = orderCreateActions.scapiMixedOrders; // SCAPI Mixed Orders Flow
    } else if (scapiEnabled) {
        action = orderCreateActions.scapi; // SCAPI Flow
    } else if (isMixedOrder) {
        action = orderCreateActions.ocapiMixedOrders; // OCAPI Mixed Orders Flow
    } else {
        action = orderCreateActions.ocapi; // OCAPI Flow
    }

    return action;
}

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var OrderCreateRequest = require('*/cartridge/models/globale/order/requests/OrderCreateRequest');
    var OrderCreateResponse = require('*/cartridge/models/globale/order/responses/OrderCreateResponse');
    var OrderCreateAction = null;

    // init response
    var responseObj = new OrderCreateResponse();

    try {
        // init request
        var requestObj = new OrderCreateRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // validate payload
        requestObj.validate({
            h: { required: true },
            currency: { required: true },
            MerchantCartToken: { required: true },
            MerchantOrderId: { required: true },
            SessionId: { required: true },
            AuthToken: { required: true }
        });
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // get the order create action handler
        OrderCreateAction = getOrderCreateAction(requestObj.payload);

        // create action handler
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderCreateAction(requestObj, responseObj);
        actionHandlerDecorators.orderNotes(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_CREATE: {0}', logger.message(e));
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
