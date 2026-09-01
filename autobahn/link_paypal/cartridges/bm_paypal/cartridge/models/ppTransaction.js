'use strict';

const Money = require('dw/value/Money');

const ppConstants = require('~/cartridge/config/constants');
const coreHelpers = require('*/cartridge/scripts/helpers/coreHelpers');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers');
const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/paymentInstrumentHelpers');
const prefs = require('~/cartridge/config/preferences');

/**
 * Returns shippingAmount and taxAmount
 * @param {Object} amountBreakdown transaction.purchase_units[0].amount.breakdown
 * @param {dw.order.Order} order current order
 * @returns {Object} shippingAmount and taxAmount
 */
function getTaxAndShippingAmount(amountBreakdown, order) {
    const zeroAmount = 0;

    let shippingAmount;
    let taxAmount;

    if (amountBreakdown) {
        shippingAmount = amountBreakdown.shipping && amountBreakdown.shipping.value;
        taxAmount = amountBreakdown.tax_total ? amountBreakdown.tax_total.value : zeroAmount;
    } else {
        shippingAmount = order.shippingTotalPrice.value;
        taxAmount = order.totalTax.value;
    }

    return {
        shippingAmount: shippingAmount,
        taxAmount: taxAmount
    };
}

/**
 * Returns transaction id for transaction details view
 * @param {Object} payments transaction.purchase_units[0].payments
 * @param {string} transactionIdFromReq request.httpParameterMap.transactionId.stringValue
 * @returns {string} transaction id
 */
function getTransactionId(payments, transactionIdFromReq) {
    let transactionId;

    if (!empty(payments.captures) && !empty(transactionIdFromReq)) {
        transactionId = transactionIdFromReq;
    } else if (!empty(payments.authorizations)) {
        transactionId = payments.authorizations[0].id;
    } else {
        transactionId = payments.captures[0].id;
    }

    return transactionId;
}

/**
 * Sets refund-related amounts and refund button flag
 * @param {Object} options - options
 * @param {Object} options.payments purchaseUnits.payments
 * @param {string} options.transactionIdFromReq string value of transaction id
 * @param {Object} options.amount purchaseUnits.amount
 * @param {string} options.currencyCode amount.currency_code
 * @returns {Object} data object containing a value for isRefundButtonAllowed, refundedAmount and restRefundAmount
 */
function setRefundRelatedAmounts(options) {
    const { payments, transactionIdFromReq, amount, currencyCode } = options;

    let refund;
    let isRefundButtonAllowed;
    let refundedAmount;
    let restRefundAmount;

    if (!empty(payments.refunds)) {
        refund = payments.refunds;
        // id of extra transaction, for example, capture transaction (not main transaction)
        if (!empty(transactionIdFromReq)) {
            refund = refund.filter(function(element) {
                const url = element.links[1].href;
                const captureID = url.substring(url.lastIndexOf('/') + 1);

                return captureID === transactionIdFromReq;
            });

            isRefundButtonAllowed = false;
        }

        refundedAmount = refund.reduce(function(prev, curr) {
            const prevAmt = new Money(parseFloat(prev), currencyCode);
            const currAmt = new Money(parseFloat(curr.amount.value), currencyCode);

            return (prevAmt.add(currAmt)).getValue();
        }, 0);

        restRefundAmount = (new Money(parseFloat(amount.value),
            currencyCode).subtract(new Money(parseFloat(refundedAmount), currencyCode))).getValue();
    }

    return {
        isRefundButtonAllowed: isRefundButtonAllowed,
        refundedAmount: refundedAmount,
        restRefundAmount: restRefundAmount
    };
}

/**
 * Sets capture related amounts and capture button flag
 * @param {Object} params data object containing transaction, payments, captures, transactionIdFromReq, amount, currencyCode and refundedAmount
 * @returns {Object} data object with values for capturedAmount, paymentStatus, captureID, isCaptureButtonAllowed, restCaptureAmount, refundedAmount and restRefundAmount
 */
