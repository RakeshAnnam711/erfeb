'use strict';

var base = module.superModule;
var originalValidateProducts = base.validateProducts;

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateProducts(basket) {
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var globaleSession = require('*/cartridge/models/globale/session');
    var collections = require('*/cartridge/scripts/util/collections');
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var result = originalValidateProducts(basket);
    if (globaleSession.get('geOperatedCountry') && result && !result.error) {
        collections.find(basket.productLineItems, function (pli) {
            if (pli.product === null) {
                return false;
            }

            var geProduct = geProductMgr.get(pli.product);
            if (geProduct.isGeRestricted(globaleSession.get('geCountry'))) {
                result.error = true;
                return true;
            }

            // check is product availability related to custom inventory list
            if (geProduct.geGetCustomProductInventoryListId() !== null) {
                var productInventoryList = ProductInventoryMgr.getInventoryList(geProduct.geGetCustomProductInventoryListId());
                result.hasInventory = result.hasInventory
                    && (productInventoryList.getRecord(pli.productID)
                    && productInventoryList.getRecord(pli.productID).ATS.value >= pli.quantityValue);
            }

            return false;
        });
    }

    return result;
}

module.exports = base;
module.exports.validateProducts = validateProducts;
