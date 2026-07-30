'use strict';

var base = module.superModule;
var baseGetStores = base.getStores;
/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {string} type - selected store type
 * @param {Object} geolocation - geolocation object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @param {[Object]} products - an array of product ids to quantities that needs to be filtered by.
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, postalCode, lat, long, type, geolocation, showMap, url, products) {
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');

    var storesModel = baseGetStores.apply(this, arguments);

    if (products) {
        storesModel.noInventoryStores = storesModel.stores.filter(function (store) {
            var storeInventoryListId = store.inventoryListId;
            if (storeInventoryListId) {
                var storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
                if(!empty(storeInventory)) {
                    return products.every(function (product) {
                        var inventoryRecord = storeInventory.getRecord(product.id);
                        if (inventoryRecord && inventoryRecord.ATS.value >= product.quantity) {
                            return false;
                        } else {
                            return store;
                        }
                    });
                }
            }
            return store;
        });
        storesModel.products = products;
    }

    storesModel.stores = storesModel.stores.filter(function (store) {
        var storeInventoryListId = store.inventoryListId;
        if (products) {
            if (storeInventoryListId) {
                var storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
                if(!empty(storeInventory)) {
                    return products.every(function (product) {
                        var inventoryRecord = storeInventory.getRecord(product.id);
                        return inventoryRecord && inventoryRecord.ATS.value >= product.quantity;
                    });
                }
            }
        } else {
            return true;
        }
    });

    return storesModel;
}

/**
 *
 * @param {string} products - list of product details info in the form of "productId:quantity,productId:quantity,... "
 * @returns {Object} a object containing product ID and quantity
 */
function buildProductListAsJson(products) {
    if (!products) {
        return null;
    }

    return products.split(',').map(function (item) {
        var properties = item.split(':');
        return { id: properties[0], quantity: properties[1] };
    });
}

/**
 *
 * @param {string} storeId - a store ID to look up
 * @returns {Object} a object containing store details
 */
function getStoreById(storeId) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var StoreModel = require('*/cartridge/models/store');
    var storeObject = StoreMgr.getStore(storeId);
    var store = new StoreModel(storeObject);

    return store;
}

base.getStores = getStores;
base.buildProductListAsJson = buildProductListAsJson;
base.getStoreById = getStoreById;

module.exports = base;
