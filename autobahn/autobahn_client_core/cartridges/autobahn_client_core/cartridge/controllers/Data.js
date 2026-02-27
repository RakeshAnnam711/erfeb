'use strict';

var server = require('server');
server.extend(module.superModule);


var Site = require('dw/system/Site');
var System = require('dw/system/System');

server.append('CachedData', function (req, res, next) {
    if (System.getInstanceType() !== System.PRODUCTION_SYSTEM) {
        res.setViewData({
            isProduction: false
        });
    }

    res.setViewData({
        seoLocale: res.viewData.locale.toLowerCase().replace('_','-'),
        countryCode: res.viewData.locale.replace(/[a-z_]g/,'')
    });

    next();
});

server.append('UncachedData', function (req, res, next) {
    var geCountry = require('*/cartridge/models/globale/session').get('geCountry').toLowerCase();
    res.setViewData({
        currencyCode: session.currency ? session.currency.currencyCode : Site.getCurrent().defaultCurrencyCode,
        geCountry: geCountry
    });

    next();
});
module.exports = server.exports();
