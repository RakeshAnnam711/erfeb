'use strict';

var pricingHelper = require('*/cartridge/scripts/helpers/pricing');
var DefaultPrice = require('*/cartridge/models/price/default');
var RangePrice = require('*/cartridge/models/price/range');

module.exports = function (object, searchHit, activePromotions, getSearchHit, customerPromotions) {
    Object.defineProperty(object, 'price', {
        enumerable: true,
        value: (function () {
            var minVariantSalePrice;
            var maxVariantSalePrice;

            // Go through variations and set sale price accordingly
            searchHit.representedProducts.toArray().forEach((product) => {
                if (minVariantSalePrice == null || product.priceModel.minPrice < minVariantSalePrice) {
                    minVariantSalePrice = product.priceModel.minPrice;
                }
                if (maxVariantSalePrice == null || product.priceModel.maxPrice > maxVariantSalePrice) {
                    maxVariantSalePrice = product.priceModel.maxPrice;
                }
            });

            var salePrice = { minPrice: minVariantSalePrice, maxPrice: maxVariantSalePrice };

            // If searchHit is a bundle the variant prices don't affect the display price
            if (searchHit.hitType === 'bundle') {
                salePrice = { minPrice: searchHit.minPrice, maxPrice: searchHit.maxPrice };
            }

            var promotions = pricingHelper.getPromotions(searchHit, activePromotions);
            var promotionalPrice;
            if (promotions.getLength() > 0) {
                promotionalPrice = pricingHelper.getPromotionPrice(searchHit.firstRepresentedProduct, promotions);
                if (promotionalPrice && promotionalPrice.available) {
                    salePrice = { minPrice: promotionalPrice, maxPrice: promotionalPrice };
                }
            }

            //RVW CHANGE: loop thru the products and see if any promotions apply to variants
            if (!promotionalPrice && customerPromotions.length) {
                var allPromotionsPrices = [];
                if (searchHit.hitType === 'bundle') {
                    promotionalPrice = pricingHelper.getPromotionPrice(searchHit.product, customerPromotions);
                    if (promotionalPrice && promotionalPrice.available) {
                        salePrice.minPrice = promotionalPrice < salePrice.minPrice ? promotionalPrice : salePrice.minPrice;
                        salePrice.maxPrice = promotionalPrice < salePrice.maxPrice ? promotionalPrice : salePrice.maxPrice;
                        allPromotionsPrices.push(promotionalPrice.value);
                    }
                } else {
                    searchHit.representedProducts.toArray().forEach((product) => {
                        promotionalPrice = pricingHelper.getPromotionPrice(product, customerPromotions);
                        if (promotionalPrice && promotionalPrice.available) {
                            salePrice.minPrice = promotionalPrice < salePrice.minPrice ? promotionalPrice : salePrice.minPrice;
                            allPromotionsPrices.push(promotionalPrice.value);
                        }
                    });
                }
                //if all variants are discounted, don't display a range, just sales price
                if (allPromotionsPrices.length && allPromotionsPrices.length == searchHit.representedProducts.length) {
                    salePrice.maxPrice = !allPromotionsPrices.includes(salePrice.maxPrice.value) ? salePrice.minPrice : salePrice.maxPrice;
                }
            }

            var listPrice = pricingHelper.getListPrices(searchHit, getSearchHit);

            if (salePrice.minPrice.value !== salePrice.maxPrice.value) {
                // range price
                return new RangePrice(salePrice.minPrice, salePrice.maxPrice);
            }

            if (listPrice.minPrice && listPrice.minPrice.valueOrNull !== null) {
                if (listPrice.minPrice.value !== salePrice.minPrice.value) {
                    return new DefaultPrice(salePrice.minPrice, listPrice.minPrice);
                }
            }
            return new DefaultPrice(salePrice.minPrice);
        }())
    });
};
