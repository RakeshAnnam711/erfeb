'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var context = res.viewData;
    if (!context.product) {
        res.setStatusCode(404);
    }

    // Additional display properties
    Object.keys(req.querystring).forEach(function (key) {
        if (['', null, undefined, 'true', 'false'].indexOf(req.querystring[key]) === -1) {
            context.display[key] = req.querystring[key];
        }
    });

    // Performance: Pass product position/index for fetchpriority optimization
    if (req.querystring.productPosition) {
        context.productIndex = parseInt(req.querystring.productPosition, 10) || 0;
    }

    var tileHelpers = require('*/cartridge/scripts/helpers/tileHelpers');
    res.viewData = tileHelpers.getTileURLs(context, req.querystring);

    res.setHttpHeader(require('dw/system/Response').X_ROBOTS_TAG, 'noindex, nofollow, noarchive');

    next();
});

// Used for inline Product tile for Asynchronous Product Tiles (EX: Einstein PD slider)
server.get('PlaceHolder', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Site = dw.system.Site.getCurrent();
    var context = {
        product: {
            id: 'placeholder',
            images: {
                card: [
                    {
                        url: '',
                        alt: '',
                        title: ''
                    }
                ]
            },
            productName: '',
            wishlistpid: '',
            price: {
                sales: {
                    formatted: '',
                    decimalPrice: '',
                    value: '',
                    currency: ''
                },
                formatted: '',
                list: null,
            },
            variationAttributes: [
                {
                    values: []
                }
            ],
            promotions: []
        },
        urls: {
            product: '',
            quickView: '',
            quickAddToCart: ''
        },
        display: {}
    };

    if (!empty(req.querystring.pid) && req.querystring.pid !== 'placeholder') {
        context.urls.replace = URLUtils.url('Tile-Show');
    }

    Object.keys(req.querystring).forEach(function (key) {
        if (req.querystring[key] === 'true') {
            context.display[key] = true;
        } else if (req.querystring[key] === 'false') {
            context.display[key] = false;
        } else if (!empty(req.querystring[key])) {
            // Additional display properties
            context.display[key] = req.querystring[key];
        }

        // Build Async Loader URL
        if (!empty(context.urls.replace)) {
            context.urls.replace.append(key, req.querystring[key]);
        }
    });

    // Do Not display ratings & swatches
    context.display.ratings = false;
    context.display.swatches = false;

    context.swatchMethod = res.viewData.abConfigs.plpSwatchShow || 'on-hover';
    context.plpContentAlignment = res.viewData.abConfigs.plpContentAlignment || 'left';
    context.plpHoverEffects = res.viewData.abConfigs.plpHoverEffects || 'bottom-border';
    context.quickbuyMethod = res.viewData.abConfigs.plpQuickbuyButtonOrIcon || 'hide';
    context.quickAddToCartMethod = res.viewData.abConfigs.plpQuickAddToCartButtonOrIcon || 'hide';
    context.abConfigs = res.viewData.abConfigs || '';

    res.render('product/gridTile', context);
    res.setHttpHeader(require('dw/system/Response').X_ROBOTS_TAG, 'noindex, nofollow, noarchive');

    next();
});

module.exports = server.exports();
