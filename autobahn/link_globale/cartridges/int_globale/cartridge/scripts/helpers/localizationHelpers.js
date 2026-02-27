'use strict';

/**
 * Executes function in specified locale context
 * @param {string} contextLocaleId - locale ID
 * @param {Function} func - function to be executed
 * @returns {Object} - function execution result
 */
function executeFuncInLocaleContext(contextLocaleId, func) {
    const Site = require('dw/system/Site');
    const globaleRequest = require('*/cartridge/models/globale/request');
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    const logger = globaleHelpers.getLogger();

    let currentLocaleId = globaleRequest.get('locale');
    let result = null;

    try {
        if (Site.current.getAllowedLocales().indexOf(contextLocaleId) !== -1) {
            globaleRequest.set('locale', contextLocaleId);
            result = func();
            globaleRequest.set('locale', currentLocaleId);
        }
    } catch (e) {
        logger.error('LOCALIZATION: {0}', logger.message(e));
    } finally {
        globaleRequest.set('locale', currentLocaleId);
    }

    return result;
}

/**
 * Returns SendCartV2 Product Localization Configuration
 * @returns {Object} - SendCartV2 product localization configuration
 */
function getLocalizationConfiguration() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var config = geAppSettingsMgr.getPlatformSetting(
        globaleHelpers.platformSettings.sfccLocalizationConfiguration,
        [],
        'json'
    );

    return config;
}

module.exports = {
    executeFuncInLocaleContext: executeFuncInLocaleContext,
    getLocalizationConfiguration: getLocalizationConfiguration
};
