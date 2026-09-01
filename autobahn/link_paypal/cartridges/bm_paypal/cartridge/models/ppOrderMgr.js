const ArrayList = require('dw/util/ArrayList');
const StringUtils = require('dw/util/StringUtils');
const PropertyComparator = require('dw/util/PropertyComparator');
const Calendar = require('dw/util/Calendar');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

const paymentInstrumentHelper = require('~/cartridge/scripts/paypal/paymentInstrumentHelpers');
const paypalHelper = require('~/cartridge/scripts/paypal/helpers');
const paypalUtils = require('~/cartridge/scripts/paypal/utils');
const ppConstants = require('~/cartridge/config/constants');

const PPOrderModel = require('~/cartridge/models/ppOrder');
const PPRestApiWrapper = require('~/cartridge/scripts/paypal/api/restApiWrapper');
const ppOrderModel = new PPOrderModel();
const ppRestApiWrapper = new PPRestApiWrapper();

/**
 * Returns a final formatted system orders object
 * @param {dw.order.Order} order An order object
 * @param {dw.order.PaymentInstrument} paymentInstrument An order payment instrument
 * @returns {Object} An object
 */
function getSystemOrderFinalObject(order, paymentInstrument) {
    const orderDate = new Date(order.creationDate);
    const paymentMethodId = paymentInstrumentHelper.getPaymentMethodId(paymentInstrument);

    return {
        orderToken: order.orderToken,
        orderNo: order.orderNo,
        orderDate: StringUtils.formatCalendar(new Calendar(orderDate), 'M/dd/yy h:mm a'),
        createdBy: order.createdBy,
        isRegistered: order.customer.registered,
        customer: order.customerName,
        email: order.customerEmail,
        orderTotal: order.totalGrossPrice,
        currencyCode: order.getCurrencyCode(),
        paypalAmount: paymentInstrument.getPaymentTransaction().getAmount(),
        paymentMethod: paypalHelper.getReadablePaymentMethod(paymentMethodId),
        status: paymentInstrument.custom.paypalPaymentStatus,
        disputeId: order.custom.paypalDisputeId,
        dateCompare: orderDate.getTime(),
        UUID: order.UUID
    };
}

/**
 * Returns Paypal orders by query
 * @param {string} orderNo An order number
 * @param {Object} dateRange Range of date (start, end)
 * @returns {dw.util.SeekableIterator} A special Iterator, which is returned by the system to iterate through large sets of data
 */
function getPayPalOrdersByQuery(orderNo, dateRange) {
    const ORDER_NUMBER_PAYPAL_METHOD_QUERY = [
        orderNo === '*' ? '' : 'orderNo LIKE {0}',
        'custom.paypalPaymentMethod = \'express\' AND status != {1}'
    ].filter(Boolean).join(' AND ');

    const ORDER_NUMBER_PAYPAL_METHOD_DATE_QUERY = [ORDER_NUMBER_PAYPAL_METHOD_QUERY, 'creationDate >= {2} AND creationDate <= {3}'].join(' AND ');

    const queryToUse = (dateRange && dateRange.start) ? ORDER_NUMBER_PAYPAL_METHOD_DATE_QUERY : ORDER_NUMBER_PAYPAL_METHOD_QUERY;

    return OrderMgr.searchOrders(
        queryToUse,
        'creationDate desc',
        orderNo,
        Order.ORDER_STATUS_FAILED,
        dateRange && dateRange.start,
        dateRange && dateRange.end);
}

/**
 * Return array of orders
 *
 * @param {string} orderNo Order number
 * @param {string} paymentStatus Payment status
 * @param {Object} dateRange Range of date (start, end)
 * @returns {dw.util.ArrayList} Combined array with all orders
 */
function getOrders(orderNo, paymentStatus, dateRange) {
    const orders = getPayPalOrdersByQuery(orderNo, dateRange);
    const ordersList = new ArrayList();

    const availablePaymentMethods = paymentInstrumentHelper.getPaymentMethodsIdWithPaypalProcessor();

    let order;
    let paymentInstrument;
    let obj;

    if (paymentStatus !== undefined && paymentStatus === ppConstants.NOT_APPLICABLE_SHORT) {
        paymentStatus = null;
    }

    try {
        while (orders.hasNext()) {
            order = orders.next();
            paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);

            if (!paymentInstrument) {
                continue;
            }

            if (!availablePaymentMethods.includes(paymentInstrument.paymentMethod)) {
                continue;
            }

            if (paymentStatus !== ppConstants.ALL_STATUSES
                && paymentStatus !== undefined
                && paymentInstrument.custom.paypalPaymentStatus !== paymentStatus) {
                continue;
            }

            obj = getSystemOrderFinalObject(order, paymentInstrument);

            ordersList.push(obj);
        }
    } finally {
        orders.close();
    }

    ordersList.sort(new PropertyComparator('dateCompare', false));

    return ordersList;
}

/**
 * Updates order and custom paypal payment status
 * @param {string} orderNo Order number
 * @param {string} orderToken Order token
 */
