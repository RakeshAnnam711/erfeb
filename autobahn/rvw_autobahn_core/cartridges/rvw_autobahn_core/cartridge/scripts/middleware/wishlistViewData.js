'use strict';

var productListMgr = require('dw/customer/ProductListMgr');
var ProductList = require('dw/customer/ProductList');
var Site = require('dw/system/Site');

function getWishlistData(req, res, next) {
    var currentSite = Site.getCurrent();
    var collections = require('*/cartridge/scripts/util/collections');
    var customer = req.currentCustomer && req.currentCustomer.raw || null;
    var wishlistPIDs = [];

    if (currentSite && currentSite.getCustomPreferenceValue('wishlistEnable')) {
        if (customer) {
            // Get PIDs of every item in a wishlist created by the user
            collections.forEach(productListMgr.getProductLists(customer, ProductList.TYPE_WISH_LIST), function (list) {
                list.productItems.toArray().forEach(product => wishlistPIDs.push(product.productID));
            });

            res.setViewData({wishlistPIDs: wishlistPIDs});
        }
    }

    next()
}

module.exports = {
    getWishlistData: getWishlistData
}
