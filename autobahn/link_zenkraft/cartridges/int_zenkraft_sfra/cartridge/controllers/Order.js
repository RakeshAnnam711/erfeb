/* global request, empty, response, dw */
// Checkout.js

'use strict';

var server = require('server');
var order = module.superModule;
server.extend(order);

server.append('History', function (req, res, next) {
    var Site = require('dw/system/Site');
    var viewData = res.getViewData();
    var orders = viewData.orders;
    var Zenkraft = require('~/cartridge/scripts/zenkraft');

    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftTrackingOnOrderHistory')) {
        // eslint-disable-next-line no-unused-vars
        var newOrders;

        newOrders = orders.map(function (orderModel) {
            var result = orderModel;
            var trackInfo;

            if (orderModel.firstShipmentTrackNo !== 'Pending' && orderModel.firstShipmentCarrier !== 'Pending') {
                trackInfo = Zenkraft.getTrackingInfo(orderModel.firstShipmentTrackNo, orderModel.firstShipmentCarrier.toLowerCase());
            }

            if (!empty(trackInfo)) {
                result.trackStatus = trackInfo.status || 'Pending';
                result.tracking_stage = trackInfo.tracking_stage || 'CREATED';
            } else {
                result.trackStatus = 'Pending';
            }

            return result;
        });
    }

    next();
});

server.append('Details', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.querystring.orderID);
    var shippingStatus = order.getShippingStatus().getValue();
    var viewData = res.getViewData();
    viewData.isOrderShipped = shippingStatus === 2;

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
