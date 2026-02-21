'use strict';

var money = require('dw/value/Money');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');
var DefaultPrice = require('*/cartridge/models/price/default');
var RangePrice = require('*/cartridge/models/price/range');
var TieredPrice = require('*/cartridge/models/price/tiered');

/**
 * Get list price for a product
 *
 * @param {dw.catalog.ProductPriceModel} priceModel - Product price model
 * @return {dw.value.Money|Object} - List price
 */
function getListPrice(priceModel) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleOptionModel = require('*/cartridge/scripts/factories/globale/optionModel');
    var price = money.NOT_AVAILABLE;
    var priceBook;
    var priceBookPrice;
    var geOptionModel;
    var geOptionsTotalPrice;

    if (!priceModel.price.available && priceModel.minPrice) {
        return priceModel.minPrice;
    }

    if (priceModel.priceInfo && priceModel.priceInfo.priceBook) {
        priceBook = priceHelper.getRootPriceBook(priceModel.priceInfo.priceBook);
    }
    if (
        globaleSession.get('geOperatedCountry')
        && (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
    ) {
        // List Price
        priceBookPrice = priceModel.getFixedPriceBookPrice(true);
        if (!priceBookPrice.available && priceModel.price.available && priceModel.price.fixedPrice) {
            priceBookPrice = priceModel.price;
        }

        // product option
        if (priceModel.product.isOptionProduct() && priceBookPrice.available) {
            geOptionModel = globaleOptionModel(priceModel.currentOptionModel || priceModel.product.getOptionModel());
            geOptionsTotalPrice = geOptionModel.getSelectedOptionsTotalPrice(price.currencyCode);
            priceBookPrice = priceBookPrice.add(geOptionsTotalPrice);
        }

        if (priceBookPrice.available || globaleSession.get('geUseFixedPricesOnly')) {
            return priceBookPrice;
        }
    }

    if (priceBook) {
        priceBookPrice = priceModel.getPriceBookPrice(priceBook.ID);
        if (priceBookPrice.available) {
            return priceBookPrice;
        }
    }

    price = priceModel.price.available ? priceModel.price : priceModel.minPrice;

    return price;
}

/**
 * Retrieves Price instance
 *
 * @param {dw.catalog.Product|dw.catalog.productSearchHit} inputProduct - API object for a product
 * @param {string} currency - Current session currencyCode
 * @param {boolean} useSimplePrice - Flag as to whether a simple price should be used, used for
 *     product tiles and cart line items.
 * @param {dw.util.Collection<dw.campaign.Promotion>} promotions - Promotions that apply to this
 *                                                                 product
 * @param {dw.catalog.ProductOptionModel} currentOptionModel - The product's option model
 * @return {TieredPrice|RangePrice|DefaultPrice} - The product's price
 */
function getPrice(inputProduct, currency, useSimplePrice, promotions, currentOptionModel) {
    var globalePriceModel = require('*/cartridge/scripts/factories/globale/priceModel');
    var rangePrice;
    var salesPrice;
    var listPrice;
    var product = inputProduct;
    var promotionPrice = money.NOT_AVAILABLE;
    var priceModel = globalePriceModel(
        currentOptionModel
            ? product.getPriceModel(currentOptionModel)
            : product.getPriceModel(),
        product,
        currentOptionModel
    );
    var priceTable = priceModel.getPriceTable();

    // TIERED
    if (priceTable.quantities.length > 1) {
        return new TieredPrice(priceTable, useSimplePrice);
    }

    // RANGE
    if ((product.master || product.variationGroup) && priceModel.priceRange) {
        rangePrice = new RangePrice(priceModel.minPrice, priceModel.maxPrice);

        if (rangePrice && rangePrice.min.sales.value !== rangePrice.max.sales.value) {
            return rangePrice;
        }
    }

    // DEFAULT
    if ((product.master || product.variationGroup) && product.variationModel.variants.length > 0) {
        product = product.variationModel.variants[0];
        priceModel = globalePriceModel(product.priceModel, product);
    }

    promotionPrice = priceHelper.getPromotionPrice(product, promotions, currentOptionModel);
    listPrice = getListPrice(priceModel);
    salesPrice = priceModel.price;

    if (promotionPrice && promotionPrice.available && salesPrice.compareTo(promotionPrice)) {
        salesPrice = promotionPrice;
    }

    if (salesPrice && listPrice && salesPrice.value === listPrice.value) {
        listPrice = null;
    }

    if (salesPrice.valueOrNull === null && (listPrice && listPrice.valueOrNull !== null)) {
        salesPrice = listPrice;
        listPrice = {};
    }
    return new DefaultPrice(salesPrice, listPrice);
}

module.exports = {
    getPrice: getPrice
};
