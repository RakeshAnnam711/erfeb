'use strict';

/**
 * Retrieves Global-e Country/Product specific VAT (Tax Rate)
 * @param {dw.catalog.Product|undefined} product - SFCC Product
 * @returns {number} - VAT Rate or Merchant Tax Rate
 */
function getCountryVATRate() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var numbers = require('*/cartridge/scripts/util/globale/numbers');
    var useCountryVAT = globaleSession.get('geUseCountryVAT');
    var defaultCountryVATRate = globaleSession.get('geDefaultCountryVATRate');
    var countryCoefficientIncludeVAT = globaleSession.get('geCountryCoefficientIncludeVAT');
    try {
        if (useCountryVAT) {
            var countryCode = globaleSession.get('geCountry');
            var productVatRates = null;
            try {
                productVatRates = JSON.parse(this.product.custom[globaleHelpers.customAttr.product.geVatRates]);
            } catch (e) { /**/ }
            if (productVatRates && (countryCode in productVatRates) && productVatRates[countryCode] !== null) {
                return numbers.round((productVatRates[countryCode] / 100), 2);
            } if (defaultCountryVATRate) {
                return numbers.round((defaultCountryVATRate / 100), 2);
            }
        } else if (!useCountryVAT && countryCoefficientIncludeVAT === 6) {
            return numbers.round((this.merchantTaxRate / 100), 2);
        }
        return 0;
    } catch (e) {
        this.logger.error('countryVATRate: {0}', this.logger.message(e));
    }
    return 0;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        countryVATRate: {
            enumerable: true,
            value: getCountryVATRate.call(object)
        }
    });
};
