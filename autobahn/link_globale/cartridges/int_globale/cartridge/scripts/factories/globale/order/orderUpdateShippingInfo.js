'use strict';

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var OrderUpdateShippingInfoRequest = require('*/cartridge/models/globale/order/requests/OrderUpdateShippingInfoRequest');
    var OrderUpdateShippingInfoResponse = require('*/cartridge/models/globale/order/responses/OrderUpdateShippingInfoResponse');

    // init response
    var responseObj = new OrderUpdateShippingInfoResponse();

    try {
        // init request
        var requestObj = new OrderUpdateShippingInfoRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // validate payload
        requestObj.validate({
            MerchantOrderId: { required: true },
            OrderId: { required: true },
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            'InternationalDetails.OrderTrackingNumber': { required: true },
            'InternationalDetails.OrderTrackingUrl': { required: true }
        });
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // create action handler
        var OrderUpdateShippingInfoAction = require('*/cartridge/models/globale/order/actions/OrderUpdateShippingInfoAction');
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderUpdateShippingInfoAction(requestObj, responseObj);
        actionHandlerDecorators.orderNotes(actionHandler);
        actionHandlerDecorators.findOrder(actionHandler);
        actionHandlerDecorators.addressAttributes(actionHandler);
        actionHandlerDecorators.orderAddresses(actionHandler);
        actionHandlerDecorators.updateOrderShippingInfo(actionHandler);
        actionHandlerDecorators.processDecoratorStatus(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_SHIPPING_INFO_UPDATE: {0}', logger.message(e));
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
