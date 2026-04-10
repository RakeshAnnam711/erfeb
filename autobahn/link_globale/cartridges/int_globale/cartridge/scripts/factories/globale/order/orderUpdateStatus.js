'use strict';

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var requestHelpers = require('*/cartridge/scripts/helpers/requestHelpers');
    var logger = globaleHelpers.getLogger();
    var OrderUpdateStatusRequest = require('*/cartridge/models/globale/order/requests/OrderUpdateStatusRequest');
    var OrderUpdateStatusResponse = require('*/cartridge/models/globale/order/responses/OrderUpdateStatusResponse');
    var OrderUpdateStatusAction = require('*/cartridge/models/globale/order/actions/OrderUpdateStatusAction');

    // init default response
    var responseObj = new OrderUpdateStatusResponse();

    try {
        // get payload
        var jsonPayload = requestHelpers.getPayloadData();

        // redefine request/response/action depending on flow (mixed|single)
        if (requestHelpers.isSubOrdersInPayload(jsonPayload)) { // mixed orders
            OrderUpdateStatusRequest = require('*/cartridge/models/globale/order/requests/OrderUpdateStatusMixedOrdersRequest');
            OrderUpdateStatusResponse = require('*/cartridge/models/globale/order/responses/OrderUpdateStatusMixedOrdersResponse');
            OrderUpdateStatusAction = require('*/cartridge/models/globale/order/actions/OrderUpdateStatusMixedOrdersAction');
        }

        // init response
        responseObj = new OrderUpdateStatusResponse();

        // init request
        var requestObj = new OrderUpdateStatusRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // validate payload
        requestObj.validate({
            MerchantOrderId: { required: true },
            OrderId: { required: true },
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            StatusCode: { required: true }
        }, requestObj.payload);
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // create action handler
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderUpdateStatusAction(requestObj, responseObj);
        actionHandlerDecorators.orderNotes(actionHandler);
        actionHandlerDecorators.findOrder(actionHandler);
        actionHandlerDecorators.updateOrderStatus(actionHandler);
        actionHandlerDecorators.processDecoratorStatus(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_STATUS_UPDATE: {0}', logger.message(e));
        responseObj.success = false;
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
