'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var affirmData = require('*/cartridge/scripts/data/affirmData');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var agentLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');

function blockedCartMutation(res) {
    res.setStatusCode(403);
    res.json({
        error: true,
        errorMessage: 'This cart was created by customer service and cannot be modified.'
    });
}

server.prepend('RemoveProductLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && agentLocks.isLockedUUID(currentBasket, req.querystring.uuid)) {
        blockedCartMutation(res);
        return;
    }

    next();
});

server.prepend('UpdateQuantity', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && agentLocks.isLockedUUID(currentBasket, req.querystring.uuid)) {
        blockedCartMutation(res);
        return;
    }

    next();
});

server.prepend('EditProductLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && agentLocks.isLockedUUID(currentBasket, req.form.uuid)) {
        blockedCartMutation(res);
        return;
    }

    next();
});

server.prepend('AddCoupon', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && agentLocks.isRestrictedBasket(currentBasket)) {
        blockedCartMutation(res);
        return;
    }

    next();
});

server.prepend('RemoveCouponLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && agentLocks.isRestrictedBasket(currentBasket)) {
        blockedCartMutation(res);
        return;
    }

    next();
});

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

    if (currentBasket && req.form.pid && !req.form.isbambuser) {
        Transaction.wrap(function () {
            var productListItems = currentBasket.productLineItems;
            for (var i = 0; i < currentBasket.productLineItems.length; i++) {
                if (productListItems[i].productID === pid) {
                    // Unconditional: a CSC classification found here can only be a false positive from the
                    // lock sweep running earlier in this same request (base AddProduct's own response/model
                    // build happens before this append), since Add to Cart is hidden for CSC/live-selling
                    // products and a genuine storefront click can never target an existing CSC line item.
                    agentLocks.forceMarkStorefrontLineItem(productListItems[i]);
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

    if (currentBasket) {
        var expiredUUIDs = agentLocks.removeExpiredCSCLineItems(currentBasket);

        if (expiredUUIDs.length) {
            Transaction.wrap(function () {
                require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(currentBasket);
            });

            if (viewData.items) {
                viewData.items = viewData.items.filter(function (item) {
                    return expiredUUIDs.indexOf(item.UUID) === -1;
                });
            }
        }

        agentLocks.ensureLockedLineItems(currentBasket);
        agentLocks.decorateCartModelItems(viewData.items, currentBasket);
        viewData.isAgentRestrictedBasket = agentLocks.isRestrictedBasket(currentBasket);
        viewData.isAgentBasket = viewData.isAgentRestrictedBasket;
        res.setViewData(viewData);
    }

    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftEstimatedDeliveryDates')) {
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

// TEMP DEBUG endpoint for CSC handoff investigation - remove once the locking issue is confirmed fixed
server.get('DebugCSC', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var debugInfo = {
        basketUUID: null,
        isAgentBasket: null,
        lineItems: [],
        sessionLockedBasketUUID: (typeof session !== 'undefined' && session.custom) ? session.custom.agentLockedBasketUUID : null,
        sessionLockedLineItemUUIDs: (typeof session !== 'undefined' && session.custom) ? session.custom.agentLockedLineItemUUIDs : null,
        sessionStorefrontBasketUUID: (typeof session !== 'undefined' && session.custom) ? session.custom.storefrontLineItemBasketUUID : null,
        sessionStorefrontLineItemUUIDs: (typeof session !== 'undefined' && session.custom) ? session.custom.storefrontLineItemUUIDs : null
    };

    function dumpCustom(obj) {
        var out = {};
        try {
            for (var id in obj.custom) { // eslint-disable-line no-restricted-syntax
                try {
                    out[id] = String(obj.custom[id]);
                } catch (e2) {
                    out[id] = 'ERROR: ' + e2.message;
                }
            }
        } catch (e) {
            return 'ERROR: ' + e.message;
        }
        return out;
    }

    if (currentBasket) {
        debugInfo.basketUUID = currentBasket.UUID;

        try {
            debugInfo.isAgentBasket = currentBasket.isAgentBasket();
        } catch (e) {
            debugInfo.isAgentBasket = 'ERROR: ' + e.message;
        }

        try {
            debugInfo.channelType = String(currentBasket.channelType);
        } catch (e) {
            debugInfo.channelType = 'ERROR: ' + e.message;
        }

        debugInfo.isCustomerServiceCenterBasket = agentLocks.isCustomerServiceCenterBasket(currentBasket);

        try {
            debugInfo.creationDate = String(currentBasket.creationDate);
            debugInfo.customerNo = currentBasket.customer && currentBasket.customer.profile ? currentBasket.customer.profile.customerNo : null;
        } catch (e) {
            debugInfo.creationDate = 'ERROR: ' + e.message;
        }

        debugInfo.basketCustomAttributes = dumpCustom(currentBasket);

        try {
            debugInfo.defaultShipmentCustomAttributes = currentBasket.defaultShipment ? dumpCustom(currentBasket.defaultShipment) : null;
        } catch (e) {
            debugInfo.defaultShipmentCustomAttributes = 'ERROR: ' + e.message;
        }

        currentBasket.allProductLineItems.toArray().forEach(function (li) {
            debugInfo.lineItems.push({
                uuid: li.UUID,
                productID: li.productID,
                isLineItemLiveSelling: agentLocks.isLineItemLiveSelling(li),
                allCustomAttributes: dumpCustom(li)
            });
        });

        debugInfo.isRestrictedBasket = agentLocks.isRestrictedBasket(currentBasket);
    }

    res.json(debugInfo);
    next();
});

// Lightweight endpoint polled by the client-side cart page to catch CSC line items expiring while the
// customer is sitting on the page without navigating anywhere (a plain page-load check would never fire
// in that case). Removes anything expired and reports whether the page needs to refresh.
server.get('CheckExpired', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var expiredUUIDs = [];

    if (currentBasket) {
        expiredUUIDs = agentLocks.removeExpiredCSCLineItems(currentBasket);

        if (expiredUUIDs.length) {
            Transaction.wrap(function () {
                require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(currentBasket);
            });
        }
    }

    res.json({
        expired: expiredUUIDs.length > 0,
        expiredUUIDs: expiredUUIDs
    });
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

    if (currentBasket) {
        var expiredUUIDs = agentLocks.removeExpiredCSCLineItems(currentBasket);

        if (expiredUUIDs.length) {
            Transaction.wrap(function () {
                require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(currentBasket);
            });

            if (viewData.items) {
                viewData.items = viewData.items.filter(function (item) {
                    return expiredUUIDs.indexOf(item.UUID) === -1;
                });
            }
        }
    }

    var cartSummary = cartSummaryBuilder.getCartSummary(currentBasket);
    if (currentBasket) {
        agentLocks.ensureLockedLineItems(currentBasket);
        agentLocks.decorateCartModelItems(viewData.items, currentBasket);
        viewData.isAgentRestrictedBasket = agentLocks.isRestrictedBasket(currentBasket);
        viewData.isAgentBasket = viewData.isAgentRestrictedBasket;
    }
    viewData.cartSummary = cartSummary;
    res.setViewData(viewData);
    next();
})

server.get('ClearCart', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var CartModel = require('*/cartridge/models/cart');

    if (!currentBasket) {
        res.json({ error: false, basket: null });
        return next();
    }

    Transaction.wrap(function () {
        var productLineItems = currentBasket.allProductLineItems.toArray();
        var couponLineItems = currentBasket.couponLineItems.toArray();
        var priceAdjustments = currentBasket.priceAdjustments.toArray();

        productLineItems.forEach(function (lineItem) {
            currentBasket.removeProductLineItem(lineItem);
        });
        couponLineItems.forEach(function (couponLineItem) {
            currentBasket.removeCouponLineItem(couponLineItem);
        });
        priceAdjustments.forEach(function (priceAdjustment) {
            currentBasket.removePriceAdjustment(priceAdjustment);
        });

        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    agentLocks.clearLockedUUIDs();

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
        agentLocks.clearLockedUUIDs();
    }

    next();
});

module.exports = server.exports();
