'use strict';

/* global empty dw request session customer */

const Logger = require('dw/system/Logger');
const Calendar = require('dw/util/Calendar');
const OrderMgr = require('dw/order/OrderMgr');
const StringUtils = require('dw/util/StringUtils');

const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');
const constants = require('~/cartridge/config/constants');
const paymentInstrumentHelper = require('~/cartridge/scripts/paypal/paymentInstrumentHelpers');

const paypalHelper = {};

/**
 * Remove underscore and capitalize a first letter in payment status
 * @param {string} paymentStatus payment status
 * @return {string} Formatted payment status
 */
paypalHelper.parseStatus = function(paymentStatus) {
    let result = null;

    try {
        const status = paymentStatus.toLowerCase();
        const firstLetter = status.charAt(0);

        result = status.replace(/_/g, ' ').replace(firstLetter, firstLetter.toUpperCase());
    } catch (error) {
        Logger.getLogger('PayPal-BM', 'PayPal_General').error(error);
    }

    return result;
};

/**
 * Returns boolean value whether search query inputs are empty or not
 * @param {Object} searchQueryParams query parameters
 * @param {Object} searchQueryParams.transactionId transaction ID
 * @param {Object} searchQueryParams.orderNo order No
 * @param {Object} searchQueryParams.paymentStatus payment status
 * @param {Object} searchQueryParams.paymentMethod payment method
 * @returns {boolean} value
 */
paypalHelper.isSearchQueryEmpty = function(searchQueryParams) {
    return empty(searchQueryParams.transactionId.stringValue)
        && empty(searchQueryParams.orderNo.stringValue)
        && empty(searchQueryParams.paymentStatus.stringValue)
        && empty(searchQueryParams.paymentMethod.stringValue);
};

/**
 * Gets a search type based on submitted search query
 * @param {string} transactionId transaction ID
 * @param {string} paymentStatus payment status
 * @param {string} paymentMethod payment method
 * @returns {string} search type
 */
paypalHelper.getSearchType = function(transactionId, paymentStatus, paymentMethod) {
    let searchType = constants.SEARCH_BY_ORDER_NUMBER;

    const isSearchByTransactionId = transactionId.submitted && !empty(transactionId.stringValue);
    const isSearchByPaymentStatus = paymentStatus.submitted && !empty(paymentStatus.stringValue);
    const isSearchByPaymentMethod = paymentMethod.submitted && !empty(paymentMethod.stringValue);

    if (isSearchByTransactionId) {
        searchType = constants.SEARCH_BY_TRANSACTION_ID;
    } else if (isSearchByPaymentStatus) {
        searchType = constants.SEARCH_BY_PAYMENT_STATUS;
    } else if (isSearchByPaymentMethod) {
        searchType = constants.SEARCH_BY_PAYMENT_METHOD;
    }

    return searchType;
};

/**
 * Returns Formatted Date
 * @param {string} dateTime - Date time string
 * @returns {dw.util.StringUtils} formatted creation date
 */
paypalHelper.formattedDate = function(dateTime) {
    return StringUtils.formatCalendar(new Calendar(new Date(dateTime)), 'M/dd/yy h:mm a');
};

/**
 * Returns transaction end time, result
 * (min) transaction lifetime (by default 72h or 4320min)
 * @param {string} creationDate date
 * @returns {boolean} true or false
 */
paypalHelper.isExpiredHonorPeriod = function(creationDate) {
    const min = 4320;

    // For testing after 3 mins reauthorize button appears.
    return Date.now() >= new Date(creationDate.replace('Z', '.000Z')).getTime() + min * 60000;
};

/**
 * Returns transaction payment status
 * @param  {Object} transactionResponse transaction details
 * @returns {string} payment status
 */
paypalHelper.getPaymentStatus = function(transactionResponse) {
    if (transactionResponse.status === constants.STATUS_VOIDED) {
        return constants.STATUS_CANCELLED;
    }

    const payments = transactionResponse.purchase_units[0].payments;

    let paymentStatus;

    if (payments.captures) {
        paymentStatus = payments.captures[0].status;
    } else {
        paymentStatus = payments.authorizations[0].status;
    }

    return paymentStatus;
};

/**
 * Returns Transaction Statistics of payment statuses
 * @returns {Object[]} an array with the number of orders for each payment status
 */
