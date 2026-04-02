'use strict';

var server = require('server');
server.extend(module.superModule);

server.replace('ConfirmHostedCheckout', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var CheckoutHelper = require('*/cartridge/scripts/flow/helpers/checkoutHelper');

    var orderNo = req.querystring.oid;
    var url = URLUtils.https('Error-ErrorCode', 'err', '01');
    var order;

    if (FlowHelper.isFlowEnabled) {
        order = orderNo ? CheckoutHelper.handleCallback(orderNo) : null;

        if (order) {
            res.render('flow/checkout/posthack', {
                url: URLUtils.https('CheckoutServices-PlaceOrder')
            });

            return next();
        }
    } else {
        url = URLUtils.url('Error-Forbidden');
    }

    res.redirect(url);
    next();
});

module.exports = server.exports();
