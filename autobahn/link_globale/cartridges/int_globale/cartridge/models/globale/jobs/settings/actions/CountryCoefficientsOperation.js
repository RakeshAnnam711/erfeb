'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CountryCoefficientsOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function CountryCoefficientsOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CountryCoefficientsOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends CountryCoefficients request (SFCC->GE)
 * @throws {Error}
 */
CountryCoefficientsOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;
    var geProductClassCodeIDs = [];
    var geCountryCoefficientIDs = [];

    try {
        // Fetch Global-e CountryCoefficients
        service = geServiceMgr.getCountryCoefficientsService();
        var serviceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in serviceResponse) && serviceResponse.Code) ||
            (('Error' in serviceResponse) && serviceResponse.Error)
        ) {
            throw Error('Impossible to fetch CountryCoefficients: ' + JSON.stringify(serviceResponse));
        }

        // Save Global-e CountryCoefficients
        serviceResponse.forEach(function (geCoefficient) {
            if (('CountryCode' in geCoefficient) && geCoefficient.CountryCode) {
                var coefficientObj;
                var productClassCodeKey;

                Transaction.wrap(function () {
                    if (('ProductClassCode' in geCoefficient) && geCoefficient.ProductClassCode) {
                        productClassCodeKey = (geCoefficient.ProductClassCode + '_' + geCoefficient.CountryCode);
                        geProductClassCodeIDs.push(productClassCodeKey);
                        coefficientObj = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coProductClassCoefficients, productClassCodeKey);
                        if (coefficientObj === null) {
                            coefficientObj = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coProductClassCoefficients, productClassCodeKey);
                        }
                        coefficientObj.custom.productClassCode = geCoefficient.ProductClassCode;
                        coefficientObj.custom.countryCode = geCoefficient.CountryCode;
                    } else {
                        geCountryCoefficientIDs.push(geCoefficient.CountryCode);
                        coefficientObj = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coCountryCoefficients, geCoefficient.CountryCode);
                        if (coefficientObj === null) {
                            coefficientObj = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coCountryCoefficients, geCoefficient.CountryCode);
                        }
                        coefficientObj.custom.includeVAT = geCoefficient.IncludeVAT;
                    }
                    coefficientObj.custom.rate = geCoefficient.Rate;
                });
            }
        });

        // Clean up redundant custom objects and caches
        this.dataCleanUp(globaleHelpers.customObjectKeys.coProductClassCoefficients, geProductClassCodeIDs, 'key', globaleHelpers.cacheKeys.productClassCoefficients);
        this.dataCleanUp(globaleHelpers.customObjectKeys.coCountryCoefficients, geCountryCoefficientIDs, 'countryCode', globaleHelpers.cacheKeys.countryCoefficients);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = CountryCoefficientsOperation;
