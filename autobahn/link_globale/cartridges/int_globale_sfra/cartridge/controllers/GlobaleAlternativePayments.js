'use strict';

var server = require('server');

/**
 * SFCC end point for Global-e ValidatePayment API
 */
server.post(
    'ValidatePayment',
    server.middleware.https,
    function (req, res, next) {
        res.json((require('*/cartridge/scripts/factories/globale/alternativePayments'))().validate());
        next();
    }
);

/**
 * SFCC end point for Global-e RedeemPayment API
 */
server.post(
    'RedeemPayment',
    server.middleware.https,
    function (req, res, next) {
        res.json((require('*/cartridge/scripts/factories/globale/alternativePayments'))().redeem());
        next();
    }
);

/**
 * SFCC end point for Global-e RefundPayment API
 */
server.post(
    'RefundPayment',
    server.middleware.https,
    function (req, res, next) {
        res.json((require('*/cartridge/scripts/factories/globale/alternativePayments'))().refund());
        next();
    }
);

module.exports = server.exports();
