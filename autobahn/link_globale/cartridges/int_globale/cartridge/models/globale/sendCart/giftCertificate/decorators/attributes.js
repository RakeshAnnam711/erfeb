'use strict';

/**
 * Calculates and returns Global-e Product.Attributes API
 * @returns {array} - Global-e Product.Attributes API
 */
function getAttributes() {
    return [];
}

module.exports = function (object) {
    Object.defineProperty(object, 'getAttributes', {
        value: getAttributes
    });
};
