'use strict';

module.exports = function (object, apiProduct, options) {
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');

    // Get the hideQty product attribute / site pref
    Object.defineProperty(object, 'hideQty', {
        enumerable: true,
        value: !empty(apiProduct) ? preferenceHelper.getAttributeValue('hideQty', apiProduct, 'hideQty') : false
    });

    // Get the enableQuantityStepper site pref
    Object.defineProperty(object, 'enableQuantityStepper', {
        enumerable: true,
        value: !empty(apiProduct) ? preferenceHelper.getAttributeValue('enableQuantityStepper') : false
    });

    Object.defineProperty(object, 'priceTotal', {
        enumerable: true,
        value: function (object, lineItem) {
            var priceTotal = object.priceTotal;
            priceTotal.priceValue = lineItem.priceValue;
            return priceTotal;
        }(object, options.lineItem)
    });
};
