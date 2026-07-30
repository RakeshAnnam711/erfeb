'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var subproEnabled = require('dw/system/Site').getCurrent().getCustomPreferenceValue('subproEnabled');
var page = module.superModule;

server.extend(page);

server.append('Begin', function (req, res, next) {
    if (subproEnabled) {
        res.setViewData({isSubPro: require('*/cartridge/scripts/subpro/lib/subscribeProLib').isSubPro()});
    }
    next();
})

module.exports = server.exports();
