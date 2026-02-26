'use strict';

var server = require('server');
server.extend(module.superModule);
var configurationHelper = require('~/cartridge/scripts/configurationHelper');

/**
 * Appends updated payment request options to the given response.
 * @param {Object} req - The request object for the current controller request
 * @param {Object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function appendPaymentRequestOptions(req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    configurationHelper.appendConfiguration(res);
    var viewData = res.getViewData();

    if (viewData.commercePaymentsConfiguration.expressCheckoutEnabled) {
        viewData.paymentRequestOptions = COHelpers.calculatePaymentRequestOptions();
    }

    res.setViewData(viewData);
    next();
}

server.append('EditProductLineItem', appendPaymentRequestOptions);
server.append('RemoveProductLineItem', appendPaymentRequestOptions);
server.append('UpdateQuantity', appendPaymentRequestOptions);
server.append('SelectShippingMethod', appendPaymentRequestOptions);
server.append('AddCoupon', appendPaymentRequestOptions);
server.append('RemoveCouponLineItem', appendPaymentRequestOptions);

server.append('Show', function (req, res, next) {
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = res.getViewData();
    viewData.paymentRequestData = paymentHelpers.createPaymentRequestData();
    res.setViewData(viewData);

    configurationHelper.appendConfiguration(res);
    next();
});

server.append('MiniCartShow', function (req, res, next) {
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = res.getViewData();
    viewData.paymentRequestData = paymentHelpers.createPaymentRequestData();
    res.setViewData(viewData);

    configurationHelper.appendConfiguration(res);
    next();
});

module.exports = server.exports();
