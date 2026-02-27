'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CountriesOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function CountriesOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CountriesOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends Countries request (SFCC->GE)
 * @throws {Error}
 */
CountriesOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;
    var geCustomObjectIDs = [];

    try {
        // Fetch Global-e Countries
        service = geServiceMgr.getCountriesService();
        var serviceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in serviceResponse) && serviceResponse.Code) ||
            (('Error' in serviceResponse) && serviceResponse.Error)
        ) {
            throw Error('Impossible to fetch Countries: ' + JSON.stringify(serviceResponse));
        }

        // Save Global-e Countries
        serviceResponse.forEach(function (geCountry) {
            if (('Code' in geCountry) && geCountry.Code) {
                geCustomObjectIDs.push(geCountry.Code);

                Transaction.wrap(function () {
                    var countryObj = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coCountries, geCountry.Code);
                    if (countryObj === null) {
                        countryObj = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coCountries, geCountry.Code);
                    }
                    var countryObjCustom = countryObj.getCustom();
                    countryObjCustom.name = geCountry.Name;
                    countryObjCustom.siteUrl = geCountry.SiteURL;
                    countryObjCustom.isStateMandatory = geCountry.IsStateMandatory;
                    countryObjCustom.isOperatedByGlobalE = geCountry.IsOperatedByGlobalE;
                    countryObjCustom.defaultCurrencyCode = geCountry.DefaultCurrencyCode;
                    countryObjCustom.useCountryVAT = geCountry.UseCountryVAT;
                    countryObjCustom.supportsFixedPrices = geCountry.SupportsFixedPrices;
                    countryObjCustom.countryCode3 = geCountry.CountryCode3;
                    countryObjCustom.vatExemptionDisabled = geCountry.VATExemptionDisabled;
                    countryObjCustom.defaultVATRateType = geCountry.DefaultVATRateType ? JSON.stringify(geCountry.DefaultVATRateType) : null;
                });
            }
        });

        // Clean up redundant custom objects and caches
        this.dataCleanUp(globaleHelpers.customObjectKeys.coCountries, geCustomObjectIDs, 'code', globaleHelpers.cacheKeys.countries);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = CountriesOperation;
