'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents tax field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function TaxField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
TaxField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
TaxField.prototype.getValue = function () {
    var TaxMgr = require('dw/order/TaxMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var taxClassId = (this.product.taxClassID) ? this.product.taxClassID : TaxMgr.getDefaultTaxClassID();
    var defaultTaxJurisdictionID = TaxMgr.getDefaultTaxJurisdictionID();
    var taxJurisdictionId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geTaxJurisdictionId) || defaultTaxJurisdictionID;
    var taxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) !== null ? TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) : TaxMgr.getTaxRate(taxClassId, defaultTaxJurisdictionID);

    if (taxRate === null) {
        taxRate = TaxMgr.getTaxRate(TaxMgr.getDefaultTaxClassID(), defaultTaxJurisdictionID);
    }
    return Math.round(taxRate * 100);
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
TaxField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header) {
        valid = false;
    }
    return valid;
};

module.exports = TaxField;
