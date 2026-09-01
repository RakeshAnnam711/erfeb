'use strict';

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var VoidReservationRequest = require('*/cartridge/models/globale/inventory/requests/VoidReservationRequest');
    var VoidReservationResponse = require('*/cartridge/models/globale/inventory/responses/VoidReservationResponse');

    // init response
    var responseObj = new VoidReservationResponse();

    try {
        // init request
        var requestObj = new VoidReservationRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // validate payload
        requestObj.validate({
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            OrderId: { required: true },
            ReservationRequestId: { required: true }
        });
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // create action handler
        var VoidReservationAction = require('*/cartridge/models/globale/inventory/actions/VoidReservationAction');
        var actionHandler = new VoidReservationAction(requestObj, responseObj);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_VOID_RESERVATION: {0}', logger.message(e));
        responseObj.success = false;
        responseObj.errorCode = responseObj.errorCode || 500;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj.getPayload();
};
