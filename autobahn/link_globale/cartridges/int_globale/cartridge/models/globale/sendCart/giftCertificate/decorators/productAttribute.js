'use strict';

/**
 * Retrieves the Product's attribute value
 * @param {string} attributeKeyPreference - Site Preference containing the name of the product's attribute
 * @returns {string|number|boolean|null} - The value of the product's attribute
 */
function getProductAttributeByPref() {
    return null;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductAttributeByPref', {
        value: getProductAttributeByPref
    });
};
