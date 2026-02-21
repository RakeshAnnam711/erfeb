/* eslint-disable no-loop-func */

'use strict';

/**
 * Returns cache price books configuration
 * @returns {Object} - cache cprice configuration
 */
function getCachePriceBooksConfiguration() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var cachePriceBooksConfig = geAppSettingsMgr.getPlatformSetting(
        globaleHelpers.platformSettings.sfccCachePriceBooksConfig,
        {
            cachePricebookNamePattern: 'GE-cache-pricebook-{MERCHANT_ID}-{PRICEBOOK_ID}',
            cachePricebookNum: 14,
            cachePricebookCombinationLength: 5
        },
        'json'
    );

    return cachePriceBooksConfig;
}

/**
 * Returns cache cprice book IDs
 * @param {number} num - the number of cache price book names to be generated
 * @param {string} namePattern - cache price book name pattern
 * @returns {Array} - price book names list
 */
function getCachePriceBooksList(num, namePattern) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var cachePriceBookPattern = namePattern;
    var result = [];

    for (var i = 0; i < num; ++i) {
        result.push(cachePriceBookPattern.replace('{MERCHANT_ID}', globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId)).replace('{PRICEBOOK_ID}', (i + 1)));
    }

    return result;
}

/**
 * Returns countries list for each cache pricebook (mapping)
 * @returns {Object} - cache price books countries maping
 */
function generatePriceBooksCombinations() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    var combinationUtils = require('*/cartridge/scripts/util/globale/combination');

    var cachePriceBooksConfig = getCachePriceBooksConfiguration();
    var countrieIter = CustomObjectMgr.getAllCustomObjects(globaleHelpers.customObjectKeys.coCountries);
    var currentCountryCo = null;
    var cachePriceBookValuesMapping = {};

    var combineWithoutRepetitionsMgr = new combinationUtils.CombineWithoutRepetitionsMgr(
        getCachePriceBooksList(cachePriceBooksConfig.cachePricebookNum, cachePriceBooksConfig.cachePricebookNamePattern),
        cachePriceBooksConfig.cachePricebookCombinationLength
    );

    while (countrieIter.hasNext()) {
        currentCountryCo = countrieIter.next();
        if (currentCountryCo.custom.isOperatedByGlobalE) {
            var allowedCountryCurrencies = geCountryMgr.getAllowedCountryCurrencies(currentCountryCo.custom.code);
            allowedCountryCurrencies.forEach(function (allowedCurrency) {
                var combinationKey = currentCountryCo.custom.code + allowedCurrency;
                var uniqueCombination = [];
                if (!combineWithoutRepetitionsMgr.hasNextCombination()) {
                    throw Error('globaleCachingPriceBooksHelpers: not enough unique combinations.');
                }
                uniqueCombination = combineWithoutRepetitionsMgr.getNextCombination();
                if (uniqueCombination.length < cachePriceBooksConfig.cachePricebookCombinationLength) {
                    throw Error('globaleCachingPriceBooksHelpers: unique combination length issue.');
                }

                uniqueCombination.forEach(function (priceBook) {
                    if (!(priceBook in cachePriceBookValuesMapping)) {
                        cachePriceBookValuesMapping[priceBook] = [];
                    }

                    cachePriceBookValuesMapping[priceBook].push(combinationKey);
                });
            });
        }
    }

    countrieIter.close();

    return cachePriceBookValuesMapping;
}

module.exports = {
    generatePriceBooksCombinations: generatePriceBooksCombinations
};
