'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var affirmData = require('*/cartridge/scripts/data/affirmData');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var agentBasketLineItemLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');

function blockResponse(res) {
    var Resource = require('dw/web/Resource');

    res.setStatusCode(403);
    res.json({
        error: true,
        errorMessage: Resource.msg('error.agent.basket.locked', 'cart', null)
    });
}

function blockAgentCouponMutation(req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (agentBasketLineItemLocks.isRestrictedBasket(currentBasket)) {
        blockResponse(res);
        return this.done(req, res);
    }

    return next();
}

function blockLockedLineItemMutation(req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var uuid = req.querystring.uuid || req.form.uuid;

    if (agentBasketLineItemLocks.isLockedUUID(currentBasket, uuid)) {
        blockResponse(res);
        return this.done(req, res);
    }

    return next();
}

server.prepend('Show', function (req, res, next) {
    agentBasketLineItemLocks.ensureLockedLineItems(BasketMgr.getCurrentBasket());
    next();
});

server.prepend('MiniCartShow', function (req, res, next) {
    agentBasketLineItemLocks.ensureLockedLineItems(BasketMgr.getCurrentBasket());
    next();
});

server.prepend('AddProduct', function (req, res, next) {
    agentBasketLineItemLocks.recordStorefrontProductAdd();
    agentBasketLineItemLocks.ensureLockedLineItems(BasketMgr.getCurrentBasket());
    next();
});

server.prepend('RemoveProductLineItem', blockLockedLineItemMutation);
server.prepend('UpdateQuantity', blockLockedLineItemMutation);
server.prepend('GetProduct', blockLockedLineItemMutation);
server.prepend('EditProductLineItem', blockLockedLineItemMutation);
server.prepend('AddCoupon', blockAgentCouponMutation);
server.prepend('RemoveCouponLineItem', blockAgentCouponMutation);

server.append('AddProduct', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var pid = req.form.pid;

    if (currentBasket && req.form.pid) {
        Transaction.wrap(function () {
            var productListItems = currentBasket.productLineItems;
            for (var q = 0; q < currentBasket.productLineItems.length; q++) {
                if (productListItems[q].productID === pid) {
                    if (req.form.isbambuser) {
                        productListItems[q].custom.isbambuserproduct = true;
                        agentBasketLineItemLocks.markLiveShoppingLineItem(productListItems[q]);
                    }
                    agentBasketLineItemLocks.markStorefrontLineItem(productListItems[q]);
                }
            }
        });
    }

    next();
});

server.append('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();

    agentBasketLineItemLocks.decorateItems(viewData.items, currentBasket);
    viewData.isAgentBasket = agentBasketLineItemLocks.isRestrictedBasket(currentBasket);
    res.setViewData(viewData);

    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftEstimatedDeliveryDates')) {
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

server.get('ClearCart', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket) {
        var wasRestrictedBasket = agentBasketLineItemLocks.isRestrictedBasket(currentBasket);

        Transaction.wrap(function () {
            var productLineItems = currentBasket.getAllProductLineItems().toArray();
            var giftCertificateLineItems = currentBasket.getGiftCertificateLineItems().toArray();
            var couponLineItems = currentBasket.getCouponLineItems().toArray();
            var priceAdjustments = currentBasket.getPriceAdjustments().toArray();

            couponLineItems.forEach(function (lineItem) {
                currentBasket.removeCouponLineItem(lineItem);
            });

            priceAdjustments.forEach(function (priceAdjustment) {
                currentBasket.removePriceAdjustment(priceAdjustment);
            });

            productLineItems.forEach(function (lineItem) {
                currentBasket.removeProductLineItem(lineItem);
            });

            giftCertificateLineItems.forEach(function (lineItem) {
                currentBasket.removeGiftCertificateLineItem(lineItem);
            });

            basketCalculationHelpers.calculateTotals(currentBasket);
            agentBasketLineItemLocks.clearLockedUUIDs();
            if (wasRestrictedBasket) {
                agentBasketLineItemLocks.setAwaitingHandoffAfterClear();
            }
        });
    }

    res.redirect(URLUtils.url('Cart-Show'));
    return next();
});

// Appends cart summary data to the view for use in the Mini Cart
server.append('MiniCartShow', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var cartSummary = cartSummaryBuilder.getCartSummary(currentBasket);
    agentBasketLineItemLocks.decorateItems(viewData.items, currentBasket);
    viewData.cartSummary = cartSummary;
    viewData.isAgentBasket = agentBasketLineItemLocks.isRestrictedBasket(currentBasket);
    res.setViewData(viewData);
    next();
})

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
