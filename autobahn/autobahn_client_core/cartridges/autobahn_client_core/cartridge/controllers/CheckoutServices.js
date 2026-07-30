'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');

var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var affirmHelper = require('*/cartridge/scripts/utils/affirmHelper');

var removePaymentInstruments = function (basket, paymentInstruments) {
    for (var i = 0; i < paymentInstruments.length; i++) {
        var pi = paymentInstruments[i];
        basket.removePaymentInstrument(pi);
    }
};


if (dw.system.Site.current.getCustomPreferenceValue('sfcommercepaymentsCartridgeEnabled')) {
    server.append('SubmitBilling', function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();

        try {
            Logger.warn(
                'CheckoutServices-SubmitBilling called for customer {0}. Session ID: {1}. Basket UUID: {2}. OrderDebugging',
                currentBasket.customerEmail,
                session.sessionID,
                currentBasket.getUUID()
            );
        } catch (e) {
            Logger.warn('CheckoutServices-SubmitBilling called. Error logging: {0}. OrderDebugging', e);
        }

        next();
    });
}

// Merge guest basket into registered basket after login during checkout
server.append('LoginCustomer', function (req, res, next) {
    Transaction.begin();
    try {
        if (!res.viewData.customerLoginResult.error) {
            // the (transferred) basket from the previous guest shopper
            var currentBasket = BasketMgr.getCurrentBasket();
    
            // the basket from the registered shopper which was attached before the login
            var storedBasket = BasketMgr.getStoredBasket();
    
            if (storedBasket || currentBasket) {
                dw.system.HookMgr.callHook("dw.order.mergeBasket", "mergeBasket", storedBasket, currentBasket);
            }
        }
        Transaction.commit();
    } catch (error) {
        Transaction.rollback();
        Logger.error('Error during basket merge after checkout-login: {0}', error.message);
    }
    return next();
});


server.append('SubmitPayment', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var paymentForm = server.forms.getForm('billing');
    var paymentMethodIdValue = paymentForm.paymentMethod.value;
    var currentBasket = BasketMgr.getCurrentBasket();

    Transaction.wrap(function () {
        if (paymentMethodIdValue == affirmHelper.AFFIRM_PAYMENT_METHOD) {
            removePaymentInstruments(currentBasket, currentBasket.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
            removePaymentInstruments(currentBasket, currentBasket.getPaymentInstruments('Salesforce Payments'));
        } else if (paymentMethodIdValue == PaymentInstrument.METHOD_CREDIT_CARD || paymentMethodIdValue == 'Salesforce Payments') {
            removePaymentInstruments(currentBasket, currentBasket.getPaymentInstruments(affirmHelper.AFFIRM_PAYMENT_METHOD));
        }
    });

    try {
        Logger.warn(
            'CheckoutServices-SubmitPayment called for customer {0}. Session ID: {1}. Basket UUID: {2}. OrderDebugging',
            currentBasket.customerEmail,
            session.sessionID,
            currentBasket.getUUID()
        );
    } catch (e) {
        Logger.warn('CheckoutServices-SubmitPayment called. Error logging: {0}. OrderDebugging', e);
    }

    this.on('route:BeforeComplete', function (req, res) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket) {
            var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
            if(res.viewData.order){
                res.viewData.order.totals.totalBasePrice = totalBasePrice;
            }
        }
    });

    return next();
});

server.append('PlaceOrder', function (req, res, next) {
    var collections = require('*/cartridge/scripts/util/collections');
    var viewData = res.getViewData();
    var order = OrderMgr.getOrder(viewData.orderID);
    var isRTWOrder = false;

    if (!empty(order)) {
        collections.forEach(order.productLineItems, function (productLineItem) {
            var productInfo = ProductMgr.getProduct(productLineItem.productID);
            if (productInfo.custom.enableRTWProduct) {
                isRTWOrder = true;
            }
        });
        Transaction.wrap(function () {
            order.custom.isRTWOrder = isRTWOrder;
        });

        Logger.warn("autobahn_client_core - PlaceOrder call for the customer "+order.customerEmail+"");
    } else {
        Logger.warn("autobahn_client_core - Order was not placed.");
    }

    try {
        Logger.warn('CheckoutServices-PlaceOrder called for order {0}. Session ID: {1}. OrderDebugging', viewData.orderID, session.sessionID);
    } catch (e) {
        Logger.warn('CheckoutServices-PlaceOrder called. Error logging: {0}. OrderDebugging', e);
    }
    next();
});

server.get('CheckEmail', function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');

    if ('email' in req.querystring && !empty(req.querystring.email)) {
        var email = req.querystring.email.trim();

        var customer = CustomerMgr.getCustomerByLogin(email);

        if (customer) {
            res.json({
                existingCustomer: true,
                msg: Resource.msg('checkout.emailassociated', 'checkout', null),
            });
        } else {
            res.json({
                existingCustomer: false,
            });
        }
    } else {
        res.json({
            existingCustomer: false,
        });
    }

    next();
});

server.append(
    'SubmitCustomer',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) {
            var currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket) {
                var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
                if(res.viewData.order){
                    res.viewData.order.totals.totalBasePrice = totalBasePrice;
                }
            }
        });
        return next();
    }
);

module.exports = server.exports();
