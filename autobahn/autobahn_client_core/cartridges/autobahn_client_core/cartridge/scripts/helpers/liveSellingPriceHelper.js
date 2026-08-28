'use strict';

var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var Site = require('dw/system/Site');

var DEFAULT_LIVE_SELLING_PRICE_BOOK_ID = 'wgaca-liveselling';

// Configurable via the liveSellingPriceBookID Site Preference, so the price book ID can differ per environment without a code deploy. Falls back to the original hardcoded default if left blank.
function getLiveSellingPriceBookID() {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue('liveSellingPriceBookID');
        return value ? value.toString() : DEFAULT_LIVE_SELLING_PRICE_BOOK_ID;
    } catch (e) {
        return DEFAULT_LIVE_SELLING_PRICE_BOOK_ID;
    }
}

// Returns the product's price only if explicitly set in the live selling price book - compares against the parent book's price to avoid silently inheriting it via getPriceBookPrice()'s parent-chain walk.
function getLiveSellingPrice(product) {
    try {
        if (!product) {
            return null;
        }

        var liveSellingPriceBookID = getLiveSellingPriceBookID();
        var priceBook = PriceBookMgr.getPriceBook(liveSellingPriceBookID);

        if (!priceBook) {
            return null;
        }

        var priceModel = product.getPriceModel();
        var liveSellingPrice = priceModel.getPriceBookPrice(liveSellingPriceBookID);

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
    getLiveSellingPriceBookID: getLiveSellingPriceBookID,
    getLiveSellingPrice: getLiveSellingPrice
};
