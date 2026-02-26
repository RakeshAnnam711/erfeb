'use strict';

/**
 * Returns Global-e product VAT Rate
 * @param {string} countryCode - country code
 * @returns {numeric|null} - VAT Rate
 */
function geGetVatRate(countryCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var result = null;

    try {
        var productVatRates = JSON.parse(this.custom[globaleHelpers.customAttr.product.geVatRates]);
        if (
            productVatRates &&
            (countryCode in productVatRates) &&
            productVatRates[countryCode] !== null
        ) {
            result = Number(productVatRates[countryCode]);
        }
    } catch (e) {
        result = null;
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetVatRate: {
            value: geGetVatRate
        }
    });
};
