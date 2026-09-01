'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');
const paypalHelper = require('~/cartridge/scripts/paypal/helpers');
const constants = require('~/cartridge/config/constants');

const disputeHelper = {};

/**
 * Extract custom attributes from a given custom object.
 *
 * @param {dw.object.CustomObject} customObject - The custom object containing custom attributes.
 * @returns {Object} - An object containing all custom attributes from the custom object.
 */
function extractCustomAttributes(customObject) {
    return Object.keys(customObject.custom).reduce(function(accumulator, key) {
        accumulator[key] = customObject.custom[key];

        return accumulator;
    }, {});
}

/**
 * Create Dispute
 * @param {Object} entry - set of details for dispute
 */
disputeHelper.createDispute = function(entry) {
    const dispute = CustomObjectMgr.createCustomObject('PayPalDisputes', entry.dispute_id);

    dispute.custom.status = entry.status;
    dispute.custom.reason = entry.reason;
    dispute.custom.create_time = entry.create_time;
    dispute.custom.update_time = entry.update_time;
    dispute.custom.amount = entry.dispute_amount.value;
    dispute.custom.currency_code = entry.dispute_amount.currency_code;

    dispute.custom.messages = JSON.stringify(entry.messages || []);

    dispute.custom.history = JSON.stringify([{
        status: entry.status,
        time: entry.update_time,
        amount: entry.dispute_amount.value
    }]);
};

/**
 * Create Disputes in Custom Object
 * @param {Object} disputes - List of disputes
 */
disputeHelper.createDisputes = function(disputes) {
    const Transaction = require('dw/system/Transaction');

    Transaction.wrap(function() {
        disputes.forEach(function(dispute) {
            disputeHelper.createDispute(dispute);
        });
    });
};

/**
 * Get Dispute from PayPal API
 * @param {string} disputeId - Dispute ID
 * @returns {Object} - Dispute details
 */
disputeHelper.getDisputeFromPayPal = function(disputeId) {
    const paypalApi = require('~/cartridge/scripts/paypal/api/paypal');
    const dispute = paypalApi.getDisputeDetails(disputeId);

    if (!('messages' in dispute)) {
        dispute.messages = [];
    }

    if (!('history' in dispute)) {
        dispute.history = [];
    }

    return dispute;
};

/**
 * Get Dispute from Custom Object
 * @param {string} disputeId - Dispute ID
 * @returns {Object} - Object of Dispute from Custom Object
 */
disputeHelper.getDisputeFromCustomObject = function(disputeId) {
    const dispute = CustomObjectMgr.getCustomObject('PayPalDisputes', disputeId);

    if (!dispute) {
        return dispute;
    }

    const disputeObj = extractCustomAttributes(dispute);

    ['history', 'messages'].forEach(function(key) {
        const value = disputeObj[key];

        disputeObj[key] = coreHelpers.isJson(value) ? coreHelpers.tryParseJSON(value) : [];
    });

    return disputeObj;
};

/**
 * Get Disputes from PayPal API
 * @returns {Array} - List of Disputes
 */
disputeHelper.getDisputesFromPayPal = function() {
    const paypalApi = require('~/cartridge/scripts/paypal/api/paypal');

    const response = paypalApi.getDisputes();

    return response.items;
};

/**
 * Get Disputes from Custom Object Types
 * @param {string} [searchType] - Search type for query search, could be empty
 * @param {string} [searchQuery] - Specific reason/status/dispute id
 * @returns {dw.util.SeekableIterator} - Iterator
 */
disputeHelper.getDisputesFromCustomObject = function(searchType, searchQuery) {
    if (searchType && searchQuery) {
        const query = searchType + '={0}';

        return CustomObjectMgr.queryCustomObjects('PayPalDisputes', query, 'custom.create_time desc', searchQuery);
    }

    return CustomObjectMgr.queryCustomObjects('PayPalDisputes', '', 'custom.create_time desc');
};

/**
 * Formatted Dispute to the same format (API, Custom Objects)
 * @param {Object} dispute - Dispute Details
 * @returns {Object} - Formatted dispute
 */
