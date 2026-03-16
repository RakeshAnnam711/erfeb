'use strict';

/**
 * Cancels Expired Pay By Link Orders
 * @returns {dw.system.Status} - operation status
 */
function cancel() {
    var Status = require('dw/system/Status');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var PayByLinkOrderCancelOperationData = require('*/cartridge/models/globale/jobs/order/requests/PayByLinkOrderCancelOperationData');
    var PayByLinkOrderCancelOperationResult = require('*/cartridge/models/globale/jobs/order/responses/PayByLinkOrderCancelOperationResult');

    var operationData = new PayByLinkOrderCancelOperationData();
    var operationResult = new PayByLinkOrderCancelOperationResult();

    try {
        // create operation handler
        var PayByLinkOrderCancelOperation = require('*/cartridge/models/globale/jobs/order/actions/PayByLinkOrderCancelOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/order/actions/decorators/index');

        var operationHandler = new PayByLinkOrderCancelOperation(operationData, operationResult);
        operationHandlerDecorators.getPayByLinkOrders(operationHandler);
        operationHandlerDecorators.cancelOrder(operationHandler);
        operationHandlerDecorators.writeOrderStats(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('PAY_BY_LINK_ORDER_CANCELATION: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

module.exports = {
    cancel: cancel
};
