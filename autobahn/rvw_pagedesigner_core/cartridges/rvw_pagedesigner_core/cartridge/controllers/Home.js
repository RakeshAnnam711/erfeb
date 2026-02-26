'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var Logger = require('dw/system/Logger').getLogger('RVWPageDesigner');
    var PageMgr = require('dw/experience/PageMgr');

    try {
        var viewData = res.getViewData();
        var page = PageMgr.getPage(viewData.abConfigs.pdHomePageID);

        // Extend brand support for PD specific assets
        if (!page || !page.isVisible()) {
            page = PageMgr.getPage('homepage_' + viewData.abConfigs.brandID);
        }

        // Fallback for general PD HomePage
        if (!page || !page.isVisible()) {
            page = PageMgr.getPage('homepage');
        }

        // if there is a page and it is visible for this locale/site
        if (page != null && page.isVisible()) {
            res.page(page.ID);
        }
    } catch(error) {
        Logger.error('PageDesigner Home-Show Error. {0}, in {1} at {2}', error.message, error.fileName, error.lineNumber);
    }

    next();
});

module.exports = server.exports();
