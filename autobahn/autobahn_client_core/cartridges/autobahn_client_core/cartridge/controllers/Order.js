'use strict';

var server = require('server');
server.extend(module.superModule);
var HTTPClient = require('dw/net/HTTPClient');
const OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');

server.append('Track', function (req, res, next) {
    var order = res.viewData.order;
    var totalCouponDiscount = {};
    try {
        var orderObj = OrderMgr.getOrder(order.orderNumber);

        if (!empty(orderObj)) {
            if (!res.viewData.order.totals) {
                res.viewData.order.totals = {};
            }
            res.viewData.order.totals.totalBasePrice = cartSummaryBuilder.getTotalBasePrice(orderObj);
            totalCouponDiscount = cartSummaryBuilder.getTotalCouponDiscount(orderObj);
        }
    } catch (error) {
        Logger.error('Error while fetching order: ' + error);
    }

    if (!empty(order)) {
        res.setViewData({
            customerEmail: order.orderEmail,
            customerProfile: {
                firstName: order.billing.billingAddress.address.firstName,
                lastname: order.billing.billingAddress.address.lastName,
                email: order.orderEmail
            },
            cartSummary: {
                cart: {
                    productCouponDiscount: totalCouponDiscount,
                    hasAppliedCoupons: !!(totalCouponDiscount && totalCouponDiscount.value)
                }
            }
        });
    }
    next();
});

server.prepend('Confirm', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var order = null;
    if (req.form.orderID && req.form.orderToken) {
        order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
    }
    if (!order || order.customer.ID !== req.currentCustomer.raw.ID) {
        var category = CatalogMgr.getCategory('new-arrivals');
        if (category && category.isOnline()) {
            res.redirect(URLUtils.https('Search-Show', 'cgid', category.ID));
        } else {
            res.redirect(URLUtils.home());
        }
    }
    if (order && order.custom && order.custom.basketUUID) {
        session.custom.basketUUID = order.custom.basketUUID;
    }
    next();
});

// Include promo details of order in viewdata for order details page
server.append('Details', function (req, res, next) {
    var order = res.viewData.order;
    var viewData = res.getViewData();
    var totalCouponDiscount = {};

    try {
        var orderObj = OrderMgr.getOrder(order.orderNumber);
        if (!empty(orderObj)) {
            res.viewData.order.totals.totalBasePrice = cartSummaryBuilder.getTotalBasePrice(orderObj);

            totalCouponDiscount = cartSummaryBuilder.getTotalCouponDiscount(orderObj);
            viewData.cartSummary = {
                cart: {
                    productCouponDiscount: totalCouponDiscount,
                    hasAppliedCoupons: !!(totalCouponDiscount && totalCouponDiscount.value)
                }
            }
            res.setViewData(viewData);
        }
    } catch (error) {
        Logger.error('Error while fetching order {0}: {1}', order.orderNumber, error);
    }
    next();
});

