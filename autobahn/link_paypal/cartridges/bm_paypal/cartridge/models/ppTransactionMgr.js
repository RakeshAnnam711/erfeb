'use strict';

const paypalUtils = require('*/cartridge/scripts/paypal/utils');

const PPRestApiWrapper = require('~/cartridge/scripts/paypal/api/restApiWrapper');
const ppRestApiWrapperInstance = new PPRestApiWrapper();

/**
 * Gets transaction id for api call to get details for correspondent transaction
 * @param {dw.web.HttpParameterMap} hm request.httpParameterMap
 * @param {string} transactionIdFromOrder transaction id from current order
 * @returns {string} transaction id
 */
function getTransactionID(hm, transactionIdFromOrder) {
    let transactionID;

    if (!empty(hm.transactionId.stringValue) && !empty(transactionIdFromOrder)
        && hm.transactionId.stringValue !== transactionIdFromOrder || empty(hm.transactionId.stringValue)) {
        transactionID = transactionIdFromOrder;
    } else {
        transactionID = hm.transactionId.stringValue;
    }

    return transactionID;
}

/**
 * PP Transaction Mgr Model
 */
function TransactionMgrModel() { }

TransactionMgrModel.prototype.getTransactionData = function(hm, transactionIdFromOrder) {
    const Resource = require('dw/web/Resource');

    let orderDetails;

    try {
        const transactionID = getTransactionID(hm, transactionIdFromOrder);

        orderDetails = ppRestApiWrapperInstance.getOrderDetails(transactionID);

        if (orderDetails.err) {
            const note = Resource.msg('transactions.note', 'paypalbm', null);

            throw new Error(orderDetails.responseData.l_longmessage0 + note);
        }
    } catch (error) {
        if (error.message !== Resource.msg('api.error.resource.not.found', 'errors', null)) {
            paypalUtils.createErrorLog(error);
        }

        throw new Error(error);
    }

    return orderDetails;
};

module.exports = TransactionMgrModel;
