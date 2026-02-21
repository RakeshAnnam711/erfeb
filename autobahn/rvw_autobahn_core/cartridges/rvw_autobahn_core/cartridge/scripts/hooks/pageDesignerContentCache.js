'use strict';
var PageMgr = require('dw/experience/PageMgr');

module.exports = {
    registerRoute: function (route) {
        route.on('route:BeforeComplete', function (req, res) {
            var rendering = (res.renderings || []).find(function (rendering) { return rendering.type === 'render' });

            // Prevent page cache for Page Desinger includes as ServerJS runs PD through __SYSTEM-... includes (specialized cache) if rules apply
            if (rendering && rendering.subType === 'page' && rendering.page && PageMgr.getPage(rendering.page).hasVisibilityRules()) {
                res.cachePeriod = 0;
            }

            res.viewData.contentIncludeCache = !empty(res.cachePeriod) && res.cachePeriod !== 0;
        });
    }
};
