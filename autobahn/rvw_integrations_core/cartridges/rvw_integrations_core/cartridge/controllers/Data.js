'use strict';

var page = module.superModule;
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.extend(page);

server.append('CachedData', function (req, res, next) {
    var json = res.viewData;
    var integrationsHelper = require('*/cartridge/scripts/util/integrationsHelper');
    json.siteIntegrations = integrationsHelper.buildIntegrationsConfigObject();

    res.json(json);

    next();
});

module.exports = server.exports();
