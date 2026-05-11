'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var affirmData = require('*/cartridge/scripts/data/affirmData');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var CHANNEL_TYPE_CUSTOMERSERVICECENTER = 11;

function getEnumValue(enumValue) {
    if (!enumValue) {
        return null;
    }

    try {
        if (typeof enumValue.value !== 'undefined') {
            return enumValue.value;
        }
    } catch (e) {
        // Fall back to the getter below.
    }

    try {
        if (typeof enumValue.getValue === 'function') {
            return enumValue.getValue();
        }
    } catch (e) {
        return null;
    }

    return null;
}

function isCustomerServiceCenterBasket(basket) {
    var channelType = null;

    try {
        channelType = basket.channelType;
    } catch (e) {
        // Fall back to the getter below.
    }

    try {
        channelType = channelType || (typeof basket.getChannelType === 'function' && basket.getChannelType());
    } catch (e) {
        return false;
    }

    return getEnumValue(channelType) === CHANNEL_TYPE_CUSTOMERSERVICECENTER;
}

function isAgentBasket(basket) {
    if (!basket) {
        return false;
    }

    try {
        if (typeof basket.isAgentBasket === 'function' && basket.isAgentBasket()) {
            return true;
        }
    } catch (e) {
        // Fall back to the Script API property below.
    }

    try {
        if (basket.agentBasket === true) {
            return true;
        }
    } catch (e) {
        return isCustomerServiceCenterBasket(basket);
    }

    return isCustomerServiceCenterBasket(basket);
}

function blockAgentBasketMutation(req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (isAgentBasket(currentBasket)) {
        var Resource = require('dw/web/Resource');

        res.setStatusCode(403);
        res.json({
            error: true,
            errorMessage: Resource.msg('error.agent.basket.locked', 'cart', null)
        });

        return this.done(req, res);
    }

    return next();
}

server.prepend('RemoveProductLineItem', blockAgentBasketMutation);
server.prepend('UpdateQuantity', blockAgentBasketMutation);
server.prepend('AddCoupon', blockAgentBasketMutation);
server.prepend('RemoveCouponLineItem', blockAgentBasketMutation);
server.prepend('AddBonusProducts', blockAgentBasketMutation);

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
    var viewData = res.getViewData();

    viewData.isAgentBasket = isAgentBasket(currentBasket);
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

// Appends cart summary data to the view for use in the Mini Cart
server.append('MiniCartShow', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var cartSummary = cartSummaryBuilder.getCartSummary(currentBasket);
    viewData.cartSummary = cartSummary;
    viewData.isAgentBasket = isAgentBasket(currentBasket);
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
