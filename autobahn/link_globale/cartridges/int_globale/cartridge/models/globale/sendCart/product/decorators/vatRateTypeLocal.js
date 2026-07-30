'use strict';

/**
 * Returns Global-e Product.LocalVatRateType API.
 * VATRateTypeCode value reflects the assigned product taxClassID, even if it does not exist.
 * @returns {array} - Global-e Product.LocalVatRateType API
 */
function getVatRateTypeLocal() {
    var TaxMgr = require('dw/order/TaxMgr');

    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var numbers = require('*/cartridge/scripts/util/globale/numbers');

    var productReferrence = this.productLineItem.product || this.productLineItem.parent.product;

    var taxJurisdictionId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geTaxJurisdictionId) || TaxMgr.defaultTaxJurisdictionID;
    var taxClassId = productReferrence.taxClassID;
    var vatRateTypeName = 'undefined|undefined';

    if (taxClassId && TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) !== null) {
        vatRateTypeName = taxJurisdictionId + '|' + taxClassId;
    } else if (taxClassId && TaxMgr.getTaxRate(taxClassId, TaxMgr.defaultTaxJurisdictionID) !== null) {
        vatRateTypeName = TaxMgr.defaultTaxJurisdictionID + '|' + taxClassId;
    } else {
        vatRateTypeName = TaxMgr.defaultTaxJurisdictionID + '|' + TaxMgr.defaultTaxClassID;
        taxClassId = TaxMgr.defaultTaxClassID;
    }

    return {
        VATRateTypeCode: taxClassId,
        Name: vatRateTypeName,
        Rate: numbers.round((this.productLineItem.taxRate * 100), 2) // decimal
    };
}

module.exports = function (object) {
    Object.defineProperty(object, 'getVatRateTypeLocal', {
        value: getVatRateTypeLocal
    });
};