function setCaptureRelatedAmounts(params) {
    const isCaptureStatus = params.transaction.intent === ppConstants.INTENT_CAPTURE
        && params.transaction.status === ppConstants.STATUS_COMPLETED
        && !params.payments.authorizations;

    let capture;
    let capturedAmount;
    let captureID;
    let isCaptureButtonAllowed;
    let restCaptureAmount;
    let refundedAmount;
    let restRefundAmount;

    let paymentStatus = isCaptureStatus ? params.captures[0].status : params.payments.authorizations[0].status;

    if (!empty(params.captures)) {
        // id of extra transaction, for example, capture transaction (not main transaction)
        if (!empty(params.transactionIdFromReq)) {
            capture = params.captures.filter(function(element) {
                return element.id === params.transactionIdFromReq;
            });

            capturedAmount = capture[0].amount.value;
            paymentStatus = capture[0].status;
            captureID = capture[0].id;
            isCaptureButtonAllowed = false;
        // Handled case for the main transaction that was created with payment action 'Sale'
        } else if (empty(params.transactionIdFromReq) && isCaptureStatus) {
            capturedAmount = params.captures[0].amount.value;
            isCaptureButtonAllowed = false;
        } else {
            capturedAmount = params.captures.reduce(function(prev, curr) {
                const prevAmt = new Money(parseFloat(prev), params.currencyCode);
                const currAmt = new Money(parseFloat(curr.amount.value), curr.amount.currency_code);

                return (prevAmt.add(currAmt)).getValue();
            }, 0);

            restCaptureAmount = (new Money(parseFloat(params.amount.value), params.currencyCode)
                .subtract(new Money(parseFloat(capturedAmount), params.currencyCode))).getValue();
        }

        refundedAmount = params.refundedAmount || 0.00;
        restRefundAmount = (new Money(parseFloat(capturedAmount), params.currencyCode)
            .subtract(new Money(parseFloat(refundedAmount), params.currencyCode))).getValue();
    }

    return {
        capturedAmount: capturedAmount,
        paymentStatus: paymentStatus,
        captureID: captureID,
        isCaptureButtonAllowed: isCaptureButtonAllowed,
        restCaptureAmount: restCaptureAmount,
        refundedAmount: refundedAmount,
        restRefundAmount: restRefundAmount
    };
}

/**
 * @param {Object} paymentInstrument data object
 * @returns {Object} data object with values for paypalRequest & paypalResponse
 */
function setPaypalRequestAndResponseFromPI(paymentInstrument) {
    const paypalRequestFromPI = paymentInstrument.custom.paypalRequest;
    const paypalResponseFromPI = paymentInstrument.custom.paypalResponse;

    return {
        paypalRequest: paypalRequestFromPI ? JSON.parse(paypalRequestFromPI) : null,
        paypalResponse: paypalResponseFromPI ? JSON.parse(paypalResponseFromPI) : null
    };
}

/**
 * @param {Object} paymentInstrument data object
 * @returns {Object[]} data object with values for paypalTransactionHistory
 */
function getPaypalTransactionHistory(paymentInstrument) {
    const paypalTransactionHistory = paymentInstrument.paymentTransaction.custom.paypalTransactionHistory;

    if (coreHelpers.isJson(paypalTransactionHistory)) {
        return JSON.parse(paypalTransactionHistory).reverse();
    }

    return [];
}

/**
 * PP Transaction Model
 * @param {Object} transaction transaction data
 * @param {dw.order.OrderMgr} order current order
 */
