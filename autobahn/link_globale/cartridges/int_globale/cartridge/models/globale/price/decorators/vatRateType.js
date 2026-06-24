'use strict';

/**
 * Calculates and returns Global-e VATRateType API
 * @param {boolean} localTaxRate - True if it's Local Tax Rate, otherwise False
 * @returns {Object} - Global-e VATRateType API
 */
function getVatRateType(localTaxRate) {
    var TaxMgr = require('dw/order/TaxMgr');
    var globaleSession = require('*/cartridge/models/globale/session');
    var numbers = require('*/cartridge/scripts/util/globale/numbers');
    var taxClassId = (this.product && this.product.taxClassID) ? this.product.taxClassID : TaxMgr.getDefaultTaxClassID();

    return {
        VATRateTypeCode: taxClassId,
        Name: globaleSession.get('geCountry'),
        Rate: (localTaxRate === true ? numbers.round(this.merchantTaxRate, 2) : numbers.round((this.countryVATRate * 100), 2)) // decimal
    };
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getVatRateType: {
            value: getVatRateType
        }
    });
};
