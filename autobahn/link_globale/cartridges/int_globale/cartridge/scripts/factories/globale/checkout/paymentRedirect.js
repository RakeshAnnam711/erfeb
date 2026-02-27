'use strict';

module.exports = function () {
    var System = require('dw/system/System');
    var PaymentRedirectOperationData = require('*/cartridge/models/globale/checkout/requests/PaymentRedirectOperationData');
    var PaymentRedirectOperationResult = require('*/cartridge/models/globale/checkout/responses/PaymentRedirectOperationResult');

    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var operationData = new PaymentRedirectOperationData();
    var operationResult = new PaymentRedirectOperationResult();

    try {
        // create operation handler
        var PaymentRedirectOperation = require('*/cartridge/models/globale/checkout/actions/PaymentRedirectOperation');
        var operationHandler = new PaymentRedirectOperation(operationData, operationResult);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('GLOBALE_PAYMENT_PSP_REDIRECT: {0}', logger.message(e));

        operationResult.success = false;
        operationResult.errorCode = operationResult.errorCode || 100; // general error code
        operationResult.errorMessage = operationResult.errorMessage || (e.message + '; ' + e.stack);

        // hide real error in the production environment
        if (System.instanceType === System.PRODUCTION_SYSTEM) {
            operationResult.cartToken = null;
            operationResult.errorCode = 100;
            operationResult.errorMessage = 'An internal error has occurred. Please try again later. We are sorry for the inconvenience.';
        }
    }

    return operationResult;
};
