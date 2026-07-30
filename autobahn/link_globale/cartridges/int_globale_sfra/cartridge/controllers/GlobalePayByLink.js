'use strict';

var server = require('server');

/**
 * PayByLink entry point for Global-e Checkout
 */
server.get(
    'CheckoutShow',
    server.middleware.https,
    function (req, res, next) {
        var globaleRequest = require('*/cartridge/models/globale/request');
        var httpParameterMap = globaleRequest.get('httpParameterMap');

        res.render('globale/checkout/iframe', {
            checkoutData: {
                success: true,
                cartToken: httpParameterMap.cartToken.value
            }
        });
        next();
    }
);

/**
 * SFCC end point for PayByLink order create
 */
server.post(
    'OrderCreate',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var globaleRequest = require('*/cartridge/models/globale/request');

        var currentBasket = BasketMgr.getCurrentBasket();
        var httpParameterMap = globaleRequest.get('httpParameterMap');

        if (!currentBasket) {
            res.json({
                success: false,
                error: true,
                errorMessage: 'The basket is not valid. Please return to the cart page and review it'
            });
            return next();
        }

        var orderCreateResult = require('*/cartridge/scripts/factories/globale/checkout/payByLinkOrderCreate')(currentBasket, httpParameterMap.cartToken.value);

        res.json({
            success: orderCreateResult.success,
            orderCreateResult
        });

        return next();
    }
);

module.exports = server.exports();
