'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var simplifiedStandardPDP = function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;

    // Make Product Page Result Helper object (extensible) available to followup appends without causing re-evals
    res.setViewData({ showProductPageHelperResult: showProductPageHelperResult });
    // Remove large object value once routing is complete
    this.on('route:BeforeComplete', function (req, res) {
        var rendering = (res.renderings || []).find(function (rendering) { return rendering.type === 'render' });

        if (!rendering || rendering.subType !== 'isml') {
            delete res.viewData.showProductPageHelperResult;
            delete res.viewData.product;
            delete res.viewData.addToCartUrl;
            delete res.viewData.resources;
            delete res.viewData.canonicalUrl;
            delete res.viewData.schemaData;
        }
    });

    if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        res.render(showProductPageHelperResult.template, {
            product: showProductPageHelperResult.product,
            addToCartUrl: showProductPageHelperResult.addToCartUrl,
            resources: showProductPageHelperResult.resources,
            breadcrumbs: showProductPageHelperResult.breadcrumbs,
            canonicalUrl: showProductPageHelperResult.canonicalUrl,
            schemaData: showProductPageHelperResult.schemaData
        });
    }
    next();
};

// Modification to reduce duplicate logical steps for Page Design and Template based PDPs
server.replace('Show', consentTracking.consent, simplifiedStandardPDP, cache.applyDynamicPromotionSensitiveCache);
server.replace('ShowInCategory', consentTracking.consent, simplifiedStandardPDP, cache.applyDynamicPromotionSensitiveCache);

module.exports = server.exports();
