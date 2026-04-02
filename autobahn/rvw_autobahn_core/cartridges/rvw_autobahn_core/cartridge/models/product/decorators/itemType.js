'use strict';

module.exports = function (object, apiProduct) {
    if (apiProduct && 'itemType' in apiProduct.custom) {
        Object.defineProperty(object, 'itemType', {
            enumerable: true,
            value: apiProduct.custom.itemType.getValue() || ''
        });
    }
};
