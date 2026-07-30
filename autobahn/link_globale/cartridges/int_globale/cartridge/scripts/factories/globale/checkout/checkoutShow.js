'use strict';

module.exports = function (enableCartTokenCache) {
    var System = require('dw/system/System');

    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var SendCartOperationData = require('*/cartridge/models/globale/checkout/requests/SendCartOperationData');
    var SendCartOperationResult = require('*/cartridge/models/globale/checkout/responses/SendCartOperationResult');

    var operationData = new SendCartOperationData();
    var operationResult = new SendCartOperationResult();

    try {
        // init operation data
        operationData.enableCartTokenCache = enableCartTokenCache || false;

        // create operation handler
        var SendCartOperation = require('*/cartridge/models/globale/checkout/actions/SendCartOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/checkout/actions/decorators/index');
        var operationHandler = new SendCartOperation(operationData, operationResult);
        operationHandlerDecorators.getSendCartData(operationHandler);
        operationHandlerDecorators.getCartToken(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('GLOBALE_SEND_CART: {0}', logger.message(e));

        operationResult.success = false;
        operationResult.errorCode = operationResult.errorCode || 100; // general error code
        operationResult.errorMessage = operationResult.errorMessage || (e.message + '; ' + e.stack);

        // hide real error in the production environment
        if (operationResult.instanceType === System.PRODUCTION_SYSTEM) {
            operationResult.sendCartData = null;
            operationResult.cartToken = null;
            operationResult.errorCode = 100;
            operationResult.errorMessage = 'An internal error has occurred. Please try again later. We are sorry for the inconvenience.';
        }
    }

    return operationResult;
};
