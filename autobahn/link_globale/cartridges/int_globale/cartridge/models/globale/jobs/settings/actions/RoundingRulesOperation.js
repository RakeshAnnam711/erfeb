'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents RoundingRulesOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function RoundingRulesOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
RoundingRulesOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends RoundingRules request (SFCC->GE)
 * @throws {Error}
 */
RoundingRulesOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;
    var geCustomObjectIDs = [];

    try {
        // Fetch Global-e RoundingRules
        service = geServiceMgr.getRoundingRulesService();
        var serviceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in serviceResponse) && serviceResponse.Code) ||
            (('Error' in serviceResponse) && serviceResponse.Error)
        ) {
            throw Error('Impossible to fetch RoundingRules: ' + JSON.stringify(serviceResponse));
        }

        // Save Global-e RoundingRules
        serviceResponse.forEach(function (geRoundingRule) {
            if (('CurrencyCode' in geRoundingRule) && geRoundingRule.CurrencyCode) {
                geCustomObjectIDs.push(geRoundingRule.CurrencyCode);

                Transaction.wrap(function () {
                    var key = geRoundingRule.CurrencyCode;
                    if (('CountryCode' in geRoundingRule) && geRoundingRule.CountryCode) {
                        key += ('_' + geRoundingRule.CountryCode);
                    }
                    geCustomObjectIDs.push(key);

                    var roundingRuleObj = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coRoundingRules, key);
                    if (roundingRuleObj === null) {
                        roundingRuleObj = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coRoundingRules, key);
                    }

                    var roundingRuleObjCustom = roundingRuleObj.getCustom();
                    roundingRuleObjCustom.roundingRuleId = geRoundingRule.RoundingRuleId;
                    roundingRuleObjCustom.currencyCode = geRoundingRule.CurrencyCode;
                    roundingRuleObjCustom.countryCode = geRoundingRule.CountryCode;
                    roundingRuleObjCustom.roundingRanges = JSON.stringify(geRoundingRule.RoundingRanges);
                });
            }
        });

        // Clean up redundant custom objects and caches
        this.dataCleanUp(globaleHelpers.customObjectKeys.coRoundingRules, geCustomObjectIDs, 'key', globaleHelpers.cacheKeys.roundingRules);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = RoundingRulesOperation;
