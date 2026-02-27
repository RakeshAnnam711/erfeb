'use strict';

/**
 * Creates field object
 * @param {Object} columnConfig - column configuration
 * @param {dw.catalog.Product} product - Product
 * @returns {Object} - field object (AbstractField ancestors)
 */
function createField(columnConfig, product) {
    var feedFileds = require('*/cartridge/scripts/globale/catalogFeed/fields/index');
    var field = null;
    switch (columnConfig.type) {
        case 'product':
        case 'static':
        case 'imageUrl':
        case 'productUrl':
        case 'variationAttribute':
        case 'tax':
        case 'category':
        case 'preference':
        case 'price':
        case 'weight':
        case 'custom':
            field = new feedFileds[columnConfig.type](columnConfig, product);
            break;
        case 'code':
            field = new feedFileds[columnConfig.type](columnConfig, product);
            break;
        default:
            break;
    }

    if (!field) {
        throw new Error('Unsupported column type: ' + columnConfig.type);
    }

    return field;
}

module.exports = {
    createField: createField
};
