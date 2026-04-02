'use strict';

var server = require('server');
var shippingservice = module.superModule;
server.extend(shippingservice);

server.append('PlaceOrder', function shippingMethodSelection(req, res, next) {
    var viewData = res.getViewData();
    //AUTOBAHN MOD, some payment methods like adyen klarna have a redirect without orderID yet created first time around
    if (viewData.orderID) {
        var OrderMgr = require('dw/order/OrderMgr');
        var ShippingMgr = require('dw/order/ShippingMgr');
        var Transaction = require('dw/system/Transaction');
        var shippingMethods =  ShippingMgr.getAllShippingMethods().toArray();
        var order = OrderMgr.getOrder(viewData.orderID);
        var orderShipment = order.getShipments()[0];
        var sessionCustom = session.getPrivacy();
        shippingMethods.forEach(function (shippingMethod) {
            if (orderShipment.shippingMethodID === shippingMethod.ID && shippingMethod.custom.dropOffMethod && sessionCustom.drop_off_location_data) {
                var locationObject = JSON.parse(sessionCustom.drop_off_location_data);
                Transaction.wrap(function () {
                    if (locationObject.location_code && !empty(locationObject.location_code)) {
                        orderShipment.custom.zenkraftDOPULocationCode = locationObject.location_code;
                    }
                    if (locationObject.location_name && !empty(locationObject.location_name)) {
                        orderShipment.custom.zenkraftDOPULocationName = locationObject.location_name;
                    }
                });
            }
            if (orderShipment.shippingMethodID === shippingMethod.ID && shippingMethod.custom.futureDateDelivery && shippingMethod.custom.futureDateDelivery > 0 && sessionCustom.requested_delivery_date) {
                var dateObject = JSON.parse(sessionCustom.requested_delivery_date);
                if (dateObject.methodID === orderShipment.shippingMethodID) {
                    Transaction.wrap(function () {
                        orderShipment.custom.zenkraftRequestedDeliveryDate = new Date(parseInt(dateObject.date));
                    });
                }
            }
        });
    }
    return next();
});

module.exports = server.exports();
