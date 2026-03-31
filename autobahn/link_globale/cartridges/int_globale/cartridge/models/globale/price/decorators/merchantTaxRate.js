'use strict';

/**
 * Calculates Merchant Product/Default Tax Rate
 * @returns {number} - Merchant Tax Rate
 */
function getMerchantTaxRate() {
    try {
        var TaxMgr = require('dw/order/TaxMgr');
        var numbers = require('*/cartridge/scripts/util/globale/numbers');
        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

        var taxClassId = TaxMgr.getDefaultTaxClassID();
        if (this.product && this.product.taxClassID) {
            taxClassId = this.product.taxClassID;
        } else if (this.giftCertificate && this.giftCertificate.taxClassID) {
            taxClassId = this.giftCertificate.taxClassID;
        }
        var defaultTaxJurisdictionID = TaxMgr.getDefaultTaxJurisdictionID();
        var taxJurisdictionId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geTaxJurisdictionId) || defaultTaxJurisdictionID;
        var taxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) !== null ? TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) : TaxMgr.getTaxRate(taxClassId, defaultTaxJurisdictionID);

        if (taxRate === null) {
            taxRate = TaxMgr.getTaxRate(TaxMgr.getDefaultTaxClassID(), defaultTaxJurisdictionID);
        }

        return numbers.round((taxRate * 100), 2);
    } catch (e) {
        this.logger.error('merchantTaxRate: {0}', this.logger.message(e));
    }
    return 0;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        merchantTaxRate: {
            enumerable: true,
            value: getMerchantTaxRate.call(object)
        }
    });
};
