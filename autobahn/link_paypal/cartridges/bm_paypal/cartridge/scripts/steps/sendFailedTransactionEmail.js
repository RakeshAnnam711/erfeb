'use strict';

/**
 * Job Step Type that send failed transaction info to the specified email.
 *
 * @module bm_paypal/cartridge/scripts/steps/sendFailedTransactionEmail.js
 *
 * @parameters {Email} - the email which can be used for sending alerts
 * @parameters {DaysToRetrieve} - the period which can be used for retrieving the respective transactions (number of days)
 * @parameters {StatusesToCheck} - the statuses that will be considered to be checked, namely: 'DENIED, DECLINED, FAILED'
 * @parameters {AlertsInBM} - activates alerts for failed transactions in Business Manager
 */

/**
 * Split the string into an array using a comma as the separator
 * @param {string} string to transform
 * @returns {array} transformed string
 */
function createArrayFromString(string) {
    return string.split(',').map(function(status) {
        return status.trim();
    });
}

/**
 * Logs info message
 * @param {string} msg info message for log
 */
function createLog(msg) {
    const Logger = require('dw/system/Logger');
    const logger = Logger.getLogger('PayPal-BM');

    logger.info(msg);
}

/**
 * Filter orders by date according to DaysToRetrieve job parameter
 * @param {array} orders to transform
 * @param {number} daysToRetrieve the period which can be used for retrieving the respective transactions (number of days)
 * @returns {array} orders filtered by date
 */
function filterByDate(orders, daysToRetrieve) {
    const currentDate = new Date();

    let daysDifference;
    let timeDifference;

    return orders.toArray().filter(function(order) {
        timeDifference = currentDate - order.dateCompare;
        daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        return daysDifference <= daysToRetrieve;
    });
}

/**
 * Filter orders by date according to DaysToRetrieve job parameter
 * @param {string} statusesToCheck the statuses that will be considered to be checked
 * @param {number} daysToRetrieve the period which can be used for retrieving the respective transactions (number of days)
 * @returns {array} array with statuses information
 */
function checkStatuses(statusesToCheck, daysToRetrieve) {
    const PPOrderMgrModel = require('~/cartridge/models/ppOrderMgr');
    const statusesToCheckArray = createArrayFromString(statusesToCheck);
    const ppOrderMgrModel = new PPOrderMgrModel();
    const statuses = [];

    let ordersWithAlertTransactionFiltered;
    let ordersWithAlertTransaction;

    statusesToCheckArray.forEach(function(status) {
        ordersWithAlertTransaction = ppOrderMgrModel.getOrderByPaymentStatus(status);
        ordersWithAlertTransactionFiltered = filterByDate(ordersWithAlertTransaction, daysToRetrieve);

        if (ordersWithAlertTransactionFiltered.length > 0) {
            statuses.push({
                status: status,
                count: ordersWithAlertTransactionFiltered.length
            });
        }
    });

    return statuses;
}

/**
 * Gets current date in mm\dd\yy format
 * @returns {string} current date in mm\dd\yy format
 */
function getCurrentDate() {
    const currentDate = new Date();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const yy = String(currentDate.getFullYear()).slice(-2);

    return [mm, dd, yy].join('/');
}

/**
 * Sends an email with alert transactions
 * @param {string} emailToSend the email address on which to send
 * @param {array} emailData an array of statuses objects to show alert messages
 */
function sendEmail(emailToSend, emailData) {
    const Mail = require('dw/net/Mail');
    const HashMap = require('dw/util/HashMap');
    const Template = require('dw/util/Template');
    const Site = require('dw/system/Site');

    const email = new Mail();
    const context = new HashMap();
    const template = new Template('emails/mailAlert');
    const subject = ['Payment Alert_', getCurrentDate()].join('');

    context.put('emailData', emailData);

    const content = template.render(context);

    email.addTo(emailToSend);
    email.setSubject(subject);
    email.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com');

    email.setContent(content);
    email.send();
}

/**
 * Add alert notification into BM
 * @param {array} statutesData statuses information
 * @returns {void}
 */
function addAlert(statutesData) {
    const Alerts = require('dw/alert/Alerts');
    const Transaction = require('dw/system/Transaction');

    const result = statutesData.reduce(function(accumulator, current) {
        accumulator.total += current.count;
        accumulator.statuses.push(current.status);

        return accumulator;
    }, { total: 0, statuses: [] });

    Transaction.wrap(function() {
        Alerts.removeAlert('pp_failed_transactions_statuses');
        Alerts.addAlert('pp_failed_transactions_statuses', 'dw.order.Order', [result.total, result.statuses.join(', ')]);
    });
}

/**
 * sendFailedTransactionEmail(parameters) function. Accepts email, the period which can be used for retrieving transactions (number of days), the statuses list and alerts in BM
   Sends an email with transaction alerts
 * @param {dw.util.HashMap} parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
   @returns {dw.system.Status} - result of the operation
 */
function sendFailedTransactionEmail(parameters) {
    const Status = require('dw/system/Status');
    const Resource = require('dw/web/Resource');

    if (!parameters.StatusesToCheck) {
        return new Status(
            Status.ERROR, 'ERROR', Resource.msgf('job.parameter.notset', 'notifications', null, 'StatusesToCheck')
        );
    }

    const statusesData = checkStatuses(parameters.StatusesToCheck, parameters.DaysToRetrieve);

    if (!statusesData.length) {
        createLog(Resource.msg('transaction.logs.alert.job', 'notifications', null));

        return new Status(Status.OK);
    }

    if (parameters.Email) {
        sendEmail(parameters.Email, statusesData);
    }

    if (parameters.AlertsInBM) {
        addAlert(statusesData);
    }

    return new Status(Status.OK);
}

module.exports = {
    sendFailedTransactionEmail: sendFailedTransactionEmail
};
