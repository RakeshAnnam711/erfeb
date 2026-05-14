"use strict";

var Status = require("dw/system/Status");
var URLUtils = require("dw/web/URLUtils");
var ApplePayHookResult = require("dw/extensions/applepay/ApplePayHookResult");

exports.placeOrder = function(order) {
    return new ApplePayHookResult(
        new Status(Status.OK),
        URLUtils.https("CheckoutServices-PlaceApplePayOrder", "orderID", order.orderNo, "token", order.orderToken)
    );
};
