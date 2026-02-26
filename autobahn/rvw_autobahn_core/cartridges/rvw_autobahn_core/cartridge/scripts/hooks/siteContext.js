'use strict';

module.exports = {
    registerRoute: function (route) {
        var siteContextHelper = require('*/cartridge/scripts/helpers/siteContextHelper');

        route.on('route:Start', function (req, res) {
            var siteContext = siteContextHelper.getSiteContext(req);

            if (siteContext && siteContext.ID) {
                if (!req.includeRequest) {
                    req.session.raw.custom.siteContextID = siteContext.ID;
                }

                res.setViewData({ siteContext: siteContext });
            }
        });

        // Remove siteContext from view data at final rending steps to prevent overloading JSON.stringify for template rendering (Page Designer)
        route.on('route:BeforeComplete', function (req, res) {
            var rendering = (res.renderings || []).find(function (rendering) { return rendering.type === 'render' });
            var siteContext = res.viewData.siteContext;

            if (!empty(siteContext)) {
                if (!rendering || rendering.subType !== 'isml') {
                    if (rendering && rendering.subType === 'page') {
                        delete res.viewData.siteContext;
                    } else {
                        var hiddenSiteContext = new Object();

                        Object.keys(siteContext).forEach(function (key) {
                            Object.defineProperty(hiddenSiteContext, key, {
                                enumerable: false,
                                value: siteContext[key]
                            })
                        });

                        res.setViewData({ siteContext: hiddenSiteContext });
                    }
                }
            }
        });
    }
};
