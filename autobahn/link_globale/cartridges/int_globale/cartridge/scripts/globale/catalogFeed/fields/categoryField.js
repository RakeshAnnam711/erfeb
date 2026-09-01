'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents category field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function CategoryField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
CategoryField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
CategoryField.prototype.getValue = function () {
    var globaleProductHelpers = require('*/cartridge/scripts/helpers/globaleProductHelpers');
    var categoriesHashSet = globaleProductHelpers.getProductCategories(this.product);
    var categories = categoriesHashSet.toArray().map(function (category) { return category.getDisplayName() || category.getID(); });
    return categories.length ? categories.join(this.column.categoriesSeparator) : '';
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
CategoryField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.attr === null || this.column.attr === undefined || this.column.attr === '') {
        valid = false;
    }
    return valid;
};

module.exports = CategoryField;
