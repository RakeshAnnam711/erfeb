'use strict';

/**
 * Updates Product Line Item inventory list
 */
function geUpdateProductsInventoryList() {
    var Transaction = require('dw/system/Transaction');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var basket = this;
    collections.forEach(basket.allProductLineItems, function (productLineItem) {
        if (productLineItem.product === null) {
            return;
        }

        Transaction.wrap(function () {
            var geProduct = geProductMgr.get(productLineItem.product);
            if (geProduct.geGetCustomProductInventoryListId() !== null) {
                productLineItem.setProductInventoryList(ProductInventoryMgr.getInventoryList(geProduct.geGetCustomProductInventoryListId()));
            }
        });
    });
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geUpdateProductsInventoryList: {
            value: geUpdateProductsInventoryList
        }
    });
};