function TransactionModel(transaction, order) {
    const self = this;
    const whiteSpace = 8;
    const paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);
    const transactionIdFromReq = request.httpParameterMap.transactionId.stringValue;
    const purchaseUnits = transaction.purchase_units[0];
    const amount = purchaseUnits.amount;

    let paypalRequest;
    let paypalResponse;
    let paymentMethod;
    let paypalTransactionHistory = [];
    let payments = purchaseUnits.payments;

    if (!payments) {
        payments = {
            id: purchaseUnits.id,
            status: transaction.status
        };
    }

    const amountBreakdown = purchaseUnits.amount.breakdown;
    const currencyCode = amount.currency_code;
    const captures = payments.captures;
    const timeCreateUpdate = !empty(transaction.create_time) ? transaction.create_time : transaction.update_time;
    const transactionId = getTransactionId(payments, transactionIdFromReq);
    const { taxAmount, shippingAmount } = getTaxAndShippingAmount(amountBreakdown, order);

    Object.keys(transaction).forEach(function(property) {
        self[property] = transaction[property];
    });

    this.isCaptureButtonAllowed = true;

    // set refund related amounts and refund button flag
    const refundRelatedAmounts = setRefundRelatedAmounts({
        payments: payments,
        transactionIdFromReq: transactionIdFromReq,
        amount: amount,
        currencyCode: currencyCode
    });

    Object.keys(refundRelatedAmounts)
        .filter(function(key) {
            return !!refundRelatedAmounts[key];
        })
        .forEach(function(key) {
            self[key] = refundRelatedAmounts[key];
        });

    // set capture related amounts and capture button flag
    const captureRelatedAmounts = setCaptureRelatedAmounts({
        transaction: transaction,
        payments: payments,
        captures: captures,
        transactionIdFromReq: transactionIdFromReq,
        amount: amount,
        currencyCode: currencyCode,
        refundedAmount: this.refundedAmount
    });

    Object.keys(captureRelatedAmounts)
        .filter(function(key) {
            return captureRelatedAmounts[key] !== undefined && key !== 'paymentStatus';
        })
        .forEach(function(key) {
            self[key] = captureRelatedAmounts[key];
        });

    this.captures = !empty(captures) ? captures : [];
    this.purchaseUnits = purchaseUnits;

    // customer data
    this.setCustomerData(transaction, order);

    // amount related
    this.amt = amount.value;
    this.currencycode = currencyCode;
    this.shippingAmount = shippingAmount;
    this.taxAmount = taxAmount;
    // ids
    this.invnum = purchaseUnits.invoice_id;
    this.mainTransactionId = transaction.id;
    this.transactionid = transactionId;
    this.authorizationId = !empty(payments.authorizations) && payments.authorizations[0].id;
    // order related
    this.order = order;
    this.orderTimeCreated = transaction.create_time ? paypalHelper.formattedDate(transaction.create_time) : '';
    this.orderTimeUpdated = transaction.update_time ? paypalHelper.formattedDate(transaction.update_time) : '';
    this.paymentstatus = captureRelatedAmounts.paymentStatus;
    // flags
    this.isCaptured = this.capturedAmount === amount.value;
    this.isExpiredHonorPeriod = paypalHelper.isExpiredHonorPeriod(timeCreateUpdate);

    if (paymentInstrument) {
        const paypalRequestAndResponseFromPI = setPaypalRequestAndResponseFromPI(paymentInstrument);

        paypalRequest = paypalRequestAndResponseFromPI.paypalRequest;
        paypalResponse = paypalRequestAndResponseFromPI.paypalResponse;
        paypalTransactionHistory = getPaypalTransactionHistory(paymentInstrument);
        paymentMethod = paypalHelper.getReadablePaymentMethod(
            paymentInstrumentHelper.getPaymentMethodId(paymentInstrument)
        );
    }

    this.paypalRequest = empty(paypalRequest) ? '' : JSON.stringify(paypalRequest, null, whiteSpace);
    this.paypalResponse = empty(paypalResponse) ? '' : JSON.stringify(paypalResponse, null, whiteSpace);
    this.isTransactionLogEnabled = prefs.isTransactionLogEnabled;
    this.paypalTransactionHistory = paypalTransactionHistory;
    this.paymentMethod = paymentMethod || null;
}

/**
 * Sets the customer data
 * @param {Object} transaction transaction data
 * @param {Object} order order data
 */
TransactionModel.prototype.setCustomerData = function(transaction, order) {
    if (transaction.payer) {
        this.firstname = transaction.payer.name.given_name;
        this.lastname = transaction.payer.name.surname;
        this.email = transaction.payer.email_address || ppConstants.UNKNOWN;
    } else {
        const shippingCustomerName = transaction.purchase_units[0].shipping ? transaction.purchase_units[0].shipping.name.full_name : null;
        const fullName = paypalHelper.splitFullName(shippingCustomerName || order.customerName);

        this.firstname = fullName.firstName;
        this.lastname = fullName.lastName;
        this.email = ppConstants.NOT_APPLICABLE;
    }
};

module.exports = TransactionModel;
