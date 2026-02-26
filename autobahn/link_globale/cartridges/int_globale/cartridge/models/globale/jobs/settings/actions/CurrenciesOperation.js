'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CurrenciesOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function CurrenciesOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CurrenciesOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends Currencies request (SFCC->GE)
 * @throws {Error}
 */
CurrenciesOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;
    var geCustomObjectIDs = [];

    try {
        // Fetch Global-e Currencies
        service = geServiceMgr.getCurrenciesService();
        var serviceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in serviceResponse) && serviceResponse.Code) ||
            (('Error' in serviceResponse) && serviceResponse.Error)
        ) {
            throw Error('Impossible to fetch Currencies: ' + JSON.stringify(serviceResponse));
        }

        // Save Global-e Currencies
        serviceResponse.forEach(function (geCurrency) {
            if (('Code' in geCurrency) && geCurrency.Code) {
                geCustomObjectIDs.push(geCurrency.Code);

                Transaction.wrap(function () {
                    geCustomObjectIDs.push(geCurrency.Code);
                    var currencyObj = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coCurrencies, geCurrency.Code);
                    if (currencyObj === null) {
                        currencyObj = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coCurrencies, geCurrency.Code);
                    }
                    var currencyObjCustom = currencyObj.getCustom();
                    currencyObjCustom.name = geCurrency.Name;
                    currencyObjCustom.symbol = geCurrency.Symbol;
                    currencyObjCustom.maxDecimalPlaces = geCurrency.MaxDecimalPlaces;
                });
            }
        });

        // Clean up redundant custom objects and caches
        this.dataCleanUp(globaleHelpers.customObjectKeys.coCurrencies, geCustomObjectIDs, 'code', globaleHelpers.cacheKeys.currencies);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = CurrenciesOperation;
