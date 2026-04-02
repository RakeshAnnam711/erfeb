'use strict';

module.exports = {
    get: function (product) {
        if (!product) {
            throw Error('product shouldn\'t be null');
        }

        var geProduct = Object.create(product);
        var decorators = require('*/cartridge/models/globale/dw/product/decorators/index'); // eslint-disable-line no-unused-vars
        decorators.geGetVatRate(geProduct);
        decorators.geRestrictions(geProduct);
        decorators.geGetCustomProductInventoryListId(geProduct);

        return geProduct;
    },
    geGetProductAvailability: function (id, qty) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');

        var dwProduct = ProductMgr.getProduct(id);
        if (!dwProduct) {
            throw Error('Product ' + id + ' doesn\'t exist');
        }

        // check is product availability related to regular inventory list
        var availabilityLevels = dwProduct.availabilityModel.getAvailabilityLevels(qty);

        // get decorated dwProduct
        var geProduct = this.get(dwProduct);

        // check is product availability related to custom inventory list
        var geCustomProductInventoryListId = geProduct.geGetCustomProductInventoryListId();
        if (geCustomProductInventoryListId !== null) {
            var productInventoryList = ProductInventoryMgr.getInventoryList(geCustomProductInventoryListId);
            if (productInventoryList === null || productInventoryList.getRecord(id) === null) {
                return {
                    hasInventory: false,
                    inStock: 0,
                    outOfStock: 0
                };
            }
            availabilityLevels = dwProduct.getAvailabilityModel(productInventoryList).getAvailabilityLevels(qty);
        }

        return {
            hasInventory: (dwProduct.online && availabilityLevels.getNotAvailable().value === 0),
            inStock: availabilityLevels.getInStock().value,
            outOfStock: availabilityLevels.getNotAvailable().value
        };
    }
};
