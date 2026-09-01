var base = module.superModule;
var sfraSendConfirmationEmail = base.sendConfirmationEmail; // setting this to the base SFRA function before overriding it

/**
 * Attempts to place the order
 * additionally creates and redeems gift certificates on the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {Object} fraudDetectionStatus - an Object returned by the fraud detection hook
 * @returns {Object} an error object
 */
function placeOrder(order, fraudDetectionStatus) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var giftCertificateHelper = require('*/cartridge/scripts/helpers/giftCertificateHelper');
    var result = {error: false};
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    // var updateAllocation = require('*/cartridge/scripts/services/updateAllocation');
    var Logger = require('dw/system/Logger');
    try {
        if (order.status.value !== Order.ORDER_STATUS_CREATED) {
            throw new Error('Cannot call place order on an order not in created status');
        }

        if (fraudDetectionStatus.status === 'flag') {
            //Do not place or export (to become a site preference)
            Transaction.wrap(function() {
                order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            })
            return result;
        }

        try {
            var doPrePlaceOrder = require('*/cartridge/scripts/checkout/doPrePlaceOrder');
            var doPrePlaceOrderResult = doPrePlaceOrder.doPrePlaceOrder(order);

            if (doPrePlaceOrderResult.error) {
                // in the event a single message was returned, translate it into an array.
                var messages = [];
                if (Array.isArray(doPrePlaceOrderResult.message)) {
                    messages = messages.concat(doPrePlaceOrderResult.message);
                } else {
                    messages.push(doPrePlaceOrderResult.message);
                }
                Transaction.wrap(function () {
                    messages.forEach(function(message) {
                        if (!empty(message)) {
                            order.addNote('Failed order pre processing: ', message);
                        }
                    });
                });
            }
        } catch (e) {
            Transaction.wrap(function () {
                order.addNote('Failed order pre processing: ', e.message);
            });
        }

        Transaction.begin();

        // The reason we do this first, is because the basket cannot be recreated easily once the order has been placed
        // This creates a gift cert but sets the status to 'Pending' and enabled to 'false': gets activated in hook below
        var giftCertificates = giftCertificateHelper.createGiftCertificates(order);

        // We do not redeem gift certificates inside their Authorize hook, so we must do it here
        var redeemStatus = giftCertificateHelper.redeemGiftCertificates(order);
        if (redeemStatus.error) {
            module.exports.reApplyGiftCertificatePaymentInstruments(order);
            result.cartError = true;
            result.redirectUrl = URLUtils.https('Checkout-Begin', 'stage', 'payment', 'errormessagetext', Resource.msg('giftcertificate.checkout.error.redeem', 'checkout', null)).toString()
            throw new Error(redeemStatus);
        }

        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus.error) {
            throw new Error(placeOrderStatus);
        }

        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        order.setExportStatus(Order.EXPORT_STATUS_READY);

        Transaction.commit();
  
        // Check if an external system like SOM is handling activating gift certificates after capture, if true skip this activate hook call
        if (!empty(giftCertificates) && dw.system.Site.current.getCustomPreferenceValue('giftCertificateActivatedByExternalSystem') === false) {
            try {
                var giftCertificateHooks =  require('*/cartridge/scripts/hooks/giftCertificate/giftCertificateHooks');
                giftCertificateHooks.activateGiftCertificatesFromOrder(giftCertificates, order);
            } catch (e) {
                Transaction.wrap(function () {
                    order.addNote('Failed to send gift certificate email(s) (code error)', e.message);
                });
            }
        }

        try {
            var doPostPlaceOrder = require('*/cartridge/scripts/checkout/doPostPlaceOrder');
            var doPostPlaceOrderResult = doPostPlaceOrder.doPostPlaceOrder(order);

            if (doPostPlaceOrderResult.error) {
                // in the event a single message was returned, translate it into an array.
                var messages = [];
                if (Array.isArray(doPostPlaceOrderResult.message)) {
                    messages = messages.concat(doPostPlaceOrderResult.message);
                } else {
                    messages.push(doPostPlaceOrderResult.message);
                }
                Transaction.wrap(function () {
                    messages.forEach(function(message) {
                        if (!empty(message)) {
                            order.addNote('Failed order post processing: ', message);
                        }
                    });
                });
            }
            // else{
            //     try {
            //         for (var i = 0; i < order.productLineItems.length; i++) {
            //             var productID = order.productLineItems[i].productID;
            //             if (productID) {
            //                 var response = updateAllocation.call({
            //                     productID: productID
            //                 });
            //                 if (!response.ok) {
            //                     Logger.error('updateAllocation failed for product {0}: {1}', productID, response.errorMessage);
            //                 } else {
            //                     Logger.info('updateAllocation succeeded for product {0}', productID);
            //                 }
            //             }
            //         }
            //     } catch (e) {
            //         Logger.error('Error updating inventory allocation: ' + e.message);
            //     }
            // }
       } catch (e) {
            Transaction.wrap(function () {
                order.addNote('Failed order post processing: ', e.message);
            });
        }
    } catch (e) {
        Transaction.rollback();
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        Transaction.wrap(function () {
            order.addNote('Internal Order Failure: ', e.message);
        });

        try {
            var doPostFailOrder = require('*/cartridge/scripts/checkout/doPostFailOrder');
            var doPostFailOrderResult = doPostFailOrder.doPostFailOrder(order);

            if (doPostFailOrderResult.error) {
                var messages = [];
                if (Array.isArray(doPostFailOrderResult.message)) {
                    messages = messages.concat(doPostFailOrderResult.message);
                } else {
                    messages.push(doPostFailOrderResult.message);
                }
                Transaction.wrap(function () {
                    messages.forEach(function(message) {
                        if (!empty(message)) {
                            order.addNote('Error order post failed processing: ', message);
                        }
                    });
                });
            }
        } catch (e) {
            Transaction.wrap(function () {
                order.addNote('Caught error order post failed processing: ', e.message);
            });
        }

        result.error = true;
    }

    return result;
}

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var authorizationResult = {};

    if (order.totalNetPrice.getValueOrNull()) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            authorizationResult.error = true;
            return authorizationResult;
        }

        for (var i = 0; i < paymentInstruments.length; i++) {
            var paymentInstrument = paymentInstruments[i];
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).paymentProcessor;
            if (paymentProcessor === null) {
                Transaction.wrap(function () {
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                })
                authorizationResult[paymentInstrument.paymentMethod] = {};
            } else {
                if (HookMgr.hasHook('app.payment.processor.' +
                    paymentProcessor.ID.toLowerCase())) {
                    authorizationResult[paymentProcessor.ID.toLowerCase()] = HookMgr.callHook(
                        'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                        'Authorize',
                        orderNumber,
                        paymentInstrument,
                        paymentProcessor
                    );
                } else {
                    authorizationResult[paymentProcessor.ID.toLowerCase()] = HookMgr.callHook(
                        'app.payment.processor.default',
                        'Authorize'
                    );
                }

                if (authorizationResult[paymentProcessor.ID.toLowerCase()].error) {
                    // no reason to auth all the other payments if 1 fails
                    // WGACA MOFIDICATION - Fail order on processor err (AB orig only breaks)
                    Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                    authorizationResult.error = true;
                    // END MODIFICATION
                    break;
                }
            }
        }
    }

    return authorizationResult;
}

