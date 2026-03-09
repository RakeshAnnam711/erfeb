/* global empty, session */
'use strict';

/*
* Hook extension for dw.order.calculateShipping
* This is used to allow Zenkraft Real Time Shipping Rates to
* be used in place of standard SFCC rates
*/

exports.calculateShipping = function (basket) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var Status = require('dw/system/Status');
    var realTimeRates = require('~/cartridge/scripts/realTimeRates');

    if (!empty(session.privacy.zenkraftCosts)) {
        realTimeRates.calculateShippingCost(basket, JSON.parse(session.privacy.zenkraftCosts));
    // WGACA MODIFICATION - additional condition
    // } else {}
    } else if (empty(basket.custom.flowOrderNo)) {
        ShippingMgr.applyShippingCost(basket);
    }
    return new Status(Status.OK);
};
