'use strict';

var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var Site = require('dw/system/Site');

var DEFAULT_LIVE_SELLING_PRICE_BOOK_ID = 'wgaca-liveselling';

// The Site Preference allows each environment to use a different price book.
function getLiveSellingPriceBookID() {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue('liveSellingPriceBookID');
        return value ? value.toString() : DEFAULT_LIVE_SELLING_PRICE_BOOK_ID;
    } catch (e) {
        return DEFAULT_LIVE_SELLING_PRICE_BOOK_ID;
    }
}

// Return only prices defined directly in the live-selling price book.
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
