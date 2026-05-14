'use strict';

module.exports = function(object, apiProduct, options) {
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');
    var currentSite = dw.system.Site.getCurrent();

    if(currentSite.getCustomPreferenceValue('bopisCartridgeEnabled')) {
        var fromStoreID = require('*/cartridge/models/productLineItem/decorators/fromStoreID');
        var lineItem = options.lineItem;
        fromStoreID(object,lineItem);
    }
};
