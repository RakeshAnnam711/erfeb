'use strict';

function maxQuantity(product) {
    var preferences = require('*/cartridge/config/preferences');
    var DEFAULT_MAX_ORDER_QUANTITY = product.custom.quantityDropdownLimit ? product.custom.quantityDropdownLimit : preferences.maxOrderQty ? preferences.maxOrderQty : 10;

    return DEFAULT_MAX_ORDER_QUANTITY;
}

module.exports = function (object, product, quantity) {
    Object.defineProperty(object, 'selectedQuantity', {
        enumerable: true,
        value: parseInt(quantity, 10) || (product && product.minOrderQuantity ? product.minOrderQuantity.value : 1)
    });
    Object.defineProperty(object, 'minOrderQuantity', {
        enumerable: true,
        value: product && product.minOrderQuantity ? product.minOrderQuantity.value : 1
    });
    Object.defineProperty(object, 'maxOrderQuantity', {
        enumerable: true,
        value: maxQuantity(product)
    });
};
