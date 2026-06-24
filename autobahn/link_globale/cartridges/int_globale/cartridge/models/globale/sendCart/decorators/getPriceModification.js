'use strict';

/**
 * Calculates PriceModification for Global-e SendCart API object
 * @returns {Object} - Global-e SendCart.PriceModification API object
 */
function getPriceModification() {
    var geRoundingRuleMgr = require('*/cartridge/scripts/factories/globale/geRoundingRuleMgr');
    var globaleCountryCoefficient = require('*/cartridge/models/globale/countryCoefficient');
    var globaleSession = require('*/cartridge/models/globale/session');

    var countryCode = globaleSession.get('geCountry');
    var currencyCode = globaleSession.get('geCurrency');

    var roundingRuleId = '';
    var roundingRulesCO = geRoundingRuleMgr.getGERoundingRule(currencyCode + '_' + countryCode);

    if (roundingRulesCO === null) {
        roundingRulesCO = geRoundingRuleMgr.getGERoundingRule(currencyCode);
    }
    if (roundingRulesCO !== null && roundingRulesCO.custom.roundingRuleId) {
        roundingRuleId = roundingRulesCO.custom.roundingRuleId;
    }
    return {
        RoundingRuleId: roundingRuleId, // Int64
        priceCoefficientRate: globaleCountryCoefficient.getRate(countryCode), // decimal
        IncludeVAT: globaleSession.get('geCountryCoefficientIncludeVAT') // Int64
    };
}

module.exports = function (object) {
    Object.defineProperty(object, 'getPriceModification', {
        value: getPriceModification
    });
};
