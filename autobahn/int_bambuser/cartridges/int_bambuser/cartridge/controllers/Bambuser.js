'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var bambuserHelpers = require('~/cartridge/scripts/bambuser/bambuserHelpers');

/**
 * filter to check that bambuser integration is enabled
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function featureEnabled(req, res, next) {
    next(bambuserHelpers.isFeatureEnabled() ? null : new Error('Feature Disabled'));
}

/**
 * filter to check that overview is enabled
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function overviewEnabled(req, res, next) {
    next(bambuserHelpers.isOverviewEnabled() ? null : new Error('Feature Disabled'));
}

/**
 * Gets available shows from the bambuser api.
 * Renders the TestPage
 */
server.get('Overview', featureEnabled, overviewEnabled, function (req, res, next) {
    var liveShoppingService = require('~/cartridge/scripts/bambuser/liveshoppingservice');
    var showList = liveShoppingService.getShows();
    var shows = {
        upcoming: [],
        live: [],
        ended: []
    };
    req.pageMetaData.setTitle('Bambuser');
    req.pageMetaData.setDescription('Bambuser Stream Overview Page');
    showList.forEach(function (show) {
        var status = 'upcoming';
        if (show.isLive) status = 'live';
        if (show.endedAt) status = 'ended';
        shows[status].push(show);
    });
    res.render('bambuser/overview', { shows: shows });
    next();
});

/**
 * Renders the Bambuser frontend config object
 */
server.get('Config', cache.applyDefaultCache, server.middleware.include, function (req, res, next) {
    var configObj = bambuserHelpers.getBambuserConfig();
    res.render('bambuser/components/config', { config: JSON.stringify(configObj) });
    next();
});

/**
 * Renders product JSON to pass on to bambuser frontend SDK
 */
server.get('Product', featureEnabled, cache.applyDefaultCache, function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var BambuserProduct = require('*/cartridge/models/bambuser/product');
    var ref = req.querystring.ref;
    var id = req.querystring.id;

    try {
        var pid = bambuserHelpers.getProductIdFromRef(ref);
        // query shop
        var apiProduct = ProductMgr.getProduct(pid);
        var bambuserProduct = new BambuserProduct(apiProduct, id);
        res.json({
            product: bambuserProduct.id ? bambuserProduct : null
        });
    } catch (e) {
        res.setStatusCode(400);
        res.json({ errorMessage: e });
    }
    next();
});

server.get('GetBasket', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal = 0;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    }

    res.json({
        quantityTotal: quantityTotal
    });

    return next();
});

module.exports = server.exports();
