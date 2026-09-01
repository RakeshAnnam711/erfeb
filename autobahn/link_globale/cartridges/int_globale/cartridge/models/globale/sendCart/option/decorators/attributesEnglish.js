'use strict';

/**
 * Calculates and returns Global-e Product.Attributes API for Product Options
 * @returns {array} - Global-e Product.Attributes API
 */
function getAttributesEnglish() {
    return [];
}

module.exports = function (object) {
    Object.defineProperty(object, 'getAttributesEnglish', {
        value: getAttributesEnglish
    });
};