/**
 * This function will attempt to use the Salesforce_Services hook to send the
 * confirmation email via Marketing Cloud. If the hook has not been defined then
 * the function will send the email traditionally
 * @param {dw.order.Order} order - the order object
 * @param {String} locale - the current request's locale id
 */
function sendConfirmationEmail(order, locale) {
    var site = require('dw/system/Site');
    var hookManager = require('dw/system/HookMgr');
    var logger = require('dw/system/Logger');

    var disableSFRAEmail = site.current.getCustomPreferenceValue('sfraOrderConfirmationEmailDisabled');

    if (hookManager.hasHook('app.email.order.confirmation') && !empty(order)) {
        try {
            var responseData = {};
            responseData = hookManager.callHook('app.email.order.confirmation', 'sendOrderConfirmationEmail', [responseData, order, locale]) || responseData; // first argument empty object to hold chained responses

            // Throw errors for actuall errors.
            if (!responseData.EmailSuccessfullySent) {
                logger.info('Sending confirmation email via hook was not enabled; will send via base SFRA / SFCC.');
                if (!disableSFRAEmail) {
                    sfraSendConfirmationEmail(order, locale);
                }
            }
        } catch (ex) {
            logger.error('Sending confirmation email via hook encountered an unexpected error or the send was disabled in hook implementation; will send via base SFRA / SFCC. Error: \n\"' + ex + '\".');
            if (!disableSFRAEmail) {
                sfraSendConfirmationEmail(order, locale);
            }
        }
    } else if (empty(order)){
        logger.error('An empty order object is trying to be passed to the base SFRA sendConfirmationEmail function. Quitting without sending an order confirmation email');
    } else {
        if (!disableSFRAEmail) {
            sfraSendConfirmationEmail(order, locale);
        }
    }
}

base.handlePayments = handlePayments;
base.placeOrder = placeOrder;
base.sendConfirmationEmail = sendConfirmationEmail;

module.exports = base
