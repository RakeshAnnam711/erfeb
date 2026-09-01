'use strict';

var AbstractField = require('*/cartridge/scripts/globale/catalogFeed/fields/abstractField');

/**
 * Represents VariationAttribute field
 * @constructor
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product|null} product - Product
 */
function VariationAttributeField(columnConfig, product) {
    AbstractField.call(this, columnConfig, product);
}

/* Inherits AbstarctField */
VariationAttributeField.prototype = Object.create(AbstractField.prototype);

/**
 * Returns field value
 * @returns {string|number} - field value
 */
VariationAttributeField.prototype.getValue = function () {
    var self = this;
    var pvm = this.product.variationModel;
    var pvas = pvm.getProductVariationAttributes();
    var value = '';
    Array.prototype.some.call(pvas, function (pva) {
        if (pva.attributeID === self.column.attr) {
            var pvav = pvm.getSelectedValue(pva);
            if (pvav) {
                var attr = ((('value' in self.column) && self.column.value) || 'value');
                value = ((pvav && (attr in pvav) && pvav[attr]) || '');
            }
            return true;
        }
        return false;
    });

    return value;
};

/**
 * Validate column
 * @returns {boolean} - result of validation
 */
VariationAttributeField.prototype.isValidColumn = function () {
    var valid = true;
    if (!this.column.header || this.column.attr === null || this.column.attr === undefined || this.column.attr === '') {
        valid = false;
    }
    return valid;
};

module.exports = VariationAttributeField;
