'use strict';

var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var logger = globaleHelpers.getLogger();

/**
 * Retrieves currency settings for a customer's country
 * @returns {Object} - Currency settings for a customer's country
 */
function getPriceDisplayFormat() {
    var CacheMgr = require('dw/system/CacheMgr');
    var Site = require('dw/system/Site');
    var globaleSession = require('*/cartridge/models/globale/session');

    var countryCode = globaleSession.get('geCountry');
    var priceDisplayFormatCache = CacheMgr.getCache(globaleHelpers.cacheKeys.priceDisplayFormat);
    var cacheKey = Site.current.ID + '_' + countryCode;

    return priceDisplayFormatCache.get(cacheKey, function () {
        // default configuration
        var priceDisplayFormat = {
            currencySymbolSpace: true,
            currencySymbolBeforePrice: true,
            thousandSeparator: null,
            decimalSeparator: null
        };

        try {
            var geAppSettings = globaleHelpers.getGlobaleAppSettings();

            // CurrencySymbol configuration
            if (
                'PriceDisplayFormat_CurrencySymbol' in geAppSettings.serverSettings &&
                'Value' in geAppSettings.serverSettings.PriceDisplayFormat_CurrencySymbol &&
                geAppSettings.serverSettings.PriceDisplayFormat_CurrencySymbol.Value.length > 0
            ) {
                var currencySymbolFormat = JSON.parse(geAppSettings.serverSettings.PriceDisplayFormat_CurrencySymbol.Value);
                currencySymbolFormat.some(function (item) {
                    if ('CountryCode' in item && item.CountryCode === countryCode) {
                        priceDisplayFormat.currencySymbolSpace = ('UseCurrencySymbolSpace' in item) ? item.UseCurrencySymbolSpace : true;
                        priceDisplayFormat.currencySymbolBeforePrice = ('PlaceCurrencySymbolBeforePrice' in item) ? item.PlaceCurrencySymbolBeforePrice : true;
                        return true;
                    }

                    return false;
                });
            }

            // ThousandSeparator configuration
            if (
                'PriceDisplayFormat_ThousandSeparator' in geAppSettings.serverSettings &&
                'Value' in geAppSettings.serverSettings.PriceDisplayFormat_ThousandSeparator &&
                geAppSettings.serverSettings.PriceDisplayFormat_ThousandSeparator.Value.length > 0
            ) {
                var thousandSeparatorFormat = JSON.parse(geAppSettings.serverSettings.PriceDisplayFormat_ThousandSeparator.Value);
                thousandSeparatorFormat.some(function (item) {
                    if ('CountryCode' in item && item.CountryCode === countryCode) {
                        priceDisplayFormat.thousandSeparator = ('ThousandSeparator' in item) ? item.ThousandSeparator : null;
                        return true;
                    }

                    return false;
                });
            }

            // DecimalSeparator configuration
            if (
                'PriceDisplayFormat_DecimalSeparator' in geAppSettings.serverSettings &&
                'Value' in geAppSettings.serverSettings.PriceDisplayFormat_DecimalSeparator &&
                geAppSettings.serverSettings.PriceDisplayFormat_DecimalSeparator.Value.length > 0
            ) {
                var decimalSeparatorFormat = JSON.parse(geAppSettings.serverSettings.PriceDisplayFormat_DecimalSeparator.Value);
                decimalSeparatorFormat.some(function (item) {
                    if ('CountryCode' in item && item.CountryCode === countryCode) {
                        priceDisplayFormat.decimalSeparator = ('DecimalSeparator' in item) ? item.DecimalSeparator : null;
                        return true;
                    }

                    return false;
                });
            }
        } catch (e) {
            logger.error('PriceDisplayFormat Error: {0}', logger.message(e));
        }

        return priceDisplayFormat;
    });
}

module.exports = function (object, price) {
    Object.defineProperties(object, {
        price: {
            value: price
        },
        currencySymbol: {
            writable: true,
            value: 'N/A'
        },
        maxDecimalPlaces: {
            writable: true,
            value: 0
        },
        priceDisplayFormat: {
            value: getPriceDisplayFormat()
        },
        logger: {
            value: logger
        }
    });
};
