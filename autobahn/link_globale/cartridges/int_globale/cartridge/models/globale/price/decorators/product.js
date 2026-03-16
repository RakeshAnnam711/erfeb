'use strict';

/**
 * Returns SFCC Product object searched by given productId
 * @param {string} productId - SFCC Product ID
 * @returns {dw.catalog.Product|null} - SFCC Product object or null
 */
function getProduct(productId) {
    try {
        var ProductMgt = require('dw/catalog/ProductMgr');
        return (productId ? ProductMgt.getProduct(productId) : null);
    } catch (e) {
        this.logger.error('getProduct: {0}', this.logger.message(e));
    }
    return null;
}

module.exports = function (object, productId) {
    Object.defineProperties(object, {
        product: {
            enumerable: true,
            value: getProduct.call(this, productId)
        }
    });
};
