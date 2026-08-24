'use strict';

var PriceBookMgr = require('dw/catalog/PriceBookMgr');

var LIVE_SELLING_PRICE_BOOK_ID = 'wgaca-liveselling';

// Returns the product's price only if explicitly set in the live selling price book - compares against the parent book's price to avoid silently inheriting it via getPriceBookPrice()'s parent-chain walk.
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
