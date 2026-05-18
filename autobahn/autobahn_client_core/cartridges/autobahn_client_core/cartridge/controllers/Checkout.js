'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var CartModel = require('*/cartridge/models/cart');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var agentBasketLineItemLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');

server.prepend('Begin', function (req, res, next) {
    agentBasketLineItemLocks.ensureLockedLineItems(BasketMgr.getCurrentBasket());
    next();
});

server.append('Begin', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var productSKU = currentBasket && currentBasket.allProductLineItems && currentBasket.allProductLineItems[0] && currentBasket.allProductLineItems[0].productID;
    var profileForm = server.forms.getForm('profile');
    profileForm.clear();
    res.viewData.productSKU = productSKU;
    var cartModel = new CartModel(currentBasket);
    var target = req.querystring.rurl || 2;
    var URLUtils = require('dw/web/URLUtils');
    var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
    res.viewData.createAccountUrl = createAccountUrl;
    res.viewData.profileForm = profileForm;
    var currentCustomer = req.currentCustomer;
    var currentCustomerRawID = currentCustomer.raw.ID;
    session.custom.currentCustomer = currentCustomerRawID;
    res.viewData.currentCustomer = currentCustomer;
    res.viewData.totals = cartModel.totals;
    res.viewData.cartSummary = cartSummaryBuilder.getCartSummary(currentBasket);
    res.viewData.actionUrls= cartModel.actionUrls
    if (res.viewData.order) {
        res.viewData.order.isAgentBasket = agentBasketLineItemLocks.isRestrictedBasket(currentBasket);
        if (res.viewData.order.items) {
            agentBasketLineItemLocks.decorateItems(res.viewData.order.items.items, currentBasket);
        }
        agentBasketLineItemLocks.decorateShippingModels(res.viewData.order.shipping, currentBasket);
    }

    if (currentBasket) {
        var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
        if(res.viewData.order) {
            res.viewData.order.totals.totalBasePrice = totalBasePrice;
        }
    }

    next();
});

// RefreshOrderSummary - Re-generates and re-renders the current order total summary partial.
server.get('RefreshOrderSummary', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    var OrderModel = require('*/cartridge/models/order');

    if (!basket) {
        return next();
    }

    var orderModel = new OrderModel(basket, {containerView: 'basket'});
    var cartSummary = cartSummaryBuilder.getCartSummary(basket);
    orderModel.isAgentBasket = agentBasketLineItemLocks.isRestrictedBasket(basket);
    if (orderModel.items) {
        agentBasketLineItemLocks.decorateItems(orderModel.items.items, basket);
    }
    agentBasketLineItemLocks.decorateShippingModels(orderModel.shipping, basket);

    res.render('checkout/orderTotalSummary', {
        order: orderModel,
        cartSummary: cartSummary
    });
    return next();
});

module.exports = server.exports();
