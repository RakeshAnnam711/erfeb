'use strict';

var server = require('server');

server.extend(module.superModule);

var OrderMgr = require('dw/order/OrderMgr');

server.append('Confirm', function (req, res, next) {
    var viewData = res.getViewData();
    var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
    var productIDsArr = [];
    for (var i = 0; i < order.productLineItems.length; i++) {
        var productID = order.productLineItems[i].productID;
        productIDsArr.push(productID);
    }
    order = {
        event: "purchase",
        orderId: order.currentOrderNo,
        orderValue: order.totalGrossPrice.value.toString(),
        orderProductIds: productIDsArr,
        currency: order.currencyCode,
    };
    viewData.orderBambuser = order;
    res.setViewData(viewData);
    
    next();
});

module.exports = server.exports();
