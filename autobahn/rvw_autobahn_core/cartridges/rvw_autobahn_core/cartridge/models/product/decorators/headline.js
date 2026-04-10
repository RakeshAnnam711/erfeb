'use strict';

module.exports = function (object, apiProduct) {
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');

    Object.defineProperty(object, 'headlineDescription', {
        enumerable: true,
        value: function() {
            var markup = preferenceHelper.getAttributeValue('headlineDescription', apiProduct, 'headlineDescription')
            if (markup && markup.markup) {
                return markup.markup;
            } else {
                return '';
            }
        }()
    });

    Object.defineProperty(object, 'headline', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('headline', apiProduct, 'headline')
    });
};
