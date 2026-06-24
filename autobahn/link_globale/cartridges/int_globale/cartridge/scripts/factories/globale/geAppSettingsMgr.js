'use strict';

/**
 * Returns Global-E AppSettings object
 * @returns {dw.object.CustomObject|Object} - AppSettings object
 */
function getGEAppSettings() {
    var Logger = require('dw/system/Logger');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geObjectDataProvider = require('*/cartridge/scripts/factories/globale/geObjectDataProvider');
    var result = null;

    try {
        var provider = geObjectDataProvider.createDataProvider(
            require('*/cartridge/scripts/globale/cache/appSettingsCacheMgr'),
            globaleHelpers.customObjectKeys.coAppSettings
        );
        result = provider.getGEObject(globaleHelpers.consts.geId);
    } catch (e) {
        Logger.getLogger('GLOBALE').error('geAppSettingsMgr: was not able to get Global-E object. Error: ' + e.message);
        throw e;
    }

    return result;
}

/**
 * Returns Global-E server settings object
 * @returns {Object|null} - server settings
 */
function getServerSettings() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var result = null;

    try {
        var globaleAppSettingsObj = getGEAppSettings();
        var globaleAppSettings = globaleAppSettingsObj ? globaleAppSettingsObj.getCustom() : null;
        if (globaleAppSettings && globaleAppSettings.serverSettings) {
            result = JSON.parse(globaleAppSettings.serverSettings);
        }
    } catch (e) {
        result = null;
        logger.error('geAppSettingsMgr: getServerSettings : {0}', logger.message(e));
    }

    return result;
}

/**
 * Returns Global-E server setting value
 * @param {string} name - server setting name
 * @param {Object} defaultValue - default value to return
 * @returns {Object|null} - server setting value
 */
function getServerSetting(name, defaultValue) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var result = defaultValue !== undefined ? defaultValue : null;

    try {
        var serverSettings = getServerSettings();
        if (serverSettings && (name in serverSettings) && ('Value' in serverSettings[name])) {
            result = serverSettings[name].Value;
        }
    } catch (e) {
        logger.error('geAppSettingsMgr: getServerSetting : {0} {1}', name, logger.message(e));
    }

    return result;
}

/**
 * Returns Global-E JSON server setting value
 * @param {string} name - server setting name
 * @param {Object} defaultValue - default value to return
 * @returns {Object} - server setting value
 */
function getJsonServerSetting(name, defaultValue) {
    var result = defaultValue;
    var serverSettingVal = getServerSetting(name, null);

    try {
        result = JSON.parse(serverSettingVal);
    } catch (e) {
        result = defaultValue;
    }

    return result;
}

/**
 * Returns Global-E boolean server setting value
 * @param {string} name - server setting name
 * @param {Object} defaultValue - default value to return
 * @returns {boolean} - server setting value
 */
function getBooleanServerSetting(name, defaultValue) {
    var result = !!defaultValue;
    var serverSettingVal = getServerSetting(name, null);

    if (serverSettingVal === 'true') {
        result = true;
    } else if (serverSettingVal === 'false') {
        result = false;
    }

    return result;
}

/**
 * Returns Global-E platform setting value
 * @param {string} name - server setting name
 * @param {Object} defaultValue - default value to return
 * @param {string} type - platform setting type
 * @returns {boolean} - server setting value
 */
function getPlatformSetting(name, defaultValue, type) {
    var valuesUtils = require('*/cartridge/scripts/util/globale/values');

    var result = defaultValue;
    try {
        var globaleAppSettingsObj = getGEAppSettings();
        var globaleAppSettings = globaleAppSettingsObj ? globaleAppSettingsObj.getCustom() : null;
        if (globaleAppSettings && (name in globaleAppSettings)) {
            switch (type) {
                case 'boolean':
                    result = valuesUtils.getBooleanValueFromString(globaleAppSettings[name], defaultValue);
                    break;
                case 'json':
                    result = valuesUtils.getJsonObjectFromString(globaleAppSettings[name], defaultValue);
                    break;
                default:
                    result = globaleAppSettings[name] ? globaleAppSettings[name] : defaultValue;
                    break;
            }
        }
    } catch (e) {
        result = defaultValue;
    }

    return result;
}

module.exports = {
    getGEAppSettings: getGEAppSettings,
    getServerSettings: getServerSettings,
    getServerSetting: getServerSetting,
    getJsonServerSetting: getJsonServerSetting,
    getBooleanServerSetting: getBooleanServerSetting,
    getPlatformSetting: getPlatformSetting
};
