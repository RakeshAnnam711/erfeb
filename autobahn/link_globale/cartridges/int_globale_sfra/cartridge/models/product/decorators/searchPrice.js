'use strict';

var base = module.superModule;

var PromotionMgr = require('dw/campaign/PromotionMgr');
var pricingHelper = require('*/cartridge/scripts/helpers/pricing');
var DefaultPrice = require('*/cartridge/models/price/default');
var RangePrice = require('*/cartridge/models/price/range');

var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var globaleSession = require('*/cartridge/models/globale/session');
var globalePriceModel = require('*/cartridge/scripts/factories/globale/priceModel');

/**
 * Get list price for a given product
 * @param {dw.catalog.ProductSearchHit} hit - current product returned by Search API.
 *
 * @returns {Object} - price for a product
 */
function getListPrices(hit) {
    var product = hit.product.isBundle() ? hit.product : hit.firstRepresentedProduct;
    var priceModel = globalePriceModel(product.getPriceModel(), product);

    if (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) {
        // List Price
        var priceBookPrice = priceModel.getFixedPriceBookPrice(true);
        if (!priceBookPrice.available && priceModel.price.available && priceModel.price.fixedPrice) {
            priceBookPrice = priceModel.price;
        }
        if (priceBookPrice.available || globaleSession.get('geUseFixedPricesOnly')) {
            return { minPrice: priceBookPrice, maxPrice: priceBookPrice };
        }
    }

    if (!priceModel.priceInfo) {
        return {};
    }
    var rootPriceBook = pricingHelper.getRootPriceBook(priceModel.priceInfo.priceBook);
    var price = priceModel.getPriceBookPrice(rootPriceBook.ID);
    if (!price.available) {
        price = (priceModel.price.available ? priceModel.price : priceModel.maxPrice);
    }
    return { minPrice: price, maxPrice: price };
}

module.exports = function (object, searchHit, activePromotions, getSearchHit) { // eslint-disable-line no-unused-vars
    if (globaleSession.get('geOperatedCountry')) {
        var globalePromotionPlan = require('*/cartridge/scripts/factories/globale/promotionPlan');
        var product = searchHit.product;
        var priceModel = globalePriceModel(product.priceModel, product);
        Object.defineProperty(object, 'price', {
            enumerable: true,
            value: (function () {
                var salePrice = { minPrice: priceModel.minPrice, maxPrice: priceModel.maxPrice };
                if (salePrice.minPrice.value !== salePrice.maxPrice.value) {
                    // range price
                    return new RangePrice(salePrice.minPrice, salePrice.maxPrice);
                }
                var promotions = globalePromotionPlan(PromotionMgr.activeCustomerPromotions).getProductPromotions(product);
                if (promotions.getLength() > 0) {
                    var promotionalPrice = pricingHelper.getPromotionPrice((product.isBundle() ? product : searchHit.firstRepresentedProduct), promotions);
                    if (promotionalPrice && promotionalPrice.available) {
                        salePrice = { minPrice: promotionalPrice, maxPrice: promotionalPrice };
                    }
                }
                var listPrice = getListPrices(searchHit);
                if (listPrice.minPrice && listPrice.minPrice.valueOrNull !== null) {
                    if (listPrice.minPrice.value !== salePrice.minPrice.value) {
                        return new DefaultPrice(salePrice.minPrice, listPrice.minPrice);
                    }
                }
                return new DefaultPrice(salePrice.minPrice);
            }())
        });
    } else {
        base.apply(base, Array.prototype.slice.call(arguments));
    }
};
