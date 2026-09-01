'use strict';

var server = require('server');
server.extend(module.superModule);
var configurationHelper = require('~/cartridge/scripts/configurationHelper');

/*
    Autobahn Modification, Missing ShowInCategory endpoint
 */
function ProductShowAction(req, res, next) {
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = res.getViewData();
    if (viewData.product) {
        var buyNowData = paymentHelpers.getBuyNowData(viewData.product);

        var paymentRequest = new SalesforcePaymentRequest('buynow', '.salesforce-buynow-element');
        paymentRequest.setBasketData(buyNowData.basketData);
        paymentRequest.setOptions(buyNowData.options);

        if (buyNowData) {
            var paymentRequest = new SalesforcePaymentRequest('buynow', '.salesforce-buynow-element');

            if (buyNowData.basketData) {
                paymentRequest.setBasketData(buyNowData.basketData);
            }

            if (buyNowData.options) {
                paymentRequest.setOptions(buyNowData.options);
            }

            viewData.product.paymentRequest = paymentRequest;
        }
    }

    res.setViewData(viewData);

    configurationHelper.appendConfiguration(res);

    next();
}

server.append('Show', ProductShowAction);
server.append('ShowInCategory', ProductShowAction);

server.append('Variation', function (req, res, next) {
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = res.getViewData();

    var buynow = paymentHelpers.getBuyNowData(viewData.product);

    buynow.options = SalesforcePaymentRequest.format(buynow.options);

    viewData.product.buynow = buynow;
    res.setViewData(viewData);

    configurationHelper.appendConfiguration(res);
    next();
});

module.exports = server.exports();
