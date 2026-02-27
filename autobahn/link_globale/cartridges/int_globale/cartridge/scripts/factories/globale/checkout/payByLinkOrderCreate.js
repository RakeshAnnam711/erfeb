'use strict';

module.exports = function (basket, geCartToken) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var PayByLinkCreateOrderResult = require('*/cartridge/models/globale/checkout/responses/PayByLinkCreateOrderResult');
    var PayByLinkCreateOrderOperationData = require('*/cartridge/models/globale/checkout/requests/PayByLinkCreateOrderOperationData');

    var operationResult = new PayByLinkCreateOrderResult();
    var operationData = new PayByLinkCreateOrderOperationData();

    try {
        // init operation data
        operationData.basket = basket || null;
        operationData.geCartToken = geCartToken || null;

        // create operation handler
        var PayByLinkCreateOrderOperation = require('*/cartridge/models/globale/checkout/actions/PayByLinkCreateOrderOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/checkout/actions/decorators/index');
        var operationHandler = new PayByLinkCreateOrderOperation(operationData, operationResult);
        operationHandlerDecorators.payByLinkCreateOrder(operationHandler);
        operationHandlerDecorators.payByLinkPlaceOrder(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (error) {
        logger.error('PAY_BY_LINK_ORDER_CREATION: {0}', error.message + '; ' + error.stack);

        operationResult.success = false;
        operationResult.errorMessage = operationResult.errorMessage || (error.message + '; ' + error.stack);
    }

    return operationResult;
};