disputeHelper.formattedDispute = function(dispute) {
    const Money = require('dw/value/Money');

    dispute.create_time = paypalHelper.formattedDate(dispute.create_time);
    dispute.update_time = paypalHelper.formattedDate(dispute.update_time);

    if ('dispute_amount' in dispute) {
        dispute.amount = new Money(dispute.dispute_amount.value, dispute.dispute_amount.currency_code).toFormattedString();
    } else if ('amount' in dispute) {
        dispute.amount = new Money(dispute.amount, dispute.currency_code).toFormattedString();
    }

    return dispute;
};

/**
 * Add order info to dispute transactions
 * @param {Object} dispute - Dispute details
 * @returns {Object} - Dispute with order details
 */
disputeHelper.addOrderToDisputeTransactions = function(dispute) {
    if ('disputed_transactions' in dispute) {
        const Order = require('dw/order/Order');
        const OrderMgr = require('dw/order/OrderMgr');

        let queryString = '';

        dispute.disputed_transactions = dispute.disputed_transactions.map(function(transaction) {
            if (transaction.seller_transaction_id) {
                queryString = 'custom.paypalPaymentMethod = \'express\' AND status != {0} AND custom.PP_API_TransactionID = {1}';

                transaction.order = OrderMgr.searchOrder(queryString, Order.ORDER_STATUS_FAILED, transaction.seller_transaction_id);
            }

            if (!transaction.order && transaction.invoice_number) {
                queryString = 'custom.paypalPaymentMethod = \'express\' AND status != {0} AND orderNo = {1}';

                transaction.order = OrderMgr.searchOrder(queryString, Order.ORDER_STATUS_FAILED, transaction.invoice_number);
            }

            return transaction;
        });
    }

    return dispute;
};

/**
 * Checking that the dispute contains a full history of disputes
 * @param {Object} dispute - Dispute details
 * @returns {boolean} - True if has full dispute history, otherwise false
 */
disputeHelper.hasFullHistory = function(dispute) {
    return dispute.history.some(function(item) {
        return item.status === 'OPEN';
    });
};

/**
 * Get Dispute Details
 * @param {string} disputeId - Dispute ID
 * @returns {Object} - Dispute details
 */
disputeHelper.getDispute = function(disputeId) {
    const prefs = require('~/cartridge/config/preferences');

    const dispute = disputeHelper.getDisputeFromPayPal(disputeId);
    const disputeCO = disputeHelper.getDisputeFromCustomObject(disputeId);

    if (disputeCO && !prefs.simplifiedDisputePage) {
        dispute.history = disputeCO.history;

        if (!dispute.messages.length) {
            dispute.messages = disputeCO.messages;
        }
    }

    return disputeHelper.addOrderToDisputeTransactions(dispute);
};

/**
 * Get search params for disputes query search
 * @param {request.httpParameterMap} hm Current httpParameterMap
 * @returns {Object} - object with searchType and searchQuery values
 */
disputeHelper.getSearchParams = function(hm) {
    let searchType;
    let searchQuery;

    if (hm.disputeStatus.submitted) {
        searchType = 'custom.status';
        searchQuery = hm.disputeStatus.stringValue;
    } else if (hm.disputeReason.submitted) {
        searchType = 'custom.reason';
        searchQuery = hm.disputeReason.stringValue;
    } else if (hm.disputeId.submitted) {
        searchType = 'custom.dispute_id';
        searchQuery = hm.disputeId.stringValue;
    }

    return {
        searchType: searchType,
        searchQuery: searchQuery
    };
};

/**
 * Update custom dispute by ID from API dispute.
 * @param {Object} disputePP - Dispute details from PayPal API
 */
disputeHelper.updateDisputeCO = function(disputePP) {
    const Transaction = require('dw/system/Transaction');

    if (empty(disputePP)) {
        return;
    }

    const disputeCO = CustomObjectMgr.getCustomObject('PayPalDisputes', disputePP.dispute_id);

    Transaction.wrap(function() {
        disputeCO.custom.update_time = disputePP.update_time;
        disputeCO.custom.reason = disputePP.reason;
        disputeCO.custom.status = disputePP.status;
    });
};

