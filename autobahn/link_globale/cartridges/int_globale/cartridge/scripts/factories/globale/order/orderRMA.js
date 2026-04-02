'use strict';

/**
 * Order RMA Factory
 * @returns {Object} - Response
 */
module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var OrderRmaRequest = require('*/cartridge/models/globale/order/requests/OrderRmaRequest');
    var OrderRmaResponse = require('*/cartridge/models/globale/order/responses/OrderRmaResponse');
    var requestObj = null;
    var responseObj = null;

    // init response
    responseObj = new OrderRmaResponse();

    try {
        // init request
        requestObj = new OrderRmaRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // validate payload
        requestObj.validate({
            MerchantOrderId: { required: true },
            OrderId: { required: true },
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            RMANumber: { required: true },
            ReturnedProducts: { required: true }
        });
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload:' + JSON.stringify(requestObj.validation));
        }

        // create action handler
        var OrderRmaAction = require('*/cartridge/models/globale/order/actions/OrderRmaAction');
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderRmaAction(requestObj, responseObj);
        actionHandlerDecorators.orderNotes(actionHandler);
        actionHandlerDecorators.findOrder(actionHandler);
        actionHandlerDecorators.createRMA(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('ORDER_RMA_UPDATE: {0}', logger.message(e));
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
