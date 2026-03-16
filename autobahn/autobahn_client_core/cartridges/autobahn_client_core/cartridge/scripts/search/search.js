'use strict';

const base = module.superModule;
const Money = require('dw/value/Money');
const Logger = require('dw/system/Logger');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const globaleSession = require('*/cartridge/models/globale/session');

/**
 * Gets the conversion rate from USD to the target currency.
 * @param {string} targetCurrency - e.g. 'EUR', 'INR', 'AFN'
 * @returns {number|null}
 */
function getConversionRate(targetCurrency) {
    try {
        var rateObj = CustomObjectMgr.getCustomObject('GLOBALE_CURRENCY_RATES', 'USD_' + targetCurrency);
        if (rateObj && rateObj.custom && rateObj.custom.rate) {
            return parseFloat(rateObj.custom.rate);
        }
    } catch (e) {
        Logger.error('Error fetching conversion rate for USD_{0}: {1}', targetCurrency, e.message);
    }
    return null;
}

base.setProductProperties = function (productSearch, httpParams, selectedCategory, sortingRule, httpParameterMap) {
    if (httpParams.q) {
        productSearch.setSearchPhrase(httpParams.q);
    }

    if (selectedCategory) {
        productSearch.setCategoryID(selectedCategory.ID);
    }

    if (httpParams.pid) {
        productSearch.setProductIDs([httpParams.pid]);
    }

    if (httpParameterMap) {
        try {
            var sessionCurrency = globaleSession.get('geCurrency');
            var isUSD = sessionCurrency === 'USD';
            var rate = 1;

            if (!isUSD) {
                rate = getConversionRate(sessionCurrency);
                if (!rate) {
                    Logger.warn('No conversion rate found for USD to {0}', sessionCurrency);
                    rate = 1;
                }
            }

            if (httpParams.pmin) {
                var rawPmin = parseFloat(httpParams.pmin.replace(/,/g, ''));
                var usdPmin = isUSD ? rawPmin : rawPmin / rate;
                productSearch.setPriceMin(usdPmin);
            }

            if (httpParams.pmax) {
                var rawPmax = parseFloat(httpParams.pmax.replace(/,/g, ''));
                var usdPmax = isUSD ? rawPmax : rawPmax / rate;
                // Adding the upper bound inclusive after conversion and float rounding.
                var maxPriceBuffer = isUSD ? 0.01 : Math.max(0.01, 1 / rate);
                productSearch.setPriceMax(usdPmax + maxPriceBuffer);
            }
        } catch (e) {
            Logger.error('Error converting price to USD: {0}', e.message);
        }
    }

    if (httpParams.pmid) {
        productSearch.setPromotionID(httpParams.pmid);
    }

    if (sortingRule) {
        productSearch.setSortingRule(sortingRule);
    }

    productSearch.setRecursiveCategorySearch(true);
};

module.exports = base;