function updateOrderStatus(orderNo, orderToken) {
    const order = OrderMgr.getOrder(orderNo, orderToken);
    const paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);
    const paymentInstrumentCustomEl = paymentInstrument.getCustom();
    const transactionDetailsResult = ppRestApiWrapper.getOrderDetails(paymentInstrumentCustomEl.paypalOrderID);

    if (transactionDetailsResult.err) {
        paypalUtils.createErrorLog(transactionDetailsResult.responseData);

        throw new Error(Resource.msg('transaction.details.error', 'errors', null));
    }

    const paymentStatus = paypalHelper.getPaymentStatus(transactionDetailsResult);

    paymentInstrument.custom.paypalPaymentStatus = paymentStatus;

    if (paymentStatus === ppConstants.STATUS_COMPLETED || paymentStatus === ppConstants.STATUS_REFUNDED) {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    }
}

/**
 * PP Order Mgr Model
 */
function OrderMgrModel() { }

/**
 * @param {string} orderNo order number
 * @returns {dw.util.ArrayList} orders list
 */
OrderMgrModel.prototype.getOrderByOrderNo = function(orderNo) {
    return getOrders(orderNo);
};

/**
 * @param {string} transactionId transaction id
 * @returns {dw.util.ArrayList} orders list
 */
OrderMgrModel.prototype.getOrderByTransactionId = function(transactionId) {
    let orderNo;

    const PAYPAL_METHOD_TRANSACTION_QUERY = 'custom.paypalPaymentMethod = \'express\' AND custom.PP_API_TransactionID LIKE {0} AND status != {1}';
    const orders = OrderMgr.searchOrders(
        PAYPAL_METHOD_TRANSACTION_QUERY,
        'creationDate desc',
        transactionId,
        Order.ORDER_STATUS_FAILED);

    if (orders.count) {
        orderNo = new ArrayList(orders).toArray()[0].orderNo;
    }

    return getOrders(orderNo);
};

/**
 * @returns {dw.util.ArrayList} orders list
 * @param {Object} dateRange Range of date (start, end)
 */
OrderMgrModel.prototype.getAllOrders = function(dateRange) {
    const paymentStatus = ppConstants.ALL_STATUSES;

    return getOrders('*', paymentStatus, dateRange);
};

/**
 * @param {string} paymentStatus payment status
 * @param {Object} dateRange Range of date (start, end)
 * @returns {dw.util.ArrayList} orders list
 */
OrderMgrModel.prototype.getOrderByPaymentStatus = function(paymentStatus, dateRange) {
    return getOrders('*', paymentStatus, dateRange);
};

/**
 * @param {string} paymentMethod payment method
 * @param {Object} dateRange Range of date (start, end)
 * @returns {dw.util.ArrayList} orders list
 */
OrderMgrModel.prototype.getOrdersByPaymentMethod = function(paymentMethod, dateRange) {
    const ordersList = new ArrayList();
    const orders = getPayPalOrdersByQuery('*', dateRange);
    const isLPM = paymentMethod === ppConstants.LOCAL_PAYMENT_METHOD_ABBR;

    let order;
    let paymentInstruments;

    try {
        while (orders.hasNext()) {
            order = orders.next();

            if (isLPM) {
                paymentInstruments = order.getPaymentInstruments();
            } else {
                paymentInstruments = order.getPaymentInstruments(paymentMethod);
            }

            paymentInstruments = paymentInstruments.toArray().filter(function(paymentInstrument) {
                const isLocalPaymentMethod = ppConstants.LIST_OF_LOCAL_PAYMENT_METHODS.includes(paymentInstrument.custom.paymentId);

                return isLPM ? isLocalPaymentMethod : !isLocalPaymentMethod;
            });

            if (paymentInstruments.length) {
                ordersList.push(getSystemOrderFinalObject(order, paymentInstruments[0]));
            }
        }
    } finally {
        orders.close();
    }

    ordersList.sort(new PropertyComparator('dateCompare', false));

    return ordersList;
};

/**
 * @param {string} orderNo Order number
 * @param {string} orderToken OrderToken
 * @returns {Object} (transactionIdFromOrder: String - Transaction ID from order, order: dw.object.CustomObject - Custom Object that matched with order number)
 */
OrderMgrModel.prototype.getOrderData = function(orderNo, orderToken) {
    let order;
    let transactionIdFromOrder;

    try {
        order = OrderMgr.getOrder(orderNo, orderToken);
        transactionIdFromOrder = ppOrderModel.getTransactionIdFromOrder(order);

        if (!order || !transactionIdFromOrder) {
            throw new Error();
        }
    } catch (error) {
        paypalUtils.createErrorLog(error);

        throw new Error();
    }

    return {
        order: order,
        transactionIdFromOrder: transactionIdFromOrder
    };
};

/**
 * Updates order/custom order payment status
 * @param {string} orderNo order number
 * @param {string} orderToken Order Token
 * @returns {boolean} true in case of success and false when error
 */
OrderMgrModel.prototype.updateOrderData = function(orderNo, orderToken) {
    try {
        Transaction.wrap(function() {
            updateOrderStatus(orderNo, orderToken);
        });
    } catch (error) {
        paypalUtils.createErrorLog(error);

        return false;
    }

    return true;
};

/**
 * Add order notes regarding capture action
 * @param {dw.order.Order} order - The order object to add notes to.
 * @param {number} captureAmount - Total captured amount
 */
OrderMgrModel.prototype.addOrderNotes = function(order, captureAmount) {
    const subject = Resource.msg('capture.order.note.subject', 'paypalbm', null);
    const text = Resource.msgf(
        'capture.order.note.text', 'paypalbm', null, order.totalGrossPrice.value, captureAmount
    );

    Transaction.wrap(function() {
        order.addNote(subject, text);
    });
};

module.exports = OrderMgrModel;
