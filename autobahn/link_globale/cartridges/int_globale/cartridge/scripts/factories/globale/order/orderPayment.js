'use strict';

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var requestHelpers = require('*/cartridge/scripts/helpers/requestHelpers');
    var logger = globaleHelpers.getLogger();
    var OrderPaymentRequest = require('*/cartridge/models/globale/order/requests/OrderPaymentRequest');
    var OrderPaymentResponse = require('*/cartridge/models/globale/order/responses/OrderPaymentResponse');
    var OrderPaymentAction = require('*/cartridge/models/globale/order/actions/OrderPaymentAction');

    // init default response
    var responseObj = new OrderPaymentResponse();

    try {
        // get payload
        var jsonPayload = requestHelpers.getPayloadData();

        // redefine request/response/action depending on flow (mixed|single)
        if (requestHelpers.isSubOrdersInPayload(jsonPayload)) { // mixed orders
            OrderPaymentRequest = require('*/cartridge/models/globale/order/requests/OrderPaymentMixedOrdersRequest');
            OrderPaymentResponse = require('*/cartridge/models/globale/order/responses/OrderPaymentMixedOrdersResponse');
            OrderPaymentAction = require('*/cartridge/models/globale/order/actions/OrderPaymentMixedOrdersAction');
        }

        // init response
        responseObj = new OrderPaymentResponse();

        // init request
        var requestObj = new OrderPaymentRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // validate payload
        requestObj.validate({
            MerchantOrderId: { required: true },
            OrderId: { required: true },
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            PaymentDetails: { required: true },
            InternationalDetails: { required: true },
            PrimaryBilling: { required: true }
        }, requestObj.payload);
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // create action handler
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderPaymentAction(requestObj, responseObj);
        actionHandlerDecorators.orderNotes(actionHandler);
        actionHandlerDecorators.findOrder(actionHandler);
        actionHandlerDecorators.placeOrder(actionHandler);
        actionHandlerDecorators.confirmOrder(actionHandler);
        actionHandlerDecorators.addressAttributes(actionHandler);
        actionHandlerDecorators.orderAddresses(actionHandler);
        actionHandlerDecorators.setPaymentAttributes(actionHandler);
        actionHandlerDecorators.setPaymentInstruments(actionHandler);
        actionHandlerDecorators.setPaymentStatus(actionHandler);
        actionHandlerDecorators.setExportStatus(actionHandler);
        actionHandlerDecorators.processDecoratorStatus(actionHandler);
        actionHandlerDecorators.createGiftCertificate(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_PAYMENT_UPDATE: {0}', logger.message(e));
        responseObj.success = false;
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
