'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents custom field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function CustomField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
CustomField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
CustomField.prototype.getValue = function () {
    var fieldMgr = require('*/cartridge/scripts/globale/catalogFeed/fieldMgr');
    var result = '';
    try {
        if ('handler' in this.column && this.column.handler) {
            var handler = require(this.column.handler);
            result = handler.getValue(this.product);
        }
    } catch (e) {
        var fallbackField = fieldMgr.createField(this.column.fallback, this.product);
        result = fallbackField.getValue();
    }

    return result;
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
CustomField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.handler === null || this.column.handler === undefined || this.column.handler === '') {
        valid = false;
    }
    return valid;
};

module.exports = CustomField;
