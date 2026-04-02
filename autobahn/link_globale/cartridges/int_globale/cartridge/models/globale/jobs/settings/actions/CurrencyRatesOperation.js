'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CurrencyRatesOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function CurrencyRatesOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CurrencyRatesOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends CurrencyRates request (SFCC->GE)
 * @throws {Error}
 */
CurrencyRatesOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;
    var geCustomObjectIDs = [];

    try {
        // Fetch Global-e CurrencyRates
        service = geServiceMgr.getCurrencyRatesService();
        var serviceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in serviceResponse) && serviceResponse.Code) ||
            (('Error' in serviceResponse) && serviceResponse.Error)
        ) {
            throw Error('Impossible to fetch CurrencyRates: ' + JSON.stringify(serviceResponse));
        }

        // Save Global-e CurrencyRates
        serviceResponse.forEach(function (geCurrencyRate) {
            if (
                (('SourceCurrencyCode' in geCurrencyRate) && geCurrencyRate.SourceCurrencyCode) &&
                (('TargetCurrencyCode' in geCurrencyRate) && geCurrencyRate.TargetCurrencyCode)
            ) {
                geCustomObjectIDs.push((geCurrencyRate.SourceCurrencyCode + '_' + geCurrencyRate.TargetCurrencyCode));

                Transaction.wrap(function () {
                    var currencyRateObj = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coCurrencyRates, (geCurrencyRate.SourceCurrencyCode + '_' + geCurrencyRate.TargetCurrencyCode));
                    if (currencyRateObj === null) {
                        currencyRateObj = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coCurrencyRates, (geCurrencyRate.SourceCurrencyCode + '_' + geCurrencyRate.TargetCurrencyCode));
                    }

                    var currencyRateObjCustom = currencyRateObj.getCustom();
                    currencyRateObjCustom.targetCurrencyCode = geCurrencyRate.TargetCurrencyCode;
                    currencyRateObjCustom.sourceCurrencyCode = geCurrencyRate.SourceCurrencyCode;
                    currencyRateObjCustom.rate = geCurrencyRate.Rate;
                    currencyRateObjCustom.rateData = geCurrencyRate.RateData;
                });
            }
        });

        // Clean up redundant custom objects and caches
        this.dataCleanUp(globaleHelpers.customObjectKeys.coCurrencyRates, geCustomObjectIDs, 'key', globaleHelpers.cacheKeys.currencyRates);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = CurrencyRatesOperation;
