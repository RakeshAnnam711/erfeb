'use strict';

const server = require('server');

server.extend(module.superModule);

server.append('Confirm', function(req, res, next) {
    const prefs = require('*/cartridge/config/preferences');

    res.setViewData({
        paypal: {
            // Indicates whether to show shipping info message in case of Digital Goods (Pay Now) flow
            isShippingInfoMsg: prefs.isDigitalGoodsFlowEnabled
        }
    });

    return next();
});

server.append('History', function(req, res, next) {
    const orderHelper = require('*/cartridge/scripts/paypal/helpers/orderHelper');

    const viewData = res.getViewData();
    const orders = orderHelper.fillOrderDetails(req, viewData.orders);

    if (orders.length) {
        viewData.orders = orders;

        res.setViewData(viewData);
    }

    next();
});

module.exports = server.exports();
