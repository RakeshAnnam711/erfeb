'use strict';

var Logger = require('dw/system/Logger');
var HookMgr = require('dw/system/HookMgr');
var Resource = require('dw/web/Resource');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var server = require('server');
server.extend(module.superModule);

server.post('BackInStockSubscribeJSON', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var logger = Logger.getLogger('BackInStockSubscribe');

    var hookResult;
    var result = {
        success: false,
        error: true,
        msg: Resource.msg('form.email.error.fallback', 'product', null)
    };

    if (res.viewData.abConfigs.viewOutOfStockItems && res.viewData.abConfigs.viewBackInStockNotificationForm) {
        try {
            hookResult = HookMgr.callHook('app.backinstock.subscribe', 'subscribeBackInStockNotification', req, res) || {};
            Object.assign(result, hookResult); // merge base result with hook result
        } catch (err){
            result.msg = err.message;
            logger.warn('Hook Error: {0}, line {1} in {2}', err.message, err.lineNumber, err.fileName);
        }
    } else {
        result.msg = null;
    }
    // Place holder for ERP/BSIN system integration
    res.json(result);

    next();
});

module.exports = server.exports();
