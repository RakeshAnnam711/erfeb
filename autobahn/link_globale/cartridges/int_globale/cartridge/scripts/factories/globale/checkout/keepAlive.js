'use strict';

module.exports = function () {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var KeepAliveRequest = require('*/cartridge/models/globale/checkout/requests/KeepAliveRequest');
    var KeepAliveResponse = require('*/cartridge/models/globale/checkout/responses/KeepAliveResponse');

    // init response
    var responseObj = new KeepAliveResponse();

    try {
        // init request
        var requestObj = new KeepAliveRequest();

        // create action handler
        var KeepAliveAction = require('*/cartridge/models/globale/checkout/actions/KeepAliveAction');
        var actionHandlerDecorators = require('*/cartridge/models/globale/checkout/actions/decorators/index');
        var actionHandler = new KeepAliveAction(requestObj, responseObj);
        actionHandlerDecorators.reserveInventory(actionHandler);
        actionHandlerDecorators.processDecoratorStatus(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_KEEP_ALIVE: {0}', logger.message(e));

        responseObj.success = false;
        responseObj.errorCode = responseObj.errorCode || 200; // general error code
        responseObj.errorMessage = responseObj.errorMessage || 'general error';
    }

    return responseObj.getPayload();
};
