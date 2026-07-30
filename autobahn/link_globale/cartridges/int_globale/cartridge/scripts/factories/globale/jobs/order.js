'use strict';

var Status = require('dw/system/Status');

/**
 * This Job sends Order Updates to Global-e API using Global-e Services
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function updateOrderStatus(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var OrderNotificationOperationData = require('*/cartridge/models/globale/jobs/order/requests/OrderNotificationOperationData');
    var OrderNotificationOperationResult = require('*/cartridge/models/globale/jobs/order/responses/OrderNotificationOperationResult');

    var operationData = new OrderNotificationOperationData();
    var operationResult = new OrderNotificationOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var OrderStatusUpdateOperation = require('*/cartridge/models/globale/jobs/order/actions/OrderStatusUpdateOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/order/actions/decorators/index');

        var operationHandler = new OrderStatusUpdateOperation(operationData, operationResult);
        operationHandlerDecorators.getPendingNotifications(operationHandler);
        operationHandlerDecorators.findOrder(operationHandler);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.writeOrderStats(operationHandler);
        operationHandlerDecorators.writeOrderNote(operationHandler);
        operationHandlerDecorators.removeNotificationCO(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_UpdateOrderStatus: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job sends Order Dispatch to Global-e API using Global-e Services
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function updateOrderDispatch(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var OrderNotificationOperationData = require('*/cartridge/models/globale/jobs/order/requests/OrderNotificationOperationData');
    var OrderNotificationOperationResult = require('*/cartridge/models/globale/jobs/order/responses/OrderNotificationOperationResult');

    var operationData = new OrderNotificationOperationData();
    var operationResult = new OrderNotificationOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var OrderDispatchUpdateOperation = require('*/cartridge/models/globale/jobs/order/actions/OrderDispatchUpdateOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/order/actions/decorators/index');

        var operationHandler = new OrderDispatchUpdateOperation(operationData, operationResult);
        operationHandlerDecorators.getPendingNotifications(operationHandler);
        operationHandlerDecorators.findOrder(operationHandler);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.writeOrderStats(operationHandler);
        operationHandlerDecorators.writeOrderNote(operationHandler);
        operationHandlerDecorators.removeNotificationCO(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_UpdateOrderDispatch: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job sends Order Refund to Global-e API using Global-e Services
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function createOrderRefund(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var OrderNotificationOperationData = require('*/cartridge/models/globale/jobs/order/requests/OrderNotificationOperationData');
    var OrderNotificationOperationResult = require('*/cartridge/models/globale/jobs/order/responses/OrderNotificationOperationResult');

    var operationData = new OrderNotificationOperationData();
    var operationResult = new OrderNotificationOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var OrderRefundUpdateOperation = require('*/cartridge/models/globale/jobs/order/actions/OrderRefundUpdateOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/order/actions/decorators/index');

        var operationHandler = new OrderRefundUpdateOperation(operationData, operationResult);
        operationHandlerDecorators.getPendingNotifications(operationHandler);
        operationHandlerDecorators.findOrder(operationHandler);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.writeOrderStats(operationHandler);
        operationHandlerDecorators.writeOrderNote(operationHandler);
        operationHandlerDecorators.removeNotificationCO(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_CreateOrderRefund: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job sends Order RMA to Global-e API using Global-e Services
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function updateOrderRMA(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var OrderNotificationOperationData = require('*/cartridge/models/globale/jobs/order/requests/OrderNotificationOperationData');
    var OrderNotificationOperationResult = require('*/cartridge/models/globale/jobs/order/responses/OrderNotificationOperationResult');

    var operationData = new OrderNotificationOperationData();
    var operationResult = new OrderNotificationOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var OrderRMAUpdateOperation = require('*/cartridge/models/globale/jobs/order/actions/OrderRMAUpdateOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/order/actions/decorators/index');

        var operationHandler = new OrderRMAUpdateOperation(operationData, operationResult);
        operationHandlerDecorators.getPendingNotifications(operationHandler);
        operationHandlerDecorators.findOrder(operationHandler);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.writeOrderStats(operationHandler);
        operationHandlerDecorators.writeOrderNote(operationHandler);
        operationHandlerDecorators.removeNotificationCO(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_UpdateOrderRMA: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

module.exports = {
    UpdateOrderStatus: updateOrderStatus,
    UpdateOrderDispatch: updateOrderDispatch,
    CreateOrderRefund: createOrderRefund,
    UpdateOrderRMA: updateOrderRMA
};
