'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var CartModel = require('*/cartridge/models/cart');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');

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
    res.viewData.isLiveSellingOrder = cartModel.isLiveSellingOrder;

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

    res.render('checkout/orderTotalSummary', {
        order: orderModel,
        cartSummary: cartSummary
    });
    return next();
});

module.exports = server.exports();
