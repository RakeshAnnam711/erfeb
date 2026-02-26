'use strict';

/**
 * Checks is product used as Gift Card
 * @returns {boolean} - Global-e Product.isGiftCard API
 */
function isGiftCard() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return (this.apiProduct.custom[globaleHelpers.customAttr.product.geIsGiftCard] === true);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isGiftCard: {
            value: isGiftCard
        }
    });
};
