'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents price field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function PriceField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
PriceField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
PriceField.prototype.getValue = function () {
    var Money = require('dw/value/Money');
    var fieldMgr = require('*/cartridge/scripts/globale/catalogFeed/fieldMgr');
    var priceBookPrice = this.product.priceModel.getPriceBookPrice(this.column.attr);
    var result = '';
    if (priceBookPrice !== Money.NOT_AVAILABLE) {
        result = priceBookPrice.value;
    } else if (('fallback' in this.column) && this.column.fallback) {
        var fallbackField = fieldMgr.createField(this.column.fallback, this.product);
        result = fallbackField.getValue();
    }

    return result;
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
PriceField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.attr === null || this.column.attr === undefined || this.column.attr === '') {
        valid = false;
    }
    return valid;
};

module.exports = PriceField;
