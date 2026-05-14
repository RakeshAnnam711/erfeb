/* eslint-disable no-loop-func */

'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents PayByLinkOrderCancelOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function PayByLinkOrderCancelOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
PayByLinkOrderCancelOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Cancels expired orders created by Order On behalf of a customer scenario
 * @throws {Error}
 */
PayByLinkOrderCancelOperation.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    try {
        var order;
        var ordersIterator = this.getPayByLinkOrders();
        this.operationResult.stats.total = ordersIterator.getCount();

        while (ordersIterator.hasNext()) {
            try {
                order = ordersIterator.next();
                this.cancelOrder(order);

                this.operationResult.stats.processed++;
                logger.info('PAY_BY_LINK_ORDER_CANCELATION: order No: {0}', order.orderNo, 'was Cancelled');
            } catch (error) {
                this.operationResult.stats.failed++;
                logger.error('PAY_BY_LINK_ORDER_CANCELATION: {0}', error.message + '; ' + error.stack);
            }
        }
        ordersIterator.close();

        this.writeOrderStats(this.operationResult.stats, 'PAY_BY_LINK_ORDER_CANCELATION');

        if (this.operationResult.stats.failed > 0) {
            throw new Error('PayByLink order cancellation is finished with errors');
        }
    } catch (e) {
        logger.error('PAY_BY_LINK_ORDER_CANCELATION: {0}', e.message + '; ' + e.stack);
    }

    this.operationResult.success = true;
};

module.exports = PayByLinkOrderCancelOperation;
