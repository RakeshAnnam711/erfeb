'use strict';

var base = module.superModule;

module.exports = function (object, quantity, minOrderQuantity) {
    var Resource = require('dw/web/Resource');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var globaleSession = require('*/cartridge/models/globale/session');
    var apiProduct = require('dw/catalog/ProductMgr').getProduct(object.id);
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var geProduct = geProductMgr.get(apiProduct);
    var availability;

    if (globaleSession.get('geOperatedCountry') && geProduct.isGeRestricted(globaleSession.get('geCountry'))) { // check is product restricted for selected country
        availability = { messages: [geProduct.getGeRestrictionMessage(globaleSession.get('geCountry'))] };
        Object.defineProperties(object, {
            availability: {
                enumerable: true,
                value: availability
            },
            available: {
                enumerable: true,
                value: 0
            }
        });
    } else if (globaleSession.get('geOperatedCountry') && geProduct.geGetCustomProductInventoryListId() !== null) { // check is product availability related to custom inventory list
        var productInventoryList = ProductInventoryMgr.getInventoryList(geProduct.geGetCustomProductInventoryListId());
        var productQuantity = quantity ? parseInt(quantity, 10) : minOrderQuantity;
        if (productInventoryList === null || productInventoryList.getRecord(object.id) === null || productInventoryList.getRecord(object.id).ATS.value < productQuantity) {
            availability = { messages: [Resource.msg('label.not.available.items', 'common', null)] };
            Object.defineProperties(object, {
                availability: {
                    enumerable: true,
                    value: availability
                },
                available: {
                    enumerable: true,
                    value: 0
                }
            });
        } else { // call base logic
            base.apply(base, Array.prototype.slice.call(arguments));
        }
    } else { // call base logic
        base.apply(base, Array.prototype.slice.call(arguments));
    }
};
