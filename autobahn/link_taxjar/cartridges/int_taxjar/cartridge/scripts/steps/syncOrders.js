/* global dw */

/**
 * Job Step Type that syncs orders to TaxJar
 */

'use strict';

var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');
var TaxJarOrderUtils = require('*/cartridge/scripts/taxJarOrderUtils');
var OrderTransaction = require('*/cartridge/models/taxjar/orderTransaction');

var orders;

/**
 * Determines whether or not a date time interval was set for the sync
 * @param  {Object}  parameters - job step parameters
 * @return {boolean} - whether or not a date time interval was set
 */
function hasDateTimeIntervalSet(parameters) {
    if (parameters.StartTime || parameters.EndTime) {
        return true;
    }
    return false;
}

/**
 * Gets created after date time
 * @param  {Object} parameters - job step parameters
 * @return {Date} - date to query orders created after
 */
function getCreatedAfterDateTime(parameters) {
    if (parameters.StartTime) {
        return new Date(parameters.StartTime);
    }

    return new Date(Date.now());
}

/**
 * Gets created before date time
 * @param  {Object} parameters - job step parameters
 * @return {Date} - date to query orders created before
 */
function getCreatedBeforeDateTime(parameters) {
    if (parameters.EndTime) {
        return new Date(parameters.EndTime);
    }
    return new Date(Date.now());
}

/**
 * Checks if force sync is enabled for job step
 * @param  {Object}  parameters - job step parameters
 * @return {boolean} - true when order should sync regardless of when it was last updated
 */
function isForceSync(parameters) {
    return parameters.ForceSync;
}

/**
 * Gets the last sync time from custom site preferences
 * @return {Object} - Date of last sync
 */
function getLastSyncDateTime() {
    return dw.system.Site.getCurrent().getCustomPreferenceValue('TaxJarLastSyncTime');
}

/**
 * Sets the last sync time custom site preference
 * @param {Date} lastSyncDateTime - date time of last sync
 * @return {void}
 */
function setLastSyncDateTime(lastSyncDateTime) {
    dw.system.Transaction.wrap(function () {
        dw.system.Site.getCurrent().setCustomPreferenceValue('TaxJarLastSyncTime', lastSyncDateTime);
    });
}

/**
 * Clears the last sync time custom site preference
 * @return {void}
 */
function clearLastSyncDateTime() {
    dw.system.Transaction.wrap(function () {
        dw.system.Site.getCurrent().setCustomPreferenceValue('TaxJarLastSyncTime', null);
    });
}

/**
 * Gets orders to process in step
 * @param  {Object} parameters - job step parameters
 * @return {dw.util.SeekableIterator<dw.order.Order>} orders to process in step
 */
function getOrdersForStep(parameters) {
    if (hasDateTimeIntervalSet(parameters)) {
        var createdBeforeDateTime = getCreatedBeforeDateTime(parameters);
        var createdAfterDateTime = getCreatedAfterDateTime(parameters);
        Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Getting orders created between dates: ' + createdAfterDateTime.toISOString() + ' ' + createdAfterDateTime.toISOString());
        orders = TaxJarOrderUtils.getOrdersCreatedBetweenDates(createdAfterDateTime, createdBeforeDateTime);
        Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Found ' + orders.getCount() + ' orders to process.');
    } else {
        var currentDateTime = new Date(Date.now());
        var lastSyncDateTime = getLastSyncDateTime();

        if (!lastSyncDateTime) {
            lastSyncDateTime = currentDateTime;
        }

        Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Getting orders modified after ' + lastSyncDateTime.toISOString());
        setLastSyncDateTime(currentDateTime);
        orders = TaxJarOrderUtils.getOrdersModifiedAfterDateTime(lastSyncDateTime);
        Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Found ' + orders.getCount() + ' orders to process.');
    }

    return orders;
}

/**
 * Prepares job step
 * @param  {Object} parameters - job parameters
 * @return {void}
 */
function beforeStep(parameters) {
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Transaction Sync Step Started');
    orders = getOrdersForStep(parameters);
}

/**
 * Gets total count of orders to process in step
 * @return {number} total number of orders to process
 */
function getTotalCount() {
    return orders.count;
}

/**
 * Gets next order from orders iterator
 * @return {dw.order.Order} single order to process
 */
function read() {
    if (orders.hasNext()) {
        return orders.next();
    }
    return null;
}

/**
 * Processes cancelled order for removal from TaxJar
 * @param  {Object} orderTransaction - OrderTransaction model
 * @return {void}
 */
function processCancelledOrder(orderTransaction) {
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Order cancelled. Processing TaxJar Transactions.');
    if (orderTransaction.hasPreviouslySynced()) {
        orderTransaction.deleteFromTaxJar();
    }
}

/**
 * Processes an order (non cancelled) for syncing to TaxJar
 * @param  {Object} orderTransaction - OrderTransaction model
 * @param  {boolean} forceSync - when enabled, syncs order regardless of last update time being prior to last TaxJar last sync time
 */
function processOrder(orderTransaction, forceSync) {
    if (!orderTransaction.shouldSync(forceSync)) {
        return;
    }

    orderTransaction.syncToTaxJar();
}

/**
 * Processes a shipment (a single transaction to TaxJar)
 * @param  {dw.order.Shipment} shipment - shipment to sync
 * @param  {dw.order.Order} order - order shipment is attached to
 * @param {boolean} forceSync - true when order should sync regardless of last update time
 * @return {void}
 */
function processShipment(shipment, order, forceSync) {
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Processing shipment #' + shipment.getShipmentNo());
    var orderTransaction = new OrderTransaction(shipment, order);
    var orderStatus = order.getStatus().getValue();

    if (orderStatus === Order.ORDER_STATUS_NEW || orderStatus === Order.ORDER_STATUS_OPEN || orderStatus === Order.ORDER_STATUS_COMPLETED) {
        processOrder(orderTransaction, forceSync);
    } else if (orderStatus === Order.ORDER_STATUS_CANCELLED) {
        processCancelledOrder(orderTransaction);
    }
}

/**
 * Processes single order in chunk. Syncs order to TaxJar if necessary.
 * @param  {dw.order.Order} order - order to process
 * @param  {Object} parameters - job parameters
 * @return {dw.order.Order} processed order
 */
function process(order, parameters) {
    var shipments = order.getShipments().iterator();
    var forceSync = isForceSync(parameters);

    while (shipments.hasNext()) {
        var shipment = shipments.next();
        processShipment(shipment, order, forceSync);
    }

    return order;
}

/**
 * Writes lines to file - required for job
 */
function write() {

}

/**
 * Runs after step completes processing
 * @return {void}
 */
function afterStep() {
    orders.close();
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('Transaction Sync Step Completed');
}

module.exports = {
    beforeStep: beforeStep,
    getTotalCount: getTotalCount,
    read: read,
    process: process,
    write: write,
    afterStep: afterStep,
    getLastSyncDateTime: getLastSyncDateTime,
    setLastSyncDateTime: setLastSyncDateTime,
    clearLastSyncDateTime: clearLastSyncDateTime,
    isForceSync: isForceSync
};
