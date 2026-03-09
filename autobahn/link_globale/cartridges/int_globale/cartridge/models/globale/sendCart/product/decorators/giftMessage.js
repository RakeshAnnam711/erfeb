'use strict';

/**
 * Calculates and returns Global-e Product.GiftMessage API
 * @returns {string|null} - Global-e Product.GiftMessage API
 */
function getGiftMessage() {
    return null;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getGiftMessage', {
        value: getGiftMessage
    });
};
