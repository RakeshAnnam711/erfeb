'use strict';

var PriceBookMgr = require('dw/catalog/PriceBookMgr');

var LIVE_SELLING_PRICE_BOOK_ID = 'wgaca-liveselling';

/**
 * Returns the product's price only if it is explicitly defined in the live selling price book itself.
 * getPriceBookPrice() walks up the given price book's own parent chain when no explicit price is found
 * (wgaca-liveselling is based on wgaca-web-pricebook), so a product never added to wgaca-liveselling would
 * otherwise silently inherit the parent's price instead of falling back to normal default resolution. To
 * tell "explicitly priced here" apart from "only inherited from the parent", this also looks up the price
 * in the parent book and treats an identical result as "not really set here" - the one edge case this
 * can't distinguish is a live selling price deliberately set to the exact same value as the parent's price,
 * which is an acceptable tradeoff for a special-event pricing scenario.
 * @param {dw.catalog.Product} product - The product to look up
 * @returns {dw.value.Money|null} The live selling price, or null if this product has no price defined here
 */
function getLiveSellingPrice(product) {
    try {
        if (!product) {
            return null;
        }

        var priceBook = PriceBookMgr.getPriceBook(LIVE_SELLING_PRICE_BOOK_ID);

        if (!priceBook) {
            return null;
        }

        var priceModel = product.getPriceModel();
        var liveSellingPrice = priceModel.getPriceBookPrice(LIVE_SELLING_PRICE_BOOK_ID);

        if (!liveSellingPrice || !liveSellingPrice.available) {
            return null;
        }

        var parentPriceBook = priceBook.getParentPriceBook();

        if (parentPriceBook) {
            var parentPrice = priceModel.getPriceBookPrice(parentPriceBook.getID());

            if (parentPrice && parentPrice.available && parentPrice.equals(liveSellingPrice)) {
                return null;
            }
        }

        return liveSellingPrice;
    } catch (e) {
        return null;
    }
}

module.exports = {
    LIVE_SELLING_PRICE_BOOK_ID: LIVE_SELLING_PRICE_BOOK_ID,
    getLiveSellingPrice: getLiveSellingPrice
};
