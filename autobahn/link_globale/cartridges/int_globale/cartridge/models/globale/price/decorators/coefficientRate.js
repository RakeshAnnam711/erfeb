'use strict';

/**
 * Calculates Coefficient Rate, either product class/group/brand, or Country
 * @returns {number} - Coefficient Rate
 */
function getCoefficientRate() {
    try {
        if (!this.discount) {
            if (this.productClassCoefficientRate) {
                return this.productClassCoefficientRate;
            }
            var globaleCountryCoefficient = require('*/cartridge/models/globale/countryCoefficient');
            var globaleSession = require('*/cartridge/models/globale/session');
            var countryCoefficientRate = globaleCountryCoefficient.getRate(globaleSession.get('geCountry'));
            if (countryCoefficientRate) {
                return countryCoefficientRate;
            }
        }
    } catch (e) {
        this.logger.error('coefficientRate: {0}', this.logger.message(e));
    }
    return 1;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        coefficientRate: {
            enumerable: true,
            value: getCoefficientRate.call(object)
        }
    });
};