paypalHelper.getPaymentStatusTransactionStatistics = function() {
    let order;
    let status;

    const PPOrderMgrModel = require('~/cartridge/models/ppOrderMgr');

    const FAILED_STATUSES = constants.TRANSACTION_FAILED_STATUSES.slice();

    // to search for orders for which the value of the field is not set
    FAILED_STATUSES.push(null);

    const statuses = {};
    const orders = (new PPOrderMgrModel()).getAllOrders();
    const iterator = orders.iterator();

    while (iterator.hasNext()) {
        order = iterator.next();
        status = order.status || constants.NOT_APPLICABLE_SHORT;

        if (status in statuses) {
            statuses[status].count++;
        } else {
            statuses[status] = {
                count: 1,
                value: status,
                label: status === constants.NOT_APPLICABLE_SHORT ? constants.NOT_APPLICABLE_SHORT : paypalHelper.parseStatus(status),
                textColor: FAILED_STATUSES.includes(status) ? '#e31616' : '#000'
            };
        }
    }

    return statuses;
};

/**
 * Return an order
 * @param {string} orderNo Order number
 * @returns {dw.order.Order} Order instance
 */
paypalHelper.getOrderByOrderNo = function(orderNo) {
    return OrderMgr.searchOrder('orderNo = {0}', orderNo);
};

/**
 * @param {Object} requestData Request data to API call
 * @param {Object} responseData Response data to API call
 * @returns {void}
 */
paypalHelper.saveTransactionRequestAndResponse = function(requestData, responseData) {
    const order = paypalHelper.getOrderByOrderNo(requestData.orderNo);

    if (order) {
        const Transaction = require('dw/system/Transaction');

        Transaction.wrap(function() {
            const paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);

            paymentInstrument.custom.paypalRequest = JSON.stringify(requestData);
            paymentInstrument.custom.paypalResponse = JSON.stringify(responseData);
        });
    }
};

/**
 * Get transaction details for paypalTransactionHistory
 * @param {Object} transaction - Transaction data (request, response, amount, status)
 * @param {Object} transaction.request - Request data to API call
 * @param {Object} transaction.response - Response data from API call
 * @param {string} transaction.amount - Total amount
 * @param {string} transaction.status - Payment status
 * @returns {Object} - Transaction history details
 */
function getTransactionHistory(transaction) {
    const dateTime = new Date().toISOString();
    const methodName = transaction.request.methodName;
    const refundType = transaction.request.refundtype || '';

    const status = transaction.status;
    const amount = transaction.request.amt ? transaction.request.amt : transaction.amount;

    return {
        amount: amount,
        status: status,
        timestamp: dateTime,
        refundType: refundType,
        methodName: methodName
    };
}

/**
 * @param {dw.object.CustomObject|dw.order.PaymentInstrument} objectType - a system or custom object type
 * @param {Object} data - object (request, response, amount, status)
 * @returns {string} - a transaction history result
 */
paypalHelper.prepareTransactionHistory = function(objectType, data) {
    let transactionHistory = [];

    const paypalTransactionHistory = objectType.custom.paypalTransactionHistory;

    if (coreHelpers.isJson(paypalTransactionHistory)) {
        transactionHistory = JSON.parse(paypalTransactionHistory);
    }

    transactionHistory.push(getTransactionHistory(data));

    return JSON.stringify(transactionHistory);
};

/**
 * @param {Object} requestData Request data to API call
 * @param {Object} responseData Response data from API call
 * @returns {void}
 */
paypalHelper.saveTransactionHistory = function(requestData, responseData) {
    const order = paypalHelper.getOrderByOrderNo(requestData.orderNo);

    if (order) {
        const Transaction = require('dw/system/Transaction');
        const data = { request: requestData, response: responseData };

        Transaction.wrap(function() {
            const paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);
            const paymentTransaction = paymentInstrument.paymentTransaction;

            data.amount = order.totalGrossPrice.value;
            data.status = paymentInstrument.custom.paypalPaymentStatus;

            paymentTransaction.custom.paypalTransactionHistory = paypalHelper.prepareTransactionHistory(paymentTransaction, data);
        });
    }
};

/**
 * @param {string} paymentMethodId - The payment method ID
 * @returns {?dw.order.PaymentMethod} - Returns the payment method for the specified ID or null if no such method exists in the current site.
 */
