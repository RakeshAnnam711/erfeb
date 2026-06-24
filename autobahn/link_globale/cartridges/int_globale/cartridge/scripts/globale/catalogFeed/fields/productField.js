'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents product field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function ProductField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
ProductField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
ProductField.prototype.getValue = function () {
    var fieldMgr = require('*/cartridge/scripts/globale/catalogFeed/fieldMgr');
    var result = '';
    if (this.product && this.column.attr && this.column.attr.length > 0) {
        String(this.column.attr).split('.').forEach(function (filedPart) {
            if (result && (filedPart in result)) {
                result = result[filedPart];
            } else if (!result && (filedPart in this.product)) {
                result = this.product[filedPart];
            }
        }, this);

        if ((!result || typeof (result) === 'object') && ('fallback' in this.column) && this.column.fallback) {
            var fallbackField = fieldMgr.createField(this.column.fallback, this.product);
            result = fallbackField.getValue();
        }
    }
    return result;
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
ProductField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.attr === null || this.column.attr === undefined || this.column.attr === '') {
        valid = false;
    }
    return valid;
};

module.exports = ProductField;
