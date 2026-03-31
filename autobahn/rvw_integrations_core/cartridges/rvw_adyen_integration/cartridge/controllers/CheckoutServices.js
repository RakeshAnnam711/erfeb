"use strict";

var server = require('server');

server.extend(module.superModule);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

server.post("PlaceApplePayOrder", server.middleware.https, function(req, res, next) {
    var OrderMgr = require("dw/order/OrderMgr");
    var Transaction = require("dw/system/Transaction");
    var URLUtils = require("dw/web/URLUtils");
    var order = OrderMgr.getOrder(req.querystring.orderID, req.querystring.token);

    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var fraudDetectionStatus = hooksHelper(
        "app.fraud.detection",
        "fraudDetection",
        order,
        require("*/cartridge/scripts/hooks/fraudDetection").fraudDetection
    );

    if (fraudDetectionStatus.status === "fail") {
        Transaction.wrap(function() {
            OrderMgr.failOrder(order);
        });
        // fraud detection failed
        req.session.privacyCache.set("fraudDetectionStatus");
        res.redirect(URLUtils.https("Error-ErrorCode", "err", "02", "errorType", "placeOrder"));

        return next();
    }

    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus, true);

    if (placeOrderResult.error) {
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));

        return next();
    }

    COHelpers.sendConfirmationEmail(order, req.locale.id);

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set("usingMultiShipping", false);
    res.render('/checkout/confirmation/orderConfirmPostRedirect', { orderID: order.orderNo, orderToken: order.orderToken });

    return next();
});

module.exports = server.exports();
