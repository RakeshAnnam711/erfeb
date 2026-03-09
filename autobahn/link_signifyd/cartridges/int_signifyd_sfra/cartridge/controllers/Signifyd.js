'use strict';

var server = require('server');

server.get('IncludeFingerprint', server.middleware.include, function (req, res, next) {
    require('dw/template/ISML').renderTemplate('signifyd_device_fingerprint');
});

server.post('Callback', server.middleware.https, function (req, res, next) {
    var sig = require('int_signifyd_sfra/cartridge/scripts/service/signifyd');
    var order = sig.Callback(request);
    if (order) {
        res.json({
            success: true,
            SignifydGuaranteeDisposition: order.custom.SignifydGuaranteeDisposition ? order.custom.SignifydGuaranteeDisposition.value : '',
            SignifydFraudScore: order.custom.SignifydFraudScore,
            SignifydOrderURL: order.custom.SignifydOrderURL,
            exportStatus: order.exportStatus.value
        });
    } else {
        res.setStatusCode(500);
        res.json({
            success: false
        });
    }
    next();
});

module.exports = server.exports();
