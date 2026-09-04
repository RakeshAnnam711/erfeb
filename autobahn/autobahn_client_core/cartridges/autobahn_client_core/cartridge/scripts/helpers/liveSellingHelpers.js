'use strict';

var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

function isAssignedToLiveSellingChild(product, parentID) {
    var categories = product && product.onlineCategories;

    if (!categories || categories.empty) {
        return false;
    }

    for (var i = 0, len = categories.length; i < len; i++) {
        var parent = categories[i] && categories[i].parent;
        if (parent && parent.ID === parentID) {
            return true;
        }
    }

    return false;
}

// Live selling products belong to a direct child of the configured category.
function isLiveSellingProduct(apiProduct) {
    if (!apiProduct) {
        return false;
    }

    try {
        var parentID = Site.getCurrent().getCustomPreferenceValue('liveSellingCategoryID');
        if (empty(parentID)) {
            return false;
        }

        if (isAssignedToLiveSellingChild(apiProduct, parentID)) {
            return true;
        }

        return !!(apiProduct.variant && apiProduct.masterProduct &&
            isAssignedToLiveSellingChild(apiProduct.masterProduct, parentID));
    } catch (e) {
        return false;
    }
}

/**
 * Empties the given basket, removing every line item, coupon and price adjustment, and
 * resets the live selling stamps left on it.
 *
 * BasketMgr.deleteBasket() is restricted to agent scenarios - it requires the
 * Create_Order_On_Behalf_Of permission and throws "user not authorized to act on
 * behalf of customer" for shopper sessions, so the basket is emptied instead.
 *
 * @param {dw.order.Basket} basket - the basket to empty
 */
function clearBasket(basket) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    if (!basket) {
        return;
    }
    // TO DO: find the way to delete Agent basket complitly instead.
    Transaction.wrap(function () {
        while (basket.productLineItems.length > 0) {
            basket.removeProductLineItem(basket.productLineItems[0]);
        }
        while (basket.giftCertificateLineItems.length > 0) {
            basket.removeGiftCertificateLineItem(basket.giftCertificateLineItems[0]);
        }
        while (basket.bonusDiscountLineItems.length > 0) {
            basket.removeBonusDiscountLineItem(basket.bonusDiscountLineItems[0]);
        }
        while (basket.couponLineItems.length > 0) {
            basket.removeCouponLineItem(basket.couponLineItems[0]);
        }
        while (basket.priceAdjustments.length > 0) {
            basket.removePriceAdjustment(basket.priceAdjustments[0]);
        }

        basket.custom.isLiveSellingOrder = null;
        basket.custom.liveSellingEventSummary = null;
        basket.custom.cscHandoffExpiration = null;
        session.custom.liveSelling = false;

        basketCalculationHelpers.calculateTotals(basket);
    });
}

/**
 * Flags the given line item models as live selling ones, based on the matching product
 * line items of the container. Line item models do not carry custom attributes, so the
 * flag is copied over by UUID.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - the basket or order the models were built from
 * @param {Array} items - line item models to decorate
 */
function markLiveSellingLineItems(lineItemCtnr, items) {
    if (!lineItemCtnr || !items) {
        return;
    }

    var isLiveSellingByUUID = {};

    lineItemCtnr.allProductLineItems.toArray().forEach(function (pli) {
        isLiveSellingByUUID[pli.UUID] = !!pli.custom.isLiveSellingLineItem;
    });

    items.forEach(function (item) {
        item.isLiveSellingLineItem = !!isLiveSellingByUUID[item.UUID];
    });
}

module.exports = {
    clearBasket: clearBasket,
    markLiveSellingLineItems: markLiveSellingLineItems,
    isLiveSellingProduct: isLiveSellingProduct
};
