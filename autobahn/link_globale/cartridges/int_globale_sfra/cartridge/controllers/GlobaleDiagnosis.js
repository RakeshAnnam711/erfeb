'use strict';

var server = require('server');

var authorize = function (req, res, next) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var merchantGuid = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid);
    if (req.querystring.merchantGuid.toLowerCase() !== merchantGuid.toLowerCase()) {
        return next(new Error('401'));
    }
    return next();
};

server.get('SitePreferences', authorize, function (req, res, next) {
    var geDiagnosis = require('*/cartridge/scripts/helpers/globaleDiagnosis');
    var prefs = geDiagnosis.getPreferences();
    res.json(prefs);
    return next();
});

server.get('GetProductAttributes', authorize, function (req, res, next) {
    var geDiagnosis = require('*/cartridge/scripts/helpers/globaleDiagnosis');
    if (!empty(req.querystring.productId)) {
        var product = geDiagnosis.getProductAttributes(req.querystring.productId);
        res.json(product);
    } else {
        res.json({ error: 'Missing productId' });
    }
    return next();
});

server.get('GetSendCartData', authorize, function (req, res, next) {
    var geDiagnosis = require('*/cartridge/scripts/helpers/globaleDiagnosis');
    var sendCartData = geDiagnosis.getSendCartData();
    res.json(sendCartData);
    return next();
});

server.get('RunJob', authorize, function (req, res, next) {
    var geDiagnosis = require('*/cartridge/scripts/helpers/globaleDiagnosis');
    var jobName = req.querystring.JobName || null;
    res.json(geDiagnosis.runGlobaleJob(jobName));
    return next();
});

module.exports = server.exports();
