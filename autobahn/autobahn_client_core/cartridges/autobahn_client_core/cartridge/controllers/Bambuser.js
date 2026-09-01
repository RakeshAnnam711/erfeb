'use strict';

var server = require('server');
server.extend(module.superModule);
var bambuserHelpers = require('*/cartridge/scripts/bambuser/bambuserHelpers');

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
 * Gets afterFooter
 */
server.get('Check', featureEnabled, overviewEnabled, function (req, res, next) {
    var config = bambuserHelpers.getBambuserConfig();
    var bambuserEnabled = bambuserHelpers.isFeatureEnabled();
    var miniplayerSkipPages = bambuserHelpers.getMiniplayerSkipPages();
    var fabSkipPages = bambuserHelpers.getFABSkipPages();

    var configFAB = {
        enableFAB: bambuserHelpers.isFABEnabled(),
        fabWidgetId: bambuserHelpers.getFABWidgetId(),
        fabWidgetURL: bambuserHelpers.getFABWidgetURL(),
    };

    var fabSkipPage = false;
    var miniplayerSkipPage = false;
    var httpPath = request.httpPath.split('/');
    var page = httpPath.pop();

    for (var i = 0; i < miniplayerSkipPages.length; i++) {
        if (page && page === miniplayerSkipPages[i]) {
            miniplayerSkipPage = true;
        }
    }

    for (var j = 0; j < fabSkipPages.length; j++) {
        if (page && page === fabSkipPages[j]) {
            fabSkipPage = true;
        }
    }

    if (bambuserEnabled) {
        try {
            res.render('hooks/afterFooter', {
                config: JSON.stringify(config),
                configFAB: JSON.stringify(configFAB),
                fabSkipPage: fabSkipPage,
                miniplayerSkipPage: miniplayerSkipPage
            });
        } catch (e) {
            BambuserLogger.error('Error while rendering template ' + 'hooks/afterFooter');
        }
    }
    next();
});

module.exports = server.exports();