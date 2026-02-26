'use strict';

var server = require('server');
server.extend(module.superModule);

var pageDesignerPDP = function(req, res, next) {
    var Logger = require('dw/system/Logger').getLogger('RVWPageDesigner');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    try {
        var viewData = res.getViewData();
        // Rely on previously run product page helper result from base to prevent multiple product model calls
        var showProductPageHelperResult = viewData.showProductPageHelperResult || productHelper.showProductPage(req.querystring, req.pageMetaData);
        var pageLookupResult = productHelper.getPageDesignerProductPage(showProductPageHelperResult.product);

        if (pageLookupResult && pageLookupResult.page) {
            // Format breadcrumb URLs to prevent from rendering as [object, Object]
            if (viewData.breadcrumbs) {
                viewData.breadcrumbs.forEach(function(breadcrumb) {
                    breadcrumb.url = breadcrumb.url ? breadcrumb.url.toString() : '';
                });
            }
            // Cache is reset by cartridge/scripts/hooks/pageDesignerCache
            // res.cachePeriod = 0;
            res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
        }
    } catch(error) {
        Logger.warn('PageDesigner Product-Show Error. {0}, in {1} at {2}', error.message, error.fileName, error.lineNumber);
    }

    next();
}

server.append('Show', pageDesignerPDP);
server.append('ShowInCategory', pageDesignerPDP);

module.exports = server.exports();
