'use strict';

const server = require('server');

const cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Includes-Constants : The endpoint is used as a remote include that renders the constant values ISML template
 * @name PayPal/Includes-Constants
 * @function
 * @memberof Includes
 * @param {middleware} - server.middleware.include
 * @param {middleware} - cache.applyDefaultCache
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Constants', server.middleware.include, cache.applyDefaultCache, function(req, res, next) {
    res.render('common/paypalConstants', {
        paypalConstantsString: JSON.stringify(require('*/cartridge/config/constants'))
    });

    next();
});

/**
 * Includes-Urls : The endpoint is used as a remote include that renders the URLs ISML template
 * @name PayPal/Includes-Urls
 * @function
 * @memberof Includes
 * @param {middleware} - server.middleware.include
 * @param {middleware} - cache.applyDefaultCache
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Urls', server.middleware.include, cache.applyDefaultCache, function(req, res, next) {
    res.render('common/paypalUrls', {
        paypalUrlsString: JSON.stringify(require('*/cartridge/config/urls'))
    });

    next();
});

/**
 * Includes-SDK : The endpoint is used as a remote include that renders the SDK URLs ISML template
 * @name PayPal/Includes-SDK
 * @function
 * @memberof Includes
 * @param {middleware} - server.middleware.include
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('SDK', server.middleware.include, function(req, res, next) {
    res.render('common/paypalSDK', {
        paypalSDKString: JSON.stringify(require('*/cartridge/config/sdk'))
    });

    next();
});

/**
 * Includes-Preferences : The endpoint is used as a remote include that renders the site preferences ISML template
 * @name PayPal/Includes-Preferences
 * @function
 * @memberof Includes
 * @param {middleware} - server.middleware.include
 * @param {middleware} - cache.applyDefaultCache
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Preferences', server.middleware.include, cache.applyDefaultCache, function(req, res, next) {
    const prefs = require('*/cartridge/config/preferences');

    res.render('common/paypalPreferences', {
        paypalPreferencesString: JSON.stringify(prefs._whiteListedForStorefront) // eslint-disable-line no-underscore-dangle
    });

    next();
});

/**
 * Includes-I18nMessages : The endpoint is used as a remote include that renders the internationalization messages ISML template
 * @name PayPal/Includes-I18nMessages
 * @function
 * @memberof Includes
 * @param {middleware} - server.middleware.include
 * @param {middleware} - cache.applyDefaultCache
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('I18nMessages', server.middleware.include, cache.applyDefaultCache, function(req, res, next) {
    res.render('common/i18nMessages', {
        i18nMessagesString: JSON.stringify(require('*/cartridge/config/i18nMessages'))
    });

    next();
});

module.exports = server.exports();
