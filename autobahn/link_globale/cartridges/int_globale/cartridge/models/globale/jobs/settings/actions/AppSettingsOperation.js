'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents AppSettingsOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function AppSettingsOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
AppSettingsOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends AppSettings request (SFCC->GE)
 * @throws {Error}
 */
AppSettingsOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleWebStoreHelpers = require('*/cartridge/scripts/helpers/globaleWebStoreHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;

    try {
        // Fetch Global-e App Settings
        service = geServiceMgr.getAppSettingsService();
        var appSettingsServiceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in appSettingsServiceResponse) && appSettingsServiceResponse.Code) ||
            (('Error' in appSettingsServiceResponse) && appSettingsServiceResponse.Error)
        ) {
            throw Error('Impossible to fetch AppSettings: ' + JSON.stringify(appSettingsServiceResponse));
        }

        // Fetch Global-e AppVersion
        service = geServiceMgr.getAppVersionService();
        var appVersionServiceResponse = this.getServiceResponse(service.call());
        if (
            (('Code' in appVersionServiceResponse) && appVersionServiceResponse.Code) ||
            (('Error' in appVersionServiceResponse) && appVersionServiceResponse.Error)
        ) {
            throw Error('Impossible to fetch AppVersion: ' + JSON.stringify(appVersionServiceResponse));
        }

        // Save Global-e App Settings
        Transaction.wrap(function () {
            var geAppSettings = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coAppSettings, globaleHelpers.consts.geId);
            if (!geAppSettings) {
                geAppSettings = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coAppSettings, globaleHelpers.consts.geId);
            }

            geAppSettings.custom.webClientVersion = appVersionServiceResponse.WebClientVersion;
            geAppSettings.custom.apiVersion = appVersionServiceResponse.APIVersion;

            geAppSettings.custom.clientSettings = JSON.stringify(appSettingsServiceResponse.ClientSettings);
            Object.keys(globaleHelpers.platformSettings).forEach(function (key) {
                if ((key in appSettingsServiceResponse.ServerSettings) && ('Value' in appSettingsServiceResponse.ServerSettings[key])) {
                    geAppSettings.custom[globaleHelpers.platformSettings[key]] = appSettingsServiceResponse.ServerSettings[key].Value;
                    delete appSettingsServiceResponse.ServerSettings[key];
                } else {
                    geAppSettings.custom[globaleHelpers.platformSettings[key]] = null;
                }
            });

            geAppSettings.custom.serverSettings = JSON.stringify(appSettingsServiceResponse.ServerSettings);

            globaleWebStoreHelpers.generateWebStoreUUID();
        });

        // Invalidate cache
        require('*/cartridge/scripts/helpers/cacheHelpers')
            .invalidateCache(globaleHelpers.cacheKeys.appSettings, require('dw/system/Site').current.ID + '_' + globaleHelpers.consts.geId);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = AppSettingsOperation;
