'use strict';

/**
 * Calculates and returns Global-e SendCart.VATRegistration API
 * @returns {Object} - Global-e SendCart.VATRegistration API
 */
function getVATRegistrationData() {
    var result = null;

    /**
     * @example
    var globaleSession = require('{@literal *}/cartridge/models/globale/session');
    var geCountryMgr = require('{@literal *}/cartridge/scripts/factories/globale/geCountryMgr');

    try {
        var geCountryCode = globaleSession.get('geCountry');
        var geVATExemptionDisabled = geCountryMgr.getVATExemptionDisabled(geCountryCode);
        if (!geVATExemptionDisabled) {
            result = {
                DoNotChargeVAT: true,
                VatRegistrationNumber: 'VatRegistrationNumber value'
            };
        }
    } catch (e) {
        result = null;
    }
    */

    return result;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getVATRegistrationData', {
        value: getVATRegistrationData
    });
};
