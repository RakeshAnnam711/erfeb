'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents code handler field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function CodeField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
CodeField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
CodeField.prototype.getValue = function () {
    var fieldMgr = require('*/cartridge/scripts/globale/catalogFeed/fieldMgr');
    var result = '';
    try {
        if ('handler' in this.column && this.column.handler) {
            var handlerFunc = new Function('column', 'product', this.column.handler); // eslint-disable-line no-new-func
            result = handlerFunc(this.column, this.product);
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
CodeField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.handler === null || this.column.handler === undefined || this.column.handler === '') {
        valid = false;
    }
    return valid;
};

module.exports = CodeField;
