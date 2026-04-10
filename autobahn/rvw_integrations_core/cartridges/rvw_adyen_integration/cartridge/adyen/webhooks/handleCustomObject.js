"use strict";

var base = module.superModule;

var PaymentMgr = require('dw/order/PaymentMgr');
var Order = require('dw/order/Order');

// script includes
var constants = require('*/cartridge/adyen/config/constants');
var adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle(customObj) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var refusedHpp = false;
    var pending = false;
    var result = {};
    result.status = PIPELET_ERROR;
    result.EventCode = customObj.custom.eventCode;
    result.SubmitOrder = false;
    result.SkipOrder = false;

    // split order ID by - and remove last split (which is the date)
    var orderIdParts = customObj.custom.orderId.split('-');
    orderIdParts.pop();
    // in case the splitted array contains more than 1 element (DONATION case), get only the last split (which is the order number)
    var relevantOrderIdParts = orderIdParts.length > 1 ? orderIdParts.slice(-1) : orderIdParts;
    var orderId = relevantOrderIdParts.join('-');
    var order = OrderMgr.getOrder(orderId);
    result.Order = order;
    if (order === null) {
        // check to see if this was a $0.00 auth for recurring payment. if yes, CO can safely be deleted
        if (orderId.indexOf('recurringPayment') > -1) {
            result.SkipOrder = true;
            module.exports.setProcessedCOInfo(customObj);
        } else {
            AdyenLogs.error_log( `Notification for not existing order ${customObj.custom.orderId} received.`,);
        }
        return result;
    }
    var isAdyen = false;
    var orderCreateDate = order.creationDate;
    var orderCreateDateDelay = module.exports.createDelayOrderDate(orderCreateDate);
    var currentDate = new Date();
    var reasonCode = 'reason' in customObj.custom && !empty(customObj.custom.reason) ? customObj.custom.reason.toUpperCase() : null;
    AdyenLogs.debug_log( `Order date ${orderCreateDate} , orderCreateDateDelay ${orderCreateDateDelay} , currentDate ${currentDate}`,);
    if (orderCreateDateDelay < currentDate) {
        switch (customObj.custom.eventCode) {
            case 'AUTHORISATION':
              // Check if one of the adyen payment methods was used during payment
              // Or if the payment method belongs to adyen payment processors
                var paymentInstruments = order.getPaymentInstruments();
                var adyenPaymentInstrument = null;
                var fraudManualReview = 'false';
                var fraudResultType = 'GREEN';
                // for (var pi in paymentInstruments) {
                //     if ([constants.METHOD_ADYEN, constants.METHOD_ADYEN_POS, constants.METHOD_ADYEN_COMPONENT, constants.METHOD_CREDIT_CARD].indexOf(paymentInstruments[pi].paymentMethod) !== -1 || [constants.PAYMENT_INSTRUMENT_ADYEN_CREDIT, constants.PAYMENT_INSTRUMENT_ADYEN_POS, constants.PAYMENT_INSTRUMENT_ADYEN_COMPONENT].indexOf(PaymentMgr.getPaymentMethod(paymentInstruments[pi].getPaymentMethod()).getPaymentProcessor().ID) !== -1) {
                //         isAdyen = true;
                //         // Move adyen log request to order payment transaction
                //         paymentInstruments[pi].paymentTransaction.custom.Adyen_log = customObj.custom.Adyen_log;
                //         adyenPaymentInstrument = paymentInstruments[pi];
                //     }
                // }
                // var paymentInstruments = order.getPaymentInstruments();
                // var adyenPaymentInstrument = null;
                var isAdyen = false;

                for (var it = paymentInstruments.iterator(); it.hasNext();) {
                    var pi = it.next();
                    var paymentMethodID = pi.getPaymentMethod();
                    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodID);

                    if (
                        [constants.METHOD_ADYEN, constants.METHOD_ADYEN_POS, constants.METHOD_ADYEN_COMPONENT, constants.METHOD_CREDIT_CARD].indexOf(paymentMethodID) !== -1 ||
                        (paymentMethod && [constants.PAYMENT_INSTRUMENT_ADYEN_CREDIT, constants.PAYMENT_INSTRUMENT_ADYEN_POS, constants.PAYMENT_INSTRUMENT_ADYEN_COMPONENT]
                            .indexOf(paymentMethod.getPaymentProcessor().ID) !== -1)
                    ) {
                        isAdyen = true;
                        // Move adyen log request to order payment transaction
                        pi.paymentTransaction.custom.Adyen_log = customObj.custom.Adyen_log;
                        adyenPaymentInstrument = pi;
                    }
                }

                if (!adyenPaymentInstrument) {
                    AdyenLogs.error_log( `Notification for order ${customObj.custom.orderId} without Adyen payment instrument received.`,);
                    result.SkipOrder = true;
                    result.status = PIPELET_NEXT;
                    return result;
                } else if (customObj.custom.success === 'true') {
                    var amountPaid = parseFloat(customObj.custom.value);
                    var totalAmount = adyenHelper.getCurrencyValueForApi(adyenPaymentInstrument.getPaymentTransaction().getAmount()).value;
                    if (order.paymentStatus.value === Order.PAYMENT_STATUS_PAID) {
                        AdyenLogs.info_log( `Duplicate callback received for order ${order.orderNo}.`,);
                    } else if (amountPaid < totalAmount) {
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
                        AdyenLogs.info_log( `Partial amount ${customObj.custom.value} received for order number ${order.orderNo} with total amount ${totalAmount}`,);
                    } else {
                        var adyenFraudEnabled = dw.system.Site.current.getCustomPreferenceValue('adyenFraudEnabled');
                        var autoFailEnabled = dw.system.Site.current.getCustomPreferenceValue('adyenFraudFailOnFraud');
                        var autoReviewEnabled = dw.system.Site.current.getCustomPreferenceValue('adyenFraudReviewOnManualFlag');
                        if (!adyenFraudEnabled
                            || ((!autoFailEnabled || fraudResultType === 'GREEN')
                                && (!autoReviewEnabled || (fraudManualReview === 'false' && fraudResultType === 'GREEN')))) {
                            result.PlaceOrder = true;
                            //AUTOBAHN MOD place the order in notification.js
                            /* var placeOrderResult = placeOrder(order); */
                            /* if (!placeOrderResult.error) { */
                            /*    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID); */
                            /*    order.setExportStatus(Order.EXPORT_STATUS_READY); */
                            /*    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED); */
                            /*    AdyenLogs.info_log( `Order ${order.orderNo} updated to status PAID.`,); */
                            //result.SubmitOrder = true; // Turn off secondary order confirmation email by default, we send one of these in regular checkout already
                            /* } */
                        } else {
                            AdyenLogs.info_log( `Order ${order.orderNo} authorization update received but no action take due to pending fraud review`,);
                        }
                    }
                    order.custom.Adyen_eventCode = customObj.custom.eventCode;
                    order.custom.Adyen_value = amountPaid.toString();
                } else {
                    AdyenLogs.info_log( `Authorization for order ${order.orderNo} was not successful - no update.`,);
                    // Determine if payment was refused and was used Adyen payment method
                    if (!empty(reasonCode) && (reasonCode === 'REFUSED' || reasonCode.indexOf('FAILED') > -1) && isAdyen) {
                        refusedHpp = true;
                    } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
                        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                        order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
                    }
                }
                break;
            case 'CANCELLATION':
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                order.trackOrderChange('CANCELLATION notification received');
                AdyenLogs.info_log( `Order ${order.orderNo} was cancelled.`,);
                break;
            case 'CANCEL_OR_REFUND':
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                order.trackOrderChange('CANCEL_OR_REFUND notification received');
                AdyenLogs.info_log( `Order ${order.orderNo} was cancelled or refunded.`,);
                break;
            case 'DONATION':
                if (customObj.custom.success === 'true') {
                    order.custom.Adyen_donationAmount = parseFloat(customObj.custom.value);
                } else {
                    AdyenLogs.info_log("Donation failed for order ".concat(order.orderNo));
                }
                break;
            case 'REFUND':
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                order.trackOrderChange('REFUND notification received');
                AdyenLogs.info_log( `Order ${order.orderNo} was refunded.`,);
                break;
                // CustomAdyen
            case 'CAPTURE_FAILED':
                if (customObj.custom.success === 'true') {
                    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                    order.trackOrderChange('Capture failed, cancelling order');
                    //RVW MODIFICATION account for order that is already placed
                    Transaction.wrap(function() {
                        if (order.status === Order.ORDER_STATUS_CREATED) {
                            OrderMgr.failOrder(order, false);
                        } else {
                            OrderMgr.cancelOrder(order);
                        }
                    })
                }
                AdyenLogs.info_log( `Capture Failed for order ${order.orderNo}`,);
                break;
            case 'ORDER_OPENED':
                if (customObj.custom.success === 'true') {
                    AdyenLogs.info_log( `Order ${order.orderNo} opened for partial payments`,);
                }
                break;
            case 'ORDER_CLOSED':
                // Placing the order for partial paymetns once OFFER_CLOSED webhook came, and the total amount matches order amount
                var totalAmount = adyenHelper.getCurrencyValueForApi(order.getTotalGrossPrice()).value;
                if (customObj.custom.success === 'true' && parseFloat(customObj.custom.value) === parseFloat(totalAmount)) {
                    result.PlaceOrder = true;
                    //AUTOBAHN MOD place the order in notification.js
                    // var _placeOrderResult = placeOrder(order);
                    // if (!_placeOrderResult.error) {
                    //     order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    //     order.setExportStatus(Order.EXPORT_STATUS_READY);
                    //     order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    //     AdyenLogs.info_log( `Order ${order.orderNo} placed and closed`,);
                    // }
                }
                break;
            case 'OFFER_CLOSED':
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                order.trackOrderChange('Offer closed, failing order');
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, false);
                });
                AdyenLogs.info_log( `Offer closed for order ${order.orderNo} and updated to status NOT PAID.`,);
                break;
            case 'PENDING':
                pending = true;
                AdyenLogs.info_log( `Order ${order.orderNo} was in pending status.`,);
                break;
            case 'CAPTURE':
                if (customObj.custom.success === 'true' && order.status.value === Order.ORDER_STATUS_CANCELLED) {
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    OrderMgr.undoCancelOrder(order);
                    AdyenLogs.info_log( `Undo failed capture, Order ${order.orderNo} updated to status PAID.`,);
                }
                break;
            case 'MANUAL_REVIEW_ACCEPT':
                if (customObj.custom.success === 'true') {
                    if (order.status.value === dw.order.Order.ORDER_STATUS_CREATED) {
                        //AUTOBAHN MOD place the order in notification.js
                        result.PlaceOrder = true;
                    }
                }
                break;
            case 'MANUAL_REVIEW_REJECT':
                if (customObj.custom.success === 'true') {
                    if (order.status.value === dw.order.Order.ORDER_STATUS_CREATED) {
                        var failOrderResult = OrderMgr.failOrder(order, false);
                        if (failOrderResult.error) {
                            // retry on next job run, potential permanent stuck record
                            AdyenLogs.info_log( `Order ${order.orderNo} was rejected by manual review, but failed to fail.`,);
                            result.status = PIPELET_NEXT;
                            return result;
                        } else {
                            AdyenLogs.info_log( `Order ${order.orderNo} was rejected by manual review and was failed accordingly.`,);
                        }
                    }
                }
                break;
            default:
                AdyenLogs.info_log( `Order ${order.orderNo} received unhandled status ${customObj.custom.eventCode}`,);
        }

        // If payment was refused and was used Adyen payment method, the fields
        // are changed when user is redirected back from Adyen HPP
        if (!refusedHpp) {
            // Add received information to order

            /*
              PSP Reference must be persistent.
              Some modification requests (Capture, Cancel) send identificators of the operations,
              we mustn't overwrite the original value by the new ones
             */
            if (empty(order.custom.Adyen_pspReference) && !empty(customObj.custom.pspReference)) {
                order.custom.Adyen_pspReference = customObj.custom.pspReference;
            }

            // Add a note with all details
            order.addNote('Adyen Payment Notification', module.exports.createLogMessage(customObj));
        }
        module.exports.setProcessedCOInfo(customObj);
    } else {
        AdyenLogs.debug_log('Order date > current Date.');
        result.SkipOrder = true;
        result.status = PIPELET_NEXT;
        return result;
    }
    result.status = PIPELET_NEXT;
    result.RefusedHpp = refusedHpp;
    result.Pending = pending;
    return result;
}
function setProcessedCOInfo(customObj) {
    var now = new Date();
    customObj.custom.processedDate = now;
    customObj.custom.updateStatus = 'SUCCESS';
    customObj.custom.processedStatus = 'SUCCESS';
}
function createLogMessage(customObj) {
    var VERSION = customObj.custom.version;
    var msg = '';
    msg = "AdyenNotification v ".concat(VERSION, " - Payment info (Called from : ").concat(customObj.custom.httpRemoteAddress, ")");
    msg += '\n================================================================\n';
    // msg = msg + "\nSessionID : " + args.CurrentSession.sessionID;
    msg = "".concat(msg, "reason : ").concat(customObj.custom.reason);
    msg = "".concat(msg, "\neventDate : ").concat(customObj.custom.eventDate);
    msg = "".concat(msg, "\nmerchantReference : ").concat(customObj.custom.merchantReference);
    msg = "".concat(msg, "\ncurrency : ").concat(customObj.custom.currency);
    msg = "".concat(msg, "\npspReference : ").concat(customObj.custom.pspReference);
    msg = "".concat(msg, "\nmerchantAccountCode : ").concat(customObj.custom.merchantAccountCode);
    msg = "".concat(msg, "\neventCode : ").concat(customObj.custom.eventCode);
    msg = "".concat(msg, "\nvalue : ").concat(customObj.custom.value);
    msg = "".concat(msg, "\noperations : ").concat(customObj.custom.operations);
    msg = "".concat(msg, "\nsuccess : ").concat(customObj.custom.success);
    msg = "".concat(msg, "\npaymentMethod : ").concat(customObj.custom.paymentMethod);
    msg = "".concat(msg, "\nlive : ").concat(customObj.custom.live);
    return msg;
}

function createDelayOrderDate(orderCreateDate) {
    // AdyenNotificationDelayMinutes
    var adyenDelayMin = 1;

    // Variable in milliseconds
    var newDate = new Date();
    newDate.setTime(orderCreateDate.getTime() + adyenDelayMin * 60 * 1000);
    return newDate;
}

module.exports = {
    handle: handle,
    createDelayOrderDate: createDelayOrderDate,
    createLogMessage: createLogMessage,
    setProcessedCOInfo: setProcessedCOInfo
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
