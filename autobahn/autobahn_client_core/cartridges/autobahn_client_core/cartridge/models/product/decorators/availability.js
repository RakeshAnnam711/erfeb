'use strict';

var base = module.superModule;

module.exports = function (object, quantity, minOrderQuantity) {
    var Resource = require('dw/web/Resource');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');

    var globaleSession = require('*/cartridge/models/globale/session');
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');

    var apiProduct = ProductMgr.getProduct(object.id);

    // Safety check: If product is null (e.g., invalid ID in wishlist)
    if (!apiProduct) {
        Object.defineProperties(object, {
            availability: {
                enumerable: true,
                value: { messages: [Resource.msg('label.not.available.items', 'common', null)] }
            },
            available: {
                enumerable: true,
                value: 0
            }
        });
        return;
    }

    var geProduct = geProductMgr.get(apiProduct);
    var productQuantity = quantity ? parseInt(quantity, 10) : minOrderQuantity;

    // Check if product is restricted in selected country
    var geOperatedCountry = globaleSession.get('geOperatedCountry');
    var geCountry = globaleSession.get('geCountry');

    if (geOperatedCountry && geProduct.isGeRestricted(geCountry)) {
        Object.defineProperties(object, {
            availability: {
                enumerable: true,
                value: {
                    messages: [geProduct.getGeRestrictionMessage(geCountry)]
                }
            },
            available: {
                enumerable: true,
                value: 0
            }
        });
        return;
    }

    // Check for custom inventory list availability override
    var customInventoryListId = geProduct.geGetCustomProductInventoryListId();
    if (geOperatedCountry && customInventoryListId !== null) {
        var inventoryList = ProductInventoryMgr.getInventoryList(customInventoryListId);
        var inventoryRecord = inventoryList && inventoryList.getRecord(object.id);

        if (!inventoryList || !inventoryRecord || inventoryRecord.ATS.value < productQuantity) {
            Object.defineProperties(object, {
                availability: {
                    enumerable: true,
                    value: { messages: [Resource.msg('label.not.available.items', 'common', null)] }
                },
                available: {
                    enumerable: true,
                    value: 0
                }
            });
            return;
        }
    }

    // Default case: call base decorator with proper availabilityModel
    base(object, quantity, minOrderQuantity, apiProduct.availabilityModel);
};
