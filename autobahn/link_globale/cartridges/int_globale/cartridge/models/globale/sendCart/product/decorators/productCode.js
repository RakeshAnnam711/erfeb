'use strict';

/**
 * Calculates and returns Global-e Product.getProductCode API
 * @returns {string} - Global-e Product.getProductCode API
 */
function getProductCode() {
    const gePliFactory = require('*/cartridge/scripts/factories/globale/dw/pli');
    let gePli = gePliFactory.get(this.productLineItem);
    return gePli.geGetProductCode();
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductCode', {
        value: getProductCode
    });
};
