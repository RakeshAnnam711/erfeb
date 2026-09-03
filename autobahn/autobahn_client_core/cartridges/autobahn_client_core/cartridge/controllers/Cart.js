'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var affirmData = require('*/cartridge/scripts/data/affirmData');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var liveSellingHelpers = require('*/cartridge/scripts/helpers/liveSellingHelpers');
var liveSellingExpiry = require('*/cartridge/scripts/middleware/liveSellingExpiry');

server.prepend('Show', liveSellingExpiry.validateBasketExpiry);

server.append('AddProduct', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var pid = req.form.pid;

    if (req.form.isbambuser && req.form.pid) {
        Transaction.wrap(function () {
            var productListItems = currentBasket.productLineItems;
            for (var q = 0; q < currentBasket.productLineItems.length; q++) {
                if (productListItems[q].productID === pid) {
                    productListItems[q].custom.isbambuserproduct = true;
                    break;
                }
            }
        });
    }

    next();
});

server.append('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftEstimatedDeliveryDates')) {
        var viewData = res.getViewData();
        var currentBasket = BasketMgr.getCurrentBasket();

        if ('shipments' in viewData && viewData.shipments.length > 0 && 'shippingMethods' in viewData.shipments[0]) {
            var shippingMethods = viewData.shipments[0].shippingMethods;

            // Remove shipping methods with no price
            var methodsArray = [];

            shippingMethods.forEach(function (method) {
                if (method.shippingCost !== 'N/A') {
                    methodsArray.push(method);
                }
            });

            viewData.shipments[0].shippingMethods = methodsArray;
        }

        // Affirm data to display affirm values on cart total section
        var affirmAmount = '';
        if (currentBasket && currentBasket.totalGrossPrice) {
            affirmAmount = currentBasket.totalGrossPrice.multiply(100).getValue().toFixed();
        }

        // Check Affirm online status
        var affirmOnlineStatus = false;
        try {
            affirmOnlineStatus = affirmData.getAffirmPaymentOnlineStatus();
        } catch (e) {
            require('dw/system/Logger').getLogger('Affirm').error('Affirm status check failed: {0}', e.message);
        }

        viewData.affirmData = {
            affirmOnlineStatus: affirmOnlineStatus,
            affirmAmount: affirmAmount
        }

        var cartSummary = cartSummaryBuilder.getCartSummary(currentBasket);
        viewData.cartSummary = cartSummary;
        res.setViewData(viewData);
    }

    next();
});

// Controller endpoint to return the structured cart summary JSON
server.get('GetSummaryData', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var summary = cartSummaryBuilder.getCartSummary(currentBasket);

    res.json(summary);
    next();
});

// Appends cart summary data to the view for use in the Mini Cart
server.append('MiniCartShow', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var cartSummary = cartSummaryBuilder.getCartSummary(currentBasket);
    viewData.cartSummary = cartSummary;
    res.setViewData(viewData);
    next();
})

server.get('ClearCart', function (req, res, next) {
    var CartModel = require('*/cartridge/models/cart');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({ error: false, basket: null });
        return next();
    }

    try {
        liveSellingHelpers.clearBasket(currentBasket);
    } catch (e) {
        Logger.error('Cart-ClearCart: unable to clear basket: {0}', e.message);

        res.json({
            error: true,
            basket: new CartModel(currentBasket)
        });
        return next();
    }

    res.json({
        error: false,
        basket: new CartModel(currentBasket)
    });
    return next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && currentBasket.productLineItems && currentBasket.productLineItems.empty) {
        var safeBasket = currentBasket;

        Transaction.wrap(function () {
            // remove coupons
            var couponLineItems = safeBasket.getCouponLineItems();
            for (var c = 0; c < couponLineItems.length; c++) {
                safeBasket.removeCouponLineItem(couponLineItems[c]);
            }

            // remove price adjustments
            var priceAdjustments = safeBasket.priceAdjustments;
            for (var k = 0; k < priceAdjustments.length; k++) {
                safeBasket.removePriceAdjustment(priceAdjustments[k]);
            }
        });
    }

    next();
});

module.exports = server.exports();
