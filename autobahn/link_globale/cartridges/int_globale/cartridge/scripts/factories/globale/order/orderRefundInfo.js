'use strict';

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var OrderRefundInfoRequest = require('*/cartridge/models/globale/order/requests/OrderRefundInfoRequest');
    var OrderRefundInfoResponse = require('*/cartridge/models/globale/order/responses/OrderRefundInfoResponse');

    // init response
    var responseObj = new OrderRefundInfoResponse();

    try {
        // init request
        var requestObj = new OrderRefundInfoRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // validate payload
        requestObj.validate({
            MerchantOrderId: { required: true },
            OrderId: { required: true },
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            RefundId: { required: true },
            TotalRefundAmount: { required: true },
            OriginalTotalRefundAmount: { required: true }
        });
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // create action handler
        var OrderRefundInfoAction = require('*/cartridge/models/globale/order/actions/OrderRefundInfoAction');
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderRefundInfoAction(requestObj, responseObj);
        actionHandlerDecorators.orderNotes(actionHandler);
        actionHandlerDecorators.findOrder(actionHandler);
        actionHandlerDecorators.updateOrderRefundInfo(actionHandler);
        actionHandlerDecorators.processDecoratorStatus(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_REFUND_INFO_UPDATE: {0}', logger.message(e));
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
