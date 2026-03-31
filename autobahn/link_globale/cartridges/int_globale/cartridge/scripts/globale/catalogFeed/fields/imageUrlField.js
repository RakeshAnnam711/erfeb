'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents image URL field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function ImageUrlField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
ImageUrlField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string} - field value
 */
ImageUrlField.prototype.getValue = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.getProductImageUrl, this.product);
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
ImageUrlField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header) {
        valid = false;
    }
    return valid;
};

module.exports = ImageUrlField;
