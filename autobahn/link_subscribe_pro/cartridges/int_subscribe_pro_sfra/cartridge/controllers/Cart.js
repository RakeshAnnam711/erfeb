'use strict';

var page = module.superModule;
var server = require('server');

server.extend(page);

server.append('Show', function(req, res, next) {
    var subproEnabled = require('dw/system/Site').getCurrent().getCustomPreferenceValue('subproEnabled');
    if (subproEnabled) {
        var AccountModel = require('*/cartridge/models/account');
        res.setViewData({
            customer: new AccountModel(req.currentCustomer),
            isSubPro: require('*/cartridge/scripts/subpro/lib/subscribeProLib').isSubPro()
        });
    }
    next();
});

module.exports = server.exports();
