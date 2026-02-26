'use strict';

/**
 * Retrieves the Product's attribute value
 * @param {string} attributeKeyPreference - Site Preference containing the name of the product's attribute
 * @returns {string|number|boolean|null} - The value of the product's attribute
 */
function getProductAttributeByPref(attributeKeyPreference) {
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var value = null;
    var attributeKey = globaleHelpers.getPreference(globaleHelpers.preferenceKeys[attributeKeyPreference]);
    if (attributeKey) {
        value = objectUtils.getValueByPath(this.apiProduct, attributeKey, null);
    }
    return value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductAttributeByPref', {
        value: getProductAttributeByPref
    });
};
