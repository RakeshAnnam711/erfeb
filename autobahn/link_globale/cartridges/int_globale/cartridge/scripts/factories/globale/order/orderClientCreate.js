'use strict';

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var OrderClientCreateRequest = require('*/cartridge/models/globale/order/requests/OrderClientCreateRequest');
    var OrderClientCreateResponse = require('*/cartridge/models/globale/order/responses/OrderClientCreateResponse');
    var OrderClientCreateAction = require('*/cartridge/models/globale/order/actions/OrderClientCreateAction');

    // init response
    var responseObj = new OrderClientCreateResponse();

    try {
        // init request
        var requestObj = new OrderClientCreateRequest();

        // validate payload
        requestObj.validate({
            h: { required: true },
            currency: { required: true }
        });
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // check if is used Mixed Orders flow and redefine action handler
        if (objectUtils.getValueByPath(requestObj.payload, 'isMixedOrder', null) === true) {
            OrderClientCreateAction = require('*/cartridge/models/globale/order/actions/OrderClientCreateMixedOrdersAction');
        }

        // create action handler
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderClientCreateAction(requestObj, responseObj);
        actionHandlerDecorators.createOrder(actionHandler);
        actionHandlerDecorators.orderNotes(actionHandler);
        actionHandlerDecorators.processDecoratorStatus(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_CLIENT_CREATE: {0}', logger.message(e));
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
