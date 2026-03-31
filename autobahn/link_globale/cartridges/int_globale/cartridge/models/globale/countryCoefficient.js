'use strict';

var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var geCountryCoefficientsMgr = require('*/cartridge/scripts/factories/globale/geCountryCoefficientsMgr');
var logger = globaleHelpers.getLogger();

var countryCoefficientCO = null;

/**
 * Calculates Global-e Country Coefficient Rate
 * @param {string} countryCode - Global-e Country Code
 * @returns {number} - Global-e Country Coefficient Rate
 */
function getRate(countryCode) {
    try {
        if (!countryCoefficientCO || countryCoefficientCO.countryCode !== countryCode) {
            let countryCoefficientObj = geCountryCoefficientsMgr.getGECountryCoefficients(countryCode);
            if (countryCoefficientObj) {
                countryCoefficientCO = countryCoefficientObj.custom;
            }
        }
        return ((countryCoefficientCO && countryCoefficientCO.rate) || 1);
    } catch (e) {
        logger.error('GLOBALE_COUNTRY_COEFFICIENT: getRate : {0}', logger.message(e));
    }
    return null;
}

/**
 * Calculates Global-e Country Coefficient IncludeVAT parameter
 * @param {string} countryCode - Global-e Country Code
 * @returns {number} - Global-e Country Coefficient Include VAT
 */
function getIncludeVAT(countryCode) {
    try {
        if (!countryCoefficientCO || countryCoefficientCO.countryCode !== countryCode) {
            let countryCoefficientObj = geCountryCoefficientsMgr.getGECountryCoefficients(countryCode);
            if (countryCoefficientObj) {
                countryCoefficientCO = countryCoefficientObj.custom;
            }
        }
        return (countryCoefficientCO && countryCoefficientCO.includeVAT);
    } catch (e) {
        logger.error('GLOBALE_COUNTRY_COEFFICIENT: getIncludeVAT : {0}', logger.message(e));
    }
    return null;
}

module.exports = {
    getRate: getRate,
    getIncludeVAT: getIncludeVAT
};
