'use strict';

/**
 * @namespace PaypalAdmin
 */

const server = require('server');

const Resource = require('dw/web/Resource');

const constants = require('*/cartridge/config/constants');
const paypalUtils = require('*/cartridge/scripts/paypal/utils');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers');
const coreHelpers = require('*/cartridge/scripts/helpers/coreHelpers');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

const Paging = require('*/cartridge/models/ppPaging');
const PPOrderMgrModel = require('*/cartridge/models/ppOrderMgr');
const PPTransactionMgrModel = require('*/cartridge/models/ppTransactionMgr');
const PPTransactionModel = require('*/cartridge/models/ppTransaction');
const PPTransactionActions = require('*/cartridge/models/ppTransactionActions');

const hm = request.httpParameterMap;
const PAYPAL_SERVER_ERROR = 'paypalbm/components/serverError';
const ppTransactionActions = new PPTransactionActions();

/**
 * Get an order list.
 * Can be filtered by order number or transaction ID
 * @returns {Function} template render function call with required data
 */
server.get('Orders', server.middleware.https, function(req, res, next) {
    let stats;
    let pagingModel;
    let pagingModelParameters;
    let ordersList;

    let isSearchByPaymentStatus = false;
    let isSearchByOrderNo = false;
    let isSearchByTransaction = false;
    let isSearchByPaymentMethod = false;

    const { dateFrom, dateTo } = coreHelpers.getPeriod(hm);

    const dateRange = {
        start: new Date(dateFrom),
        end: new Date(dateTo)
    };

    dateRange.start.setHours(
        constants.HOURS_START_OF_PERIOD,
        constants.MINUTES_START_OF_PERIOD,
        constants.SECONDS_START_OF_PERIOD
    );

    dateRange.end.setHours(
        constants.HOURS_END_OF_PERIOD,
        constants.MINUTES_END_OF_PERIOD,
        constants.SECONDS_END_OF_PERIOD
    );

    const ppOrderMgrModel = new PPOrderMgrModel();
    const paging = new Paging();

    try {
        // if search query inputs are empty, get a full orders list
        if (paypalHelper.isSearchQueryEmpty(hm)) {
            ordersList = ppOrderMgrModel.getAllOrders(dateRange);
        } else {
            // define a search type based on the submitted search query
            const searchType = paypalHelper.getSearchType(hm.transactionId, hm.paymentStatus, hm.paymentMethod);

            switch (searchType) {
                case constants.SEARCH_BY_TRANSACTION_ID:
                    isSearchByTransaction = true;

                    ordersList = ppOrderMgrModel.getOrderByTransactionId(hm.transactionId.stringValue);

                    break;
                case constants.SEARCH_BY_ORDER_NUMBER:
                    isSearchByOrderNo = true;

                    ordersList = ppOrderMgrModel.getOrderByOrderNo(hm.orderNo.stringValue);

                    break;
                case constants.SEARCH_BY_PAYMENT_STATUS:
                    isSearchByPaymentStatus = true;

                    ordersList = ppOrderMgrModel.getOrderByPaymentStatus(hm.paymentStatus.stringValue, dateRange);

                    break;
                case constants.SEARCH_BY_PAYMENT_METHOD:
                    isSearchByPaymentMethod = true;

                    ordersList = ppOrderMgrModel.getOrdersByPaymentMethod(hm.paymentMethod.stringValue, dateRange);

                    break;
                default:
                    break;
            }
        }

        pagingModel = paging.createPagingModel(ordersList, hm.page, hm.pagesize);
        pagingModelParameters = paging.createPagingModelParameters(pagingModel, hm);

        stats = paypalHelper.getPaymentStatusTransactionStatistics();
    } catch (error) {
        paypalUtils.createErrorLog(error);

        res.render(PAYPAL_SERVER_ERROR);

        return next();
    }

    // set which tab must be shown in case of first list render
    if (!isSearchByOrderNo && !isSearchByTransaction && !isSearchByPaymentStatus && !isSearchByPaymentMethod) {
        isSearchByPaymentStatus = true;
    }

    const paymentStatuses = constants.TRANSACTION_STATUSES
        .map(function(paymentStatus) {
            return { value: paymentStatus, label: paypalHelper.parseStatus(paymentStatus) };
        }).sort(function(prevPaymentStatus, nextPaymentStatus) {
            return prevPaymentStatus.value > nextPaymentStatus.value ? 1 : -1;
        });

    paymentStatuses.push({
        value: constants.NOT_APPLICABLE_SHORT,
        label: constants.NOT_APPLICABLE_SHORT
    });

    const paymentMethods = constants.ALLOWED_PAYMENT_METHODS.slice();

    paymentMethods.push({
        value: constants.LOCAL_PAYMENT_METHOD_ABBR,
        label: constants.LOCAL_PAYMENT_METHODS_FULL
    });

    res.render('paypalbm/orderList', {
        dateTo: dateTo,
        dateFrom: dateFrom,
        PagingModel: pagingModel,
        paymentStatuses: paymentStatuses,
        paymentMethods: paymentMethods,
        stats: JSON.stringify(stats),
        availabilityOfStats: Object.keys(stats).length > 0,
        isSearchByOrderNo: isSearchByOrderNo,
        isSearchByTransaction: isSearchByTransaction,
        isSearchByPaymentStatus: isSearchByPaymentStatus,
        isSearchByPaymentMethod: isSearchByPaymentMethod,
        pagingModelParameters: pagingModelParameters,
        urls: require('~/cartridge/config/urls'),
        shortcuts: {
            'this-year': Resource.msg('search.shortcut.thisyear', 'paypalbm', null),
            'this-month': Resource.msg('search.shortcut.thismonth', 'paypalbm', null),
            'last-month': Resource.msg('search.shortcut.lastmonth', 'paypalbm', null),
            'past-thirty-days': Resource.msg('search.shortcut.pastthirtydays', 'paypalbm', null),
            'today': Resource.msg('search.shortcut.today', 'paypalbm', null)
        }
    });

    return next();
});

