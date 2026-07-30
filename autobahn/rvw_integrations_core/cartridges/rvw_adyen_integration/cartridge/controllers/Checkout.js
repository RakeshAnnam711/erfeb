'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

server.append('Begin', function (req, res, next) {
    var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
    res.viewData.AdyenHelper = AdyenHelper;
    res.viewData.AdyenConfigs = AdyenConfigs;
    next();
});

module.exports = server.exports();
