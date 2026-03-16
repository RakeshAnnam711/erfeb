'use strict';

/**
 * @namespace DiscountStatusBar
 */

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.get('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var discountStatusBarHelper = require('*/cartridge/scripts/experience/utilities/discountStatusBarHelper.js');
    var campaignId = req.querystring.campaignId || null;
    var completionMessage = req.querystring.completionMessage || '';
    var data = discountStatusBarHelper.getData(campaignId);
    var context = {
        checkpoints: data.checkpoints,
        total: data.total,
        fillPercentage: data.fillPercentage,
        completionMessage: completionMessage
    }

    res.viewData = context;

    res.render('experience/components/commerce_assets/discountStatusBar', context);

    next();
});

module.exports = server.exports();
