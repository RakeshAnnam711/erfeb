'use strict';

var Site = require('dw/system/Site');

var current = Site.getCurrent();
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var cache = require('*/cartridge/scripts/middleware/cache');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var server = require('server');
server.extend(module.superModule);

// Cacheing rule inherited from RVW Integrations Base or AppStorefrontBase
server.append('Show', pageMetaData.computedPageMetaData);
server.append('ShowInCategory', pageMetaData.computedPageMetaData);

server.replace('SizeChart', cache.applyDefaultCache, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var Logger = require('dw/system/Logger').getLogger('AB_ContentAsset');
    var ContentModel = require('*/cartridge/models/content');

    var apiContent = ContentMgr.getContent(req.querystring.cid);

    if (apiContent) {
        var content = new ContentModel(apiContent, '/components/content/contentAssetBodyOnly');
        if (content.template) {
            res.render(content.template, { content: content});
        } else {
            Logger.warn('Content asset with ID {0} is offline', req.querystring.cid);
            res.render('/components/content/offlineContent');
        }
    } else {
        Logger.warn('Content asset with ID {0} was included but not found', req.querystring.cid);
    }
    next();
});

server.append('ShowBonusProducts', function (req, res, next) {
    var duuid = req.querystring.DUUID;

    // Update moreUrl to include maxPids for 'more' button results
    if (duuid && !req.querystring.pids) {
        var URLUtils = require('dw/web/URLUtils');
        var pageStart = parseInt(req.querystring.pagestart, 10);
        var pageSize = parseInt(req.querystring.pagesize, 10);
        var maxPids = req.querystring.maxpids;
        var moreUrl = URLUtils.url('Product-ShowBonusProducts', 'DUUID', duuid, 'pagesize', pageSize, 'pagestart', pageStart + pageSize, 'maxpids', maxPids).toString();

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            viewData.moreUrl = moreUrl;

            res.json({
                renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template)
            });
        });
    }

    next();
});

/**
 * Product-ShowQuickAddToCart : This endpoint is called when a product quick add to cart button is clicked
 * @name Base/Product-ShowQuickAddToCart
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - Product ID
 * @param {serverfunction} - get
 */
 server.get('ShowQuickAddToCart', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var params = req.querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var template = 'product/quickAddToCart/quickAddToCart.isml';

    res.setViewData({
        product: product,
        addToCartUrl: addToCartUrl,
        resources: productHelper.getResources(),
        template: template
    });

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        var renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, viewData.template);

        res.json({
            renderedTemplate: renderedTemplate
        });
    });

    next();
});

server.append('ShowQuickView', function (req, res, next) {
    var viewData = res.getViewData();
    var quickViewSource = req.httpParameterMap.get('source').stringValue;
    viewData.quickViewSource = quickViewSource;
    if (quickViewSource === 'quickview-wishlist') {
        viewData.addToCartUrl = false;
    }
    res.setViewData(viewData);
    next();
});

/**
 * Adding in VariationHTML controller url to product to call after AttributeSelect
 */
server.append('Variation', function (req, res, next) {
    var UrlUtils = require('dw/web/URLUtils');

    res.viewData.product.variationHtmlUrl = UrlUtils.url('Product-VariationHTML').toString() + '?' + res.viewData.queryString;

    next();
});

/**
 * Because SFCC fails trying to render waincludes in json, we need an additional endpoint to fetch tabs and collapse stuff
 */
server.get('VariationHTML', function (req, res, next) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var params = req.querystring;
    var product = ProductFactory.get(params);

    res.render('product/components/variationHtml', {product: product});

    next();
});

server.get('ShowBackInStockNotification', csrfProtection.generateToken, function (req, res, next) {
    var abConfigs = res.viewData.abConfigs;
    var bisnEnabled = abConfigs.viewBackInStockNotificationForm && abConfigs.viewOutOfStockItems;

    var customer = session.getCustomer();
    var profile = customer && customer.profile;
    var userEmail = profile && profile.email;

    res.setViewData({
        bisnEnabled: !!bisnEnabled,
        email: userEmail || '',
        pid: req.querystring.pid
    });

    res.render('product/components/backInStockNotification');

    next();
});

module.exports = server.exports();
