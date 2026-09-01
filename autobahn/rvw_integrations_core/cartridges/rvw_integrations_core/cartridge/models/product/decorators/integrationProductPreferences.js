'use strict';

module.exports = function(object, apiProduct, options) {
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');
    var currentSite = dw.system.Site.getCurrent();

    if(currentSite.getCustomPreferenceValue('bopisCartridgeEnabled')) {
        Object.defineProperty(object, 'availableForInStorePickup', {
            enumerable: true,
            value: preferenceHelper.getProductAttributeValue('availableForInStorePickup', apiProduct, 'availableForInStorePickup', options.variationModel)
        });
    }
};
