'use strict';

/**
 * Represents abstract field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function AbstractField(columnConfig, product) {
    this.product = product;
    this.column = columnConfig;
}

/**
 * Returns field value
 * @abstract
 * @returns {string|number} - field value
 */
AbstractField.prototype.getValue = function () {
    throw new Error('getValue function must be implemented by subclass!');
};

/**
 * Validate column
 * @abstract
 * @returns {boolean} - result of validation
 */
AbstractField.prototype.isValidColumn = function () {
    throw new Error('isValidColumn function must be implemented by subclass!');
};

module.exports = AbstractField;
