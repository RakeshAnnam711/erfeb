'use strict';

const base = module.superModule;

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
base.createOrder = function (currentBasket) {
    var Currency = require('dw/util/Currency');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var Logger = require('dw/system/Logger');
    var order;

    try {
        Logger.warn("autobahn_client_core: checkoutHelpers for the customer " + currentBasket.customerEmail);
        order = Transaction.wrap(function () {
            if (!empty(currentBasket.custom.flowOrderNo)) {
                if (session.currency.currencyCode !== currentBasket.currencyCode) {
                    session.setCurrency(Currency.getCurrency(currentBasket.currencyCode));
                }
                return OrderMgr.createOrder(currentBasket, currentBasket.custom.flowOrderNo);
            }

            return OrderMgr.createOrder(currentBasket);
        });
        try {
            var collections = require('*/cartridge/scripts/util/collections');
            var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
            var ProductListMgr = require('dw/customer/ProductListMgr');
            var wishListType = require('dw/customer/ProductList').TYPE_WISH_LIST;
            var customer = order.getCustomer();
    
            if (!customer) {
                Logger.warn("autobahn_client_core: No registered customer found. Skipping wishlist cleanup.");
                return null;
            }
            
            var allWishlists = ProductListMgr.getProductLists(customer, wishListType).toArray();

            if (allWishlists && allWishlists.length > 0) {
                for (var i = 0; i < allWishlists.length; i++) {
                    var wishlist = allWishlists[i];
                    collections.forEach(order.productLineItems, function (lineItem) {
                        productListHelper.removeItemFromNamedList(wishlist, customer, lineItem.productID, {
                            type: wishListType,
                            req: request
                        });
                    });
                }
            } else {
                Logger.warn("autobahn_client_core: No wishlists found for customer.");
            }
        } catch (e) {
            Logger.error("autobahn_client_core: Wishlist cleanup error: " + e.message);
        }
    } catch (error) {
        Logger.error('Error creating an order: {0} - {1}', error.message, error.stack);
        return null;
    }
    return order;
}

module.exports = base;
