'use strict';

var Site = require('dw/system/Site');

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var wishlistViewData = require("*/cartridge/scripts/middleware/wishlistViewData");

var middlewareViewDataClean = function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) {
        // Remove erroneous param values
        ['action', 'queryString', 'siteContext', 'abConfigs'].forEach((key) => { if (key in res.viewData) delete res.viewData[key]; });
    });

    next();
};

//Never cached, so keep impact as low as possible
server.get('UncachedData', server.middleware.include, wishlistViewData.getWishlistData, middlewareViewDataClean, function (req, res, next) {
    var name = req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null;

    res.json({
        customer: {
            name: name || null,
            initial: !empty(name) ? name.charAt(0).toUpperCase() : null,
            isAuthenticated: customer.authenticated
        }
    });

    next();
});

//Cached 24 hours, so keep that in mind
server.get('CachedData', server.middleware.include, cache.applyDefaultCache, middlewareViewDataClean, function (req, res, next) {
    var Site = require('dw/system/Site');

    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var current = Site.getCurrent();
    var json = res.viewData;
    json.sitePreferences = json.sitePreferences || {};

    if (current.getCustomPreferenceValue('enableRecaptcha')) {
        var key = current.getCustomPreferenceValue('recaptchaSiteKey');
        if (!key) {
            key = require('*/cartridge/scripts/middleware/recaptcha').recaptchaVerifyService().configuration.credential.user;
        }
        json.sitePreferences.recaptchaSiteKey = key;
        json.sitePreferences.enableRecaptcha = true;
    }

    if (res.viewData.abConfigs.headerSearchMinTermLength) {
        json.sitePreferences.headerSearchMinTermLength = res.viewData.abConfigs.headerSearchMinTermLength;
    }

    json.skipReviewStepInCheckout = current.getCustomPreferenceValue('skipReviewStepInCheckout');

    var apiKey = current.getCustomPreferenceValue('googleApiKey');

    if (apiKey) {
        var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
        json.googleMapsApi = storeHelpers.getGoogleMapsApi(apiKey);
    }

    // WGACA MODIFICATION - Add locale details
    var LocaleModel = require('*/cartridge/models/locale');
    var Locale = require('dw/util/Locale');
    var Site = require('dw/system/Site');

    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();
    var allowedLocales = currentSite.allowedLocales;
    var currentLocale = Locale.getLocale(req.locale.id);
    var localeModel = new LocaleModel(currentLocale, allowedLocales, siteId);
    // END MODIFICATION

    json.template = json.template || {};
    json.template.authAccountHeader = renderTemplateHelper.getRenderedHtml({}, 'account/headerMenuAuthenticated');
    json.template.authMobileAccountHeader = renderTemplateHelper.getRenderedHtml({localeModel: localeModel}, 'account/mobileHeaderAuthenticated');

    res.json(json);

    next();
});

module.exports = server.exports();
