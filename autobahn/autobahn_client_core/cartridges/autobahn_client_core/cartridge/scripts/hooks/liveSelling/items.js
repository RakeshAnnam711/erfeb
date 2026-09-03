/* eslint no-unused-vars: "off", no-useless-return: "off", consistent-return: "off" */

'use strict';

var Site = require('dw/system/Site');

/**
 * Checks whether the basket is a live selling one, based on the posted item documents
 * and on the product line items already in the basket, marking every live selling line
 * item as non returnable along the way.
 *
 * @param {dw.order.Basket} basket - the current basket
 * @param {Object|Array} basketItems - the ProductItem document(s) of the POST request
 * @returns {boolean} true if at least one item is flagged as a live selling line item
 */
function isLiveSelling(basket, basketItems) {
    var items = basketItems && basketItems.length === undefined ? [basketItems] : basketItems;
    var hasLiveSellingLineItem = false;

    basket.allProductLineItems.toArray().forEach(pli => {
        if (pli.custom.isLiveSellingLineItem) {
            pli.custom.somCC_returnable = false;
            hasLiveSellingLineItem = true;
        }
    });

    return hasLiveSellingLineItem || (items || []).some(function (item) {
        return item && item.c_isLiveSellingLineItem;
    });
}

exports.afterPOST = function (basket, basketItems) {
    if (!basket) {
        return;
    }

    if (isLiveSelling(basket, basketItems)) {
        var currentSite = Site.getCurrent();

        basket.custom.isLiveSellingOrder = true;
        basket.custom.liveSellingEventDate = currentSite.getCustomPreferenceValue('liveSellingEventDate');
        if (empty(basket.custom.liveSellingEventSummary)) {
            basket.custom.liveSellingEventSummary = currentSite.getCustomPreferenceValue('liveSellingEventSummary');
        }
    }
};
