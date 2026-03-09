"use strict";

var base = module.superModule || {};

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

// script includes
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var checkoutServicesHelpers = require('*/cartridge/scripts/helpers/checkoutServicesHelpers');
var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

function aggregateRedundantKeys(_object) {
    function set(object, property, value) {
        var index = property.indexOf('.');
        if (index >= 0) {
            var branch = property.substring(0, index);
            var leaf = property.substring(index + 1);
            if (!object.hasOwnProperty(branch)) {
                object[branch] = {};
            }
            set(object[branch], leaf, value);
        } else {
            object[property] = value;
        }
    }

    var result = {};
    Object.keys(_object).forEach(function (property) {
        set(result, property, _object[property]);
    });

    return result;
}

/**
 * ProcessNotifications - search for custom objects that need
 *  to be processed and handle them to place or fail order
 */
function processNotifications(/* pdict */) {
    var objectsHandler = require('*/cartridge/adyen/webhooks/handleCustomObject');
    var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', "custom.updateStatus = 'PROCESS'", null);
    AdyenLogs.info_log("Process notifications start with count ".concat(searchQuery.count));
    var customObj;
    var handlerResult;
    var order;
    while (searchQuery.hasNext()) {
        customObj = searchQuery.next();
        Transaction.wrap(function () {
            handlerResult = objectsHandler.handle(customObj);
        });

        /*
         Sometimes order cannot be found in DWRE DB even if it exists there,   
         in that case we shouldn't reply to Adyen that all was ok in order to get a new notification
        */

        order = handlerResult.Order;
        if (!handlerResult.status || handlerResult.status === PIPELET_ERROR) {
            // Only CREATED orders can be failed
            if (order === null || order.status.value !== dw.order.Order.ORDER_STATUS_CREATED || handlerResult.RefusedHpp) {
                continue;
            }
            // Refused payments which are made with using Adyen payment method are
            // handled when user is redirected back from Adyen HPP.
            // Here we shouldn't fail an order and send a notification
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            continue;
        }
        if (handlerResult.SkipOrder || handlerResult.Pending) {
            continue;
        }

        // Submitting an order -> update status and send all required email
        if (handlerResult.SubmitOrder) {
            var placeOrderResult = module.exports.submitOrder(order);
            if (!placeOrderResult.order_created || placeOrderResult.error) {
                AdyenLogs.error_log("Failed to place an order: ".concat(order.orderNo, ", during notification process."));
            }
        }

        if (handlerResult.PlaceOrder) {
            if (order.status.value === dw.order.Order.ORDER_STATUS_CREATED) {
                // Added to support post-auth fraud checks after the auth has been fully processed
                var paymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
                var paymentTransaction = paymentInstrument.paymentTransaction;
                
                // If PSP reference not already stored, take it from notification custom object
                if (!paymentTransaction.transactionID || !paymentTransaction.custom.Adyen_pspReference) {
                    if (customObj.custom && customObj.custom.pspReference) {
                        Transaction.wrap(function () {
                            paymentTransaction.transactionID = customObj.custom.pspReference;
                            paymentTransaction.custom.Adyen_pspReference = customObj.custom.pspReference;
                            // also copy payment method if available
                            if (customObj.custom.paymentMethod) {
                                paymentTransaction.custom.Adyen_paymentMethod = customObj.custom.paymentMethod;
                                order.custom.Adyen_paymentMethod = customObj.custom.paymentMethod;
                            }
                        });
                        AdyenLogs.info_log(
                            "Stored PSP reference " + customObj.custom.pspReference +
                            " from notification into order " + order.orderNo
                        );
                    } else {
                        AdyenLogs.error_log(
                            "No PSP reference available in custom object for order " + order.orderNo
                        );
                    }
                } else {
                    AdyenLogs.info_log(
                        "Payment details already exist for order " + order.orderNo +
                        ", skipping PSP reference update."
                    );
                }

                var log = JSON.parse(paymentTransaction.custom.Adyen_log);
                var fraudCheckHandlePaymentResult = {};
                fraudCheckHandlePaymentResult[paymentTransaction.paymentProcessor.ID.toLowerCase()] = {
                    authResponse: {
                        fullResponse: aggregateRedundantKeys(log)
                    }
                };

                // Determine payment method
                var paymentMethod = order.custom.Adyen_paymentMethod || (
                    paymentInstrument && paymentInstrument.paymentMethod
                );

                // Skip fraud check for Affirm or Klarna
                var skipFraudCheck = false;
                if (paymentMethod) {
                    var lowerMethod = paymentMethod.toLowerCase();
                    if (lowerMethod.indexOf('affirm') >= 0 || lowerMethod.indexOf('klarna') >= 0) {
                        skipFraudCheck = true;
                    }
                }

                if (skipFraudCheck) {
                    AdyenLogs.info_log(`Skipping post-auth fraud check for ${paymentMethod} payment on order ${order.orderNo}.`);
                    // Just place the order directly
                    var placeOrderResultSkip = COHelpers.placeOrder(order, fraudCheckHandlePaymentResult);
                    if (placeOrderResultSkip.error) {
                        AdyenLogs.error_log(`Order ${order.orderNo} failed to place after skipping fraud check.`);
                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order, true);
                        });
                    } else {
                        AdyenLogs.info_log(`Order ${order.orderNo} placed successfully (fraud check skipped).`);
                    }
                } else {
                    // Run post-auth fraud check as usual
                    var postAuthFraudCheckResult = checkoutServicesHelpers.placeOrderPostAuthFraudCheck(order, fraudCheckHandlePaymentResult);

                    if (postAuthFraudCheckResult.error) {
                        // Cancel or refund the payment if necessary
                        paymentHelpers.reversePaymentIfNecessary(order);

                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order, true);
                        });

                        AdyenLogs.info_log(`Order ${order.orderNo} failed post-auth fraud check.`);
                    } else {
                        var placeOrderResult2 = COHelpers.placeOrder(order, postAuthFraudCheckResult);
                        if (placeOrderResult2.error) {
                            AdyenLogs.error_log(`Order ${order.orderNo} passed the post-auth fraud check but failed to place.`);
                            Transaction.wrap(function () {
                                OrderMgr.failOrder(order, true);
                            });
                        } else {
                            AdyenLogs.info_log(`Order ${order.orderNo} passed the post-auth fraud check and placed successfully.`);
                        }
                    }
                }
            }
        }
    }
    AdyenLogs.info_log("Process notifications finished with count ".concat(searchQuery.count));
    searchQuery.close();
    return PIPELET_NEXT;
}

/**
 * Submits an order, original function located in OrderModel, but we need to
 * manage triggering of email
 * @param order {dw.order.Order} The order object to be submitted.
 * @transactional
 * @return {Object} object If order cannot be placed, object.error is set to true.
 * Otherwise, object.order_created is true, and object.Order is set to the order.
 */
function submitOrder(order) {
    var adyenService = require('*/cartridge/adyen/utils/adyenService');
    return adyenService.submit(order);
}

module.exports = {
    processNotifications: processNotifications
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