/**
 * Get Disputes
 * @param {request.httpParameterMap} hm Current httpParameterMap
 * @returns {Array} - List of Disputes
 */
disputeHelper.getDisputes = function(hm) {
    let disputes = [];

    const prefs = require('~/cartridge/config/preferences');

    if (prefs.simplifiedDisputePage) {
        disputes = disputeHelper.getDisputesFromPayPal();
    } else {
        const { searchType, searchQuery } = disputeHelper.getSearchParams(hm);

        disputes = disputeHelper.getDisputesFromCustomObject(searchType, searchQuery);

        if (searchType === undefined && disputes.count === 0) {
            disputes = disputeHelper.getDisputesFromPayPal();

            disputeHelper.createDisputes(disputes);
        }
    }

    const SeekableIterator = require('dw/util/SeekableIterator');

    if (disputes instanceof SeekableIterator) {
        disputes = disputes.asList().toArray().map(function(dispute) {
            return extractCustomAttributes(dispute);
        });
    }

    return disputes.map(function(dispute) {
        return disputeHelper.formattedDispute(dispute);
    });
};

/**
 * Collect Unique Statuses
 * @returns {Object} - Unique Statuses
 */
disputeHelper.getUniqueStatuses = function() {
    const statuses = {};
    const iterator = disputeHelper.getDisputesFromCustomObject();

    let status;
    let dispute;

    while (iterator.hasNext()) {
        dispute = iterator.next();
        status = dispute.custom.status;

        if (status in statuses) {
            statuses[status].count++;
        } else {
            statuses[status] = {
                count: 1,
                value: status,
                label: status ? paypalHelper.parseStatus(status) : constants.NOT_APPLICABLE_SHORT
            };
        }
    }

    return statuses;
};

/**
 * Get differences in data between PayPal API and Custom Object for update
 * @param {string} disputeId - Dispute ID
 * @returns {Object} - Differences in data between PayPal API and Custom Object
 */
disputeHelper.getDiffsForUpdate = function(disputeId) {
    let disputeCO = disputeHelper.getDisputeFromCustomObject(disputeId);

    if (!disputeCO) {
        return {};
    }

    let disputePP = disputeHelper.getDisputeFromPayPal(disputeId);

    disputePP = disputeHelper.formattedDispute(disputePP);
    disputeCO = disputeHelper.formattedDispute(disputeCO);

    return ['status', 'reason', 'update_time'].reduce(function(accum, key) {
        if (disputePP[key] && disputeCO[key] !== disputePP[key]) {
            accum[key] = disputePP[key];
        }

        return accum;
    }, {});
};

/**
 * Gets available reasons of disputes for filtering
 * @returns {Array} - Reasons list
 */
disputeHelper.getAvailableDisputeReasons = function() {
    const reasons = {};
    const reasonsList = [];
    const iterator = disputeHelper.getDisputesFromCustomObject();

    let reason;
    let dispute;

    while (iterator.hasNext()) {
        dispute = iterator.next();
        reason = dispute.custom.reason;

        if (!(reason in reasons)) {
            reasons[reason] = {
                count: 1,
                value: reason,
                label: reason ? paypalHelper.parseStatus(reason) : constants.NOT_APPLICABLE_SHORT
            };

            reasonsList.push(reasons[reason]);
        }
    }

    return reasonsList;
};

/**
 * Generates a list of formatted search options for filtering disputes
 * @param {string[]} listOfDisputeStates - List of all available states (for dispute reasons or dispute statuses)
 * @returns {Array<{ value: string, label: string }>} - List of formatted search options with `value` and `label` properties
 */
disputeHelper.generateDisputeSearchOptions = function(listOfDisputeStates) {
    return listOfDisputeStates
        .map(function(disputeState) {
            return { value: disputeState, label: paypalHelper.parseStatus(disputeState) };
        }).sort(function(prevDisputeState, nextDisputeState) {
            return prevDisputeState.value > nextDisputeState.value ? 1 : -1;
        });
};

module.exports = disputeHelper;
