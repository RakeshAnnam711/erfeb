'use strict';

var base = module.superModule;
var liveSellingHelpers = require('*/cartridge/scripts/helpers/liveSellingHelpers');

/**
 * @constructor
 * @classdesc CartModel class that represents the current basket
 *
 * @param {dw.order.Basket} basket - Current users's basket
 */
function CartModel(basket) {
    base.call(this, basket);

    // live selling baskets are cleared as a whole - no line item removal, no coupons
    try {
        this.isLiveSellingOrder = !!(basket && basket.custom.isLiveSellingOrder);
    } catch (e) {
        this.isLiveSellingOrder = false;
    }

    liveSellingHelpers.markLiveSellingLineItems(basket, this.items);
}

module.exports = CartModel;
