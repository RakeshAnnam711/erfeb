'use strict';

var quantitySelector = require('*/cartridge/models/product/decorators/quantitySelector');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var preferences = require('*/cartridge/config/preferences');

/**
 * get the min and max numbers to display in the quantity drop down.
 * @param {Object} productLineItem - a line item of the basket.
 * @param {number} quantity - number of items for this product
 * @returns {Object} The minOrderQuantity and maxOrderQuantity to display in the quantity drop down.
 */
function getMinMaxQuantityOptions(productLineItem, quantity) {
    // ***** NOTE: The change below for setting "availableToSell" (ATS) was the original reason for overriding this function from base SFRA.
    // The line, as of v4.4.1, checked the inventoryRecord to see if the product had ATS.
    // However, if the inventory list is set to default in-stock, and no inventory record has been created,
    // checking "product.availabilityModel.inventoryRecord.ATS" throws an error because inventoryRecord is null.
    // The product.availabilityModel.availability will be 0 if the item has inventory and it's out of stock
    // and it will be 1 if the product is perpetual inventory OR it's a stocked product with 1 or more available.
    // Because of that, we can use it for setting ATS if there is no inventoryRecord.
    // ***** Update
    // I added a check for the inventoryRecord, preferring to use that setting if it's available. We found
    // some scenarios where a user could add more items to their cart than were available because perpetual was set to the wrong value.
    // Refer to QL-490
    // *****
    var availableToSell = productLineItem.product.availabilityModel.availability;
    var perpetual = availableToSell === 0 ? false : true;

    var DEFAULT_MAX_ORDER_QUANTITY = productLineItem.product.custom.quantityDropdownLimit ? productLineItem.product.custom.quantityDropdownLimit : preferences.maxOrderQty ? preferences.maxOrderQty : 10; 

    if (productLineItem.product.availabilityModel.inventoryRecord !== null) {
        availableToSell = productLineItem.product.availabilityModel.inventoryRecord.ATS.value;
        perpetual = productLineItem.product.availabilityModel.inventoryRecord.perpetual;
    }

    var max;
    if (productLineItem.productInventoryListID) {
        var inventoryList = ProductInventoryMgr.getInventoryList(productLineItem.productInventoryListID);
        var inventoryRecord = inventoryList.getRecord(productLineItem.product.ID);
        availableToSell = inventoryRecord ? inventoryRecord.ATS.value : 0;
        perpetual = inventoryRecord ? inventoryRecord.perpetual : false;
    }

    if (perpetual) {
        max = Math.max(DEFAULT_MAX_ORDER_QUANTITY, quantity);
    } else {
        max = Math.max(Math.min(availableToSell, DEFAULT_MAX_ORDER_QUANTITY), quantity);
    }

    var quantityData = {
        minOrderQuantity: productLineItem.product.minOrderQuantity.value || 1,
        maxOrderQuantity: max,
        selectedQuantity: productLineItem.quantityValue,
        id: productLineItem.productID
    };

    quantitySelector(quantityData, productLineItem.product.stepQuantity.value || 1, {}, {});

    return quantityData;
}

module.exports = function(object, productLineItem, quantity) {
    Object.defineProperty(object, 'quantityOptions', {
        enumerable: true,
        value: getMinMaxQuantityOptions(productLineItem, quantity)
    });
};
