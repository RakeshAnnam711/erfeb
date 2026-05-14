'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CulturesOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function CulturesOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CulturesOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends Cultures request (SFCC->GE)
 * @throws {Error}
 */
CulturesOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;
    var geCustomObjectIDs = [];

    try {
        // Fetch Global-e Cultures
        service = geServiceMgr.getCulturesService();
        var serviceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in serviceResponse) && serviceResponse.Code) ||
            (('Error' in serviceResponse) && serviceResponse.Error)
        ) {
            throw Error('Impossible to fetch Cultures: ' + JSON.stringify(serviceResponse));
        }

        // Save Global-e Cultures
        serviceResponse.forEach(function (geCulture) {
            if (('CountryCode' in geCulture) && geCulture.CountryCode) {
                geCustomObjectIDs.push(geCulture.CountryCode);

                Transaction.wrap(function () {
                    var cultureObj = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coCultures, geCulture.CountryCode);
                    if (cultureObj === null) {
                        cultureObj = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coCultures, geCulture.CountryCode);
                    }

                    var cultureObjCustom = cultureObj.getCustom();
                    cultureObjCustom.code = geCulture.CountryCode;
                    cultureObjCustom.regionCode = geCulture.RegionCode;
                    cultureObjCustom.cityCode = geCulture.CityCode;
                    if (('Culture' in geCulture) && geCulture.Culture) {
                        cultureObjCustom.culture = geCulture.Culture.Code;
                        cultureObjCustom.name = geCulture.Culture.Name;
                        cultureObjCustom.localizedName = geCulture.Culture.LocalizedName;
                        cultureObjCustom.isRTL = geCulture.Culture.IsRTL;
                    }
                });
            }
        });

        // Clean up redundant custom objects and caches
        this.dataCleanUp(globaleHelpers.customObjectKeys.coCultures, geCustomObjectIDs, 'code', globaleHelpers.cacheKeys.cultures);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = CulturesOperation;
