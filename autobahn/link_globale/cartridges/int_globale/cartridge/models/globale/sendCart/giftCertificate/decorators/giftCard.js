'use strict';

/**
 * Checks is product used as Gift Card
 * @returns {boolean} - Global-e Product.isGiftCard API
 */
function isGiftCard() {
    return true;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isGiftCard: {
            value: isGiftCard
        }
    });
};
