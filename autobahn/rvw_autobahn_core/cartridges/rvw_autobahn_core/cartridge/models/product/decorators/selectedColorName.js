'use strict';

function getSelectedColorName(product) {
    var selectedColorName;

    if (!empty(product.variationAttributes)) {
        product.variationAttributes.forEach(function(attribute) {
            if (attribute.id === 'color') {
                attribute.values.forEach(function(value) {
                    if (value.selected) {
                        selectedColorName = value.displayValue;
                    }
                });
            }
        });
    }
    

    return selectedColorName;
}

module.exports = function(object, product) {
    Object.defineProperty(object, 'selectedColorName', {
        enumerable: true,
        value: getSelectedColorName(product)
    });
};
