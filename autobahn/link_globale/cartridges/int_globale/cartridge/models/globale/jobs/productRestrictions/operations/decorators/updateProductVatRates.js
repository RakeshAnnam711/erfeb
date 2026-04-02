/* eslint-disable no-param-reassign */

'use strict';

/**
 * Updates product VAT Rates
 * @param {dw.catalog.Product} product - SFCC product
 * @param {ProductCountry} productCountry - ProductCountry API record
 */
function updateProductVatRates(product, productCountry) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');

    if (product === null) {
        return;
    }

    // VAT rates
    var geVatRates = {};
    if (product.custom[globaleHelpers.customAttr.product.geVatRates]) {
        try {
            geVatRates = JSON.parse(product.custom[globaleHelpers.customAttr.product.geVatRates]);
        } catch (e) { /**/ }
    }
    geVatRates[productCountry.CountryCode] = null;
    if (productCountry.VATRateType.Rate !== null) {
        var vatRate = productCountry.VATRateType.Rate;
        var countryDefaultVATRate = geCountryMgr.getCountryVATRate(productCountry.CountryCode);
        if (countryDefaultVATRate === null || countryDefaultVATRate !== vatRate) {
            geVatRates[productCountry.CountryCode] = vatRate;
        }
    } else {
        delete geVatRates[productCountry.CountryCode];
    }
    Transaction.wrap(function () {
        product.custom[globaleHelpers.customAttr.product.geVatRates] = (Object.keys(geVatRates).length > 0 ? JSON.stringify(geVatRates) : null);
    });
}

module.exports = function (object) {
    Object.defineProperties(object, {
        updateProductVatRates: {
            enumerable: true,
            value: updateProductVatRates
        }
    });
};
