'use strict';

/**
 * Returns product custom inventory list id if it exists
 * @returns {product|null} - product custom inventory list id
 */
function geGetCustomProductInventoryListId() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var product = this;
    var result = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geUseCustomProductInventoryLists)
        ? globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.getProductInventoryListId, product)
        : null;

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetCustomProductInventoryListId: {
            value: geGetCustomProductInventoryListId
        }
    });
};
