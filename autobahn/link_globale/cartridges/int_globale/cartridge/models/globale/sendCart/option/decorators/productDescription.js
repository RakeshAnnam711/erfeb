'use strict';

/**
 * Calculates and returns Global-e Product.Description API
 * @returns {string} - Global-e Product.Description API
 */
function getProductDescription() {
    return (this.option.getDescription() || '');
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getProductDescription: {
            value: getProductDescription
        }
    });
};
