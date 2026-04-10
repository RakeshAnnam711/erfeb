'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents preference field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function PreferenceField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
PreferenceField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
PreferenceField.prototype.getValue = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(this.column.attr);
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
PreferenceField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.attr === null || this.column.attr === undefined || this.column.attr === '') {
        valid = false;
    }
    return valid;
};

module.exports = PreferenceField;
