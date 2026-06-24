'use strict';

/**
 * Validates basket
 * @returns {Object} - result
 */
function geValidateBasket() {
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var result = { error: false, message: null };

    try {
        // validate basket products
        var productLineItems = this.getAllProductLineItems().iterator();
        var pliOOS = [];
        while (productLineItems.hasNext()) {
            var productLineItem = productLineItems.next();
            // skip bundled and option product line items
            if (productLineItem.bundledProductLineItem || productLineItem.optionProductLineItem) {
                continue; // eslint-disable-line no-continue
            }
            var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
            var productAvailability = geProductMgr.geGetProductAvailability(productLineItem.productID, productLineItem.quantityValue);
            // check has product inventory
            if (productAvailability.hasInventory === false) {
                var pliOOSMsg = (pliOOS.length === 0) ? 'NOT AVAILABLE INVENTORY SKU: ' : '';
                pliOOSMsg += productLineItem.productID + '(' + (productLineItem.productInventoryListID || ProductInventoryMgr.getInventoryList().ID) + ')';
                pliOOS.push(pliOOSMsg);
            }
        }
        if (pliOOS.length > 0) {
            result.error = true;
            result.message = pliOOS.join('; ');
        }
    } catch (e) {
        result.error = true;
        result.message = ('VALIDATE BASKET PRODUCTS EXCEPTION:' + e.message + '; ' + e.stack);
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geValidateBasket: {
            value: geValidateBasket
        }
    });
};
