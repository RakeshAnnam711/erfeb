'use strict';

/**
 * Returns Order details
 * @param {array} orderIds - order IDs
 * @returns {Object|null} - shipping details response
 */
function getDetails(orderIds) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var OrderDetailsOperationData = require('*/cartridge/models/globale/orderDetails/OrderDetailsOperationData');
    var OrderDetailsOperationResult = require('*/cartridge/models/globale/orderDetails/OrderDetailsOperationResult');

    var operationData = new OrderDetailsOperationData({
        OrderIds: orderIds
    });
    var operationResult = new OrderDetailsOperationResult();

    try {
        // create operation handler
        var OrderDetailsOperation = require('*/cartridge/models/globale/orderDetails/OrderDetailsOperation');
        var operationHandler = new OrderDetailsOperation(operationData, operationResult);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_DETAILS: {0}', logger.message(e));

        operationResult.success = false;
        operationResult.errorCode = operationResult.errorCode || 100; // general error code
        operationResult.errorMessage = operationResult.errorMessage || (e.message + '; ' + e.stack);
    }

    return operationResult;
}

module.exports = {
    getDetails: getDetails
};