paypalHelper.getPaymentMethod = function(paymentMethodId) {
    return require('dw/order/PaymentMgr').getPaymentMethod(paymentMethodId);
};

/**
 * Splits a full name into a separate first as well as a second name
 * We assume that first name is first part of full name and the rest is last name
 * @param {string} fullName A full name
 * @returns {Object} An object with first and last name
 */
paypalHelper.splitFullName = function(fullName) {
    const fullNameArray = fullName.split(/\s+/);

    return {
        firstName: fullNameArray.shift(),
        lastName: fullNameArray.join(' ')
    };
};

/**
 * Check if location is enabled for specif page
 * @param {string} targetPage location value
 * @param {string[]} sitePreference site preference
 * @return {boolean} enabled or disabled
 */
paypalHelper.isElementEnabled = function(targetPage, sitePreference) {
    if (empty(sitePreference) || !targetPage) {
        return false;
    }

    return sitePreference.filter(Boolean).map(function(value) {
        return value.toString().toLowerCase();
    }).includes(targetPage);
};

/**
 * Determines the active status of location based on site preferences.
 *
 * @param {string[]} locations - Array of locations.
 * @param {string[]} sitePreference - Site preference value.
 * @returns {Object} - Object with location as keys and their active status as values.
 */
paypalHelper.getPageVisibility = function(locations, sitePreference) {
    return locations.reduce(function(accum, location) {
        accum[location] = paypalHelper.isElementEnabled(location, sitePreference);

        return accum;
    }, {});
};

/**
 * @param {string} locale - a locale value
 * @returns {string} - return a locale with hyphen
 */
paypalHelper.getLocaleWithHyphen = function(locale) {
    const Site = require('dw/system/Site');

    let currentLocale = locale;

    if (currentLocale === 'default') {
        currentLocale = Site.current.defaultLocale;
    }

    if (currentLocale.split('_').length !== 2) {
        currentLocale = [currentLocale, currentLocale].join('-');
    }

    return currentLocale.toLowerCase().replace('_', '-');
};

/**
 * Sets styles for enabled locations or a specific location based on the provided parameters.
 * @param {Object} obj - The object where the styles will be applied.
 * @param {Object} parameters - Parameters defining locations and styles.
 * @param {dw.web.HttpParameterMap} parameters.hm - Object containing httpParameterMap settings for applying styles.
 * @param {Object} parameters.styles - The styles to be applied.
 * @param {Array<string>} parameters.locations - List of available locations.
 * @param {Object} parameters.customPreference - Custom preferences for determining page visibility.
 * @param {Object} parameters.alwaysVisiblePages - Pages that should always be active, e.g., { billing: true }.
 */
paypalHelper.setStylesForEnabledLocations = function(obj, parameters) {
    const { hm, styles, locations, customPreference, alwaysVisiblePages } = parameters;

    if (hm.applyToAll.booleanValue) {
        const pageVisibility = paypalHelper.getPageVisibility(locations, customPreference);

        Object.assign(pageVisibility, alwaysVisiblePages);

        Object.keys(pageVisibility).forEach(function(location) {
            if (pageVisibility[location]) {
                obj[location] = styles;
            }
        });
    } else {
        obj[hm.location.value] = styles;
    }
};

/**
 * Formats a payment method ID into a standardized display format.
 * @param {string} paymentMethodId - The payment method id to convert.
 * @returns {string} The readable payment method name or the original if not found.
 */
paypalHelper.getReadablePaymentMethod = function(paymentMethodId) {
    return constants.PAYMENT_METHODS_MAP.get(paymentMethodId) || paymentMethodId;
};

/**
 * Updates Paypal Pay Later Messaging styles
 * @param {Object} configs New configuration object
 */
paypalHelper.savePayLaterMessagingStyles = function(configs) {
    const pagesToUpdate = Object.keys(configs);

    if (pagesToUpdate.length) {
        const Transaction = require('dw/system/Transaction');

        const currentSite = require('dw/system/Site').current;
        const preferences = require('~/cartridge/config/preferences');

        const data = JSON.parse(preferences.buttonStyles.payLaterMessaging);

        pagesToUpdate.forEach(function(page) {
            data[page] = configs[page];
        });

        Transaction.wrap(function() {
            currentSite.setCustomPreferenceValue('PP_Pay_Later_Messaging_Styles', JSON.stringify(data));
        });
    }
};

module.exports = paypalHelper;
