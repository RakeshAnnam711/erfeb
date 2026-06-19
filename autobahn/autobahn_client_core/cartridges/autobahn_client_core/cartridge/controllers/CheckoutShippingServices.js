'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var taxCalculationHelpers = require('*/cartridge/scripts/helpers/taxCalculationHelpers');

server.append('SelectShippingMethod', server.middleware.https, function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket) {
            var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
            if(res.viewData.order){
                res.viewData.order.totals.totalBasePrice = totalBasePrice;
            }

            if (taxCalculationHelpers.hasTaxCalculationError()) {
                res.json(taxCalculationHelpers.getTaxCalculationErrorResponse());
            }
        }
    });

    return next();
});

server.append('UpdateShippingMethodsList', server.middleware.https, function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket) {
            var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
            if(res.viewData.order){
                res.viewData.order.totals.totalBasePrice = totalBasePrice;
            }

            if (taxCalculationHelpers.hasTaxCalculationError()) {
                res.json(taxCalculationHelpers.getTaxCalculationErrorResponse());
            }
        }
    });

    return next();
});

server.append(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) {
            var currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket) {
                var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
                if(res.viewData.order){
                    res.viewData.order.totals.totalBasePrice = totalBasePrice;
                }

                if (taxCalculationHelpers.hasTaxCalculationError()) {
                    res.json(taxCalculationHelpers.getTaxCalculationErrorResponse());
                }
            }
        });

        return next();
    });

module.exports = server.exports();
