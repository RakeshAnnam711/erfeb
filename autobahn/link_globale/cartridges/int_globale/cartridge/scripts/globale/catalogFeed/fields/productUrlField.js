'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents product URL field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function ProductUrlField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
ProductUrlField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string} - field value
 */
ProductUrlField.prototype.getValue = function () {
    var URLUtils = require('dw/web/URLUtils');
    var masterProduct = ((('masterProduct' in this.product) && this.product.masterProduct) || this.product);
    var controller = (this.column.controller || 'Product-Show');
    var attr = (this.column.attr || 'pid');
    var val;

    // replace host
    if (this.column.host) {
        val = URLUtils.https(controller, attr, masterProduct.ID).host(this.column.host);
    } else {
        val = URLUtils.https(controller, attr, masterProduct.ID);
    }
    return val.toString();
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
ProductUrlField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.attr === null || this.column.attr === undefined || this.column.attr === '') {
        valid = false;
    }
    return valid;
};

module.exports = ProductUrlField;
