'use strict';

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
    markLiveSellingLineItems: markLiveSellingLineItems
};
