'use strict';

var seo = require('*/cartridge/scripts/middleware/seo');

module.exports = {
    registerRoute: function (route) {
        // Apply MetaData Calc to ALL Controller Routes: Allows custom pipeline fallbacks for Content Asset derived metadata
        route.on('route:Start', function (req, res) {
            if (!req.includeRequest) {
                seo.addCurrentPageMetaData(req, res, function() {/* Ignored NextFn */});
            }
        });
    }
};