server.append('Confirm', function (req, res, next) {
    var conversionTrackerHelper = require('*/cartridge/scripts/helpers/conversionTrackerHelper');
    var SFMCJourneyFlowHelper = require('*/cartridge/scripts/helpers/SFMCJourneyFlowHelper');
    var sfmcEmailConversionService = require('*/cartridge/scripts/helpers/sfmcEmailConversionService');
    var viewData = res.viewData;
    var Transaction = require('dw/system/Transaction');
    var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');

    try {
        var BasketMgr = require('dw/order/BasketMgr');
        var basket = BasketMgr.getCurrentOrNewBasket();
        var cartSummary = cartSummaryBuilder.getCartSummary(basket);
        viewData.cartSummary = cartSummary;
    } catch (error) {
        Logger.error('Error while fetching cart summary: ' + error);
    }

    var hasBambuserProduct = false;
    var isbambuserorder = false;
    var amount = 0;
    var orderBambuser;

    var ConversionCookie = conversionTrackerHelper.getConversionCookie('Conversion');
    var service;
    var order = OrderMgr.getOrder(viewData.order.orderNumber);

    var productCouponDiscount = cartSummaryBuilder.getTotalCouponDiscount(order);
    viewData.cartSummary.cart.productCouponDiscount = productCouponDiscount;
    viewData.cartSummary.cart.hasAppliedCoupons = productCouponDiscount.value;

    // Pass totalBasePrice value to order confirmation template
    var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(order);
    if (viewData.order && viewData.order.totals) {
        viewData.order.totals.totalBasePrice = totalBasePrice;
    }

    for (var i = 0; i < order.productLineItems.length; i++) {
        var productID = order.productLineItems[i].productID;
        if (order.productLineItems[i].custom.isbambuserproduct) {
            hasBambuserProduct = true;
            amount += order.productLineItems[i].priceValue;
            productIDsArr.push(productID);
        }
    }

    if (hasBambuserProduct) {
        isbambuserorder = true;
        Transaction.wrap(function () {
            order.custom.isbambuserorder = isbambuserorder;
        });
        orderBambuser = {
            event: "purchase",
            orderId: order.currentOrderNo,
            orderValue: amount.toString(),
            orderProductIds: productIDsArr,
            currency: order.currencyCode,
        };
        viewData.orderBambuser = orderBambuser;
    }
    SFMCJourneyFlowHelper.sendOrderDetailsToSFMC(viewData.order);
    // if(dw.system.Site.getCurrent().getCustomPreferenceValue('isNorthBeamEnabled')) {
        var orderNB = []
        orderNB = {
            id: viewData.order.orderNumber,
            totalPrice: order.totalGrossPrice.value,
            shippingPrice: order.shippingTotalPrice.value,
            taxPrice: order.totalTax.value,
            coupons: '',
            currency: viewData.order.currencyCode,
            customerId:viewData.order.orderEmail,
            lineItems: []
        };
        for (var i=0; i < viewData.order.items.items.length; i++) {
            var productItems = {};
            productItems.productId = viewData.order.items.items[i].id;
            productItems.variantId = '';
            productItems.productName = viewData.order.items.items[i].productName;
            productItems.variantName = '';
            productItems.price = viewData.order.items.items[i].price.sales.value * viewData.order.items.items[i].quantity;
            productItems.quantity = viewData.order.items.items[i].quantity;
            orderNB.lineItems.push(productItems);
        }
        viewData.orderNorthBeam = orderNB;
    // }
    if (ConversionCookie) {
        var args = JSON.parse(ConversionCookie);
        var dataItems = '';
        var quantity = viewData.order.productQuantityTotal;
        for (var i=0; i < viewData.order.items.items.length; i++) {
            var productPrice = viewData.order.items.items[i].price.sales.value * viewData.order.items.items[i].quantity;
            var productName = viewData.order.items.items[i].productName;
            dataItems += "<data amt='"+productPrice+"' unit='"+productName+"' accumulate='true'/>"
        }
        var xmlData = "<system><system_name>tracking</system_name><action>conversion</action><display_order>"+quantity+"</display_order><email>"+viewData.order.orderEmail+"</email><sub_id>"+args.subscriberID+"</sub_id><job_id>"+args.jobID+"</job_id><link_alias>"+args.linkAlias+"</link_alias><list>"+args.listID+"</list><member_id>"+args.memberID+"</member_id><conversion_link_id>1</conversion_link_id><original_link_id>"+args.landingPageID+"</original_link_id><BatchID>"+args.batchID+"</BatchID><data_set>"+dataItems+"</data_set></system>";
        service = sfmcEmailConversionService.sfmcEmailConversionService();
        service.call(xmlData);
        if (service.response.statusCode === 200 && service.response.statusMessage === 'OK') {
            conversionTrackerHelper.deleteConversionCookie('Conversion');
        }
    }

    try {
        Logger.warn(
            'Order-Confirm called for order {0} by customer {1}. Session ID: {2}. Order UUID: {3} OrderDebugging',
            viewData.order.orderNumber,
            viewData.order.orderEmail,
            session.sessionID,
            viewData.orderUUID
        );
    } catch (e) {
        Logger.warn('Order-Confirm called. Error logging: {0}. OrderDebugging', e);
    }
    next();
});

server.append('CreateAccount', function (req, res, next) {
    var emailSubscribeHelpers = require('*/cartridge/scripts/helpers/EmailSubscribeHelpers');
    var viewData = res.viewData;
    var coCustomer = server.forms.getForm('coCustomer');
    var addtoemaillist = coCustomer.newsletterOptIn.addtoemaillist.value;
    try {
        if (addtoemaillist == true) {
            var email = viewData.email;
            var response = emailSubscribeHelpers.subscribeMail(email);
            res.json({
                subscribeToMail: response
            });
        }
    } catch(e) {
        Logger.error('Subscribe email error: {0}', e.message);
    }
    next();
});

module.exports = server.exports();
