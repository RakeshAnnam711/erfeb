'use strict';

/**
 * Returns JwtAuthConfig
 * @returns {JwtAuthConfig} - configuration object
 */
function getJwtAuthConfig() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var JwtAuthConfig = require('*/cartridge/models/globale/config/jwtAuthConfig');

    var systemConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccJWTAuthConfiguration, null, 'json');
    return new JwtAuthConfig(systemConfig);
}

/**
 * Returns JwtApiAuthConfig
 * @returns {JwtApiAuthConfig} - configuration object
 */
function getJwtApiAuthConfig() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var JwtApiAuthConfig = require('*/cartridge/models/globale/config/jwtApiAuthConfig');

    var systemConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccJWTApiAuthConfiguration, null, 'json');
    return new JwtApiAuthConfig(systemConfig);
}

/**
 * Returns KlarnaConfigurations
 * @returns {KlarnaConfigurations} - configuration object
 * @param {string} locale - request locale
 * @param {string} country - current country
 */
function getKlarnaConfigurations(locale, country) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var KlarnaConfig = require('*/cartridge/models/globale/config/KlarnaConfig');

    var systemConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccKlarnaConfigurations, null, 'json');
    return new KlarnaConfig(systemConfig, locale, country);
}

/**
 * Returns LanguageSwitcherConfig
 * @returns {LanguageSwitcherConfig} - configuration object
 */
function getLanguageSwitcherConfig() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var LanguageSwitcherConfig = require('*/cartridge/models/globale/config/LanguageSwitcherConfig');

    var systemConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccLanguagesConfiguration, null, 'json');
    return new LanguageSwitcherConfig(systemConfig);
}

/**
 * Returns ShippingSwitcherConfig
 * @returns {ShippingSwitcherConfig} - configuration object
 */
function getShippingSwitcherConfig() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var ShippingSwitcherConfig = require('*/cartridge/models/globale/config/ShippingSwitcherConfig');

    var systemConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccShippingSwitcherConfiguration, null, 'json');
    return new ShippingSwitcherConfig(systemConfig);
}

/**
 * Returns CatalogFeedConfig
 * @returns {CatalogFeedConfig} - configuration object
 */
function getCatalogFeedConfig() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var CatalogFeedConfig = require('*/cartridge/models/globale/config/CatalogFeedConfig');

    var systemConfig = globaleHelpers.getJSONPreference(globaleHelpers.preferenceKeys.geCatalogFeedConfig);
    return new CatalogFeedConfig(systemConfig);
}

/**
 * Returns PayByLinkConfigurations
 * @returns {PayByLinkConfigurations} - configuration object
 */
function getPayByLinkConfig() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var PayByLinkConfig = require('*/cartridge/models/globale/config/PayByLinkConfig');

    var systemConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccPayByLinkConfigurations, null, 'json');
    return new PayByLinkConfig(systemConfig);
}

/**
 * Returns PayByLinkConfigurations
 * @returns {PayByLinkConfigurations} - configuration object
 */
function getOrderCurrencyConfig() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var OrderCurrencyConfig = require('*/cartridge/models/globale/config/OrderCurrencyConfig');

    var systemConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccReconciliationCurrency, null, 'json');
    return new OrderCurrencyConfig(systemConfig);
}

module.exports = {
    getJwtAuthConfig: getJwtAuthConfig,
    getJwtApiAuthConfig: getJwtApiAuthConfig,
    getKlarnaConfigurations: getKlarnaConfigurations,
    getLanguageSwitcherConfig: getLanguageSwitcherConfig,
    getShippingSwitcherConfig: getShippingSwitcherConfig,
    getCatalogFeedConfig: getCatalogFeedConfig,
    getPayByLinkConfig: getPayByLinkConfig,
    getOrderCurrencyConfig: getOrderCurrencyConfig
};