/**
 * Get order transaction details
 * @returns {Function} template render function call with required data
 */
server.get('OrderTransaction', server.middleware.https, function(req, res, next) {
    let ppTransactionModel;

    const ppOrderMgrModel = new PPOrderMgrModel();
    const ppTransactionMgrModel = new PPTransactionMgrModel();

    try {
        const { order, transactionIdFromOrder } = ppOrderMgrModel.getOrderData(hm.orderNo.stringValue, hm.orderToken.stringValue);

        const transaction = ppTransactionMgrModel.getTransactionData(hm, transactionIdFromOrder);

        // expand the transaction object with required data for actions and transaction view
        ppTransactionModel = new PPTransactionModel(transaction, order);
    } catch (error) {
        res.render(PAYPAL_SERVER_ERROR, { errorMessage: error.message });

        return next();
    }

    res.render('paypalbm/orderTransaction', {
        transaction: ppTransactionModel
    });

    return next();
});

/**
 * Do some action, like DoCapture, DoRefund and etc
 * @returns {Function} template render function call with required data
 */
server.post('Action',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        const reqData = {};

        let callApiResponse = {};
        let responseResult = 'Success';

        const methodName = hm.methodName.stringValue;

        hm.parameterNames.toArray().forEach(function(name) {
            reqData[name] = hm[name].toString();
        });

        switch (methodName) {
            case constants.ACTION_VOID:
                callApiResponse = ppTransactionActions.voidAction(reqData);

                break;
            case constants.ACTION_REAUTHORIZE:
                callApiResponse = ppTransactionActions.reauthorizeAction(reqData);

                break;
            case constants.ACTION_REFUND:
                callApiResponse = ppTransactionActions.refundTransactionAction(reqData);

                break;
            case constants.ACTION_CAPTURE:
                callApiResponse = ppTransactionActions.captureAction(reqData);

                break;
            default:
                break;
        }

        paypalHelper.saveTransactionRequestAndResponse(reqData, callApiResponse);

        if (!callApiResponse.err) {
            paypalHelper.saveTransactionHistory(reqData, callApiResponse);
        }

        if (callApiResponse.err) {
            responseResult = 'Error';
        }

        const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/paymentInstrumentHelpers');

        paymentInstrumentHelper.updatePaypalPaymentInstrument(hm);

        res.json({
            result: responseResult,
            details: callApiResponse.responseData
        });

        next();
    }
);

server.get('RedirectToOrderPayment', server.middleware.https, function(req, res, next) {
    const URLUtils = require('dw/web/URLUtils');
    const Order = require('dw/order/Order');
    const OrderMgr = require('dw/order/OrderMgr');

    const order = OrderMgr.getOrder(hm.orderNo.stringValue, hm.orderToken.stringValue);

    if (order && order.status.value === Order.ORDER_STATUS_NEW) {
        const Transaction = require('dw/system/Transaction');

        Transaction.wrap(function() {
            order.setStatus(Order.ORDER_STATUS_OPEN);
        });
    }

    const orderUUID = order.UUID || hm.orderUUID.stringValue;

    res.redirect(URLUtils.url('ViewOrder_52-ViewOrderPayment', 'OrderID', orderUUID));

    next();
});

module.exports = server.exports();
