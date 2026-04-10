'use strict';

/**
 * Global-e Product Factory for SFCC Products
 * @param {dw.order.ProductLineItem} productLineItem - SFCC Product Line Item
 * @returns {Object} - Global-e Product Object
 */
function globaleProduct(productLineItem) {
    var productDecorators = require('*/cartridge/models/globale/sendCart/product/decorators/index');
    var object = Object.create(null);
    productDecorators.base(object, productLineItem);
    try {
        productDecorators.locales(object);
        productDecorators.productAttribute(object);
        productDecorators.cartItemId(object);
        productDecorators.parentCartItemId(object);
        productDecorators.cartItemOptionId(object);
        productDecorators.productType(object);
        productDecorators.productCode(object);
        productDecorators.productName(object);
        productDecorators.productNameEnglish(object);
        productDecorators.productDescription(object);
        productDecorators.productDescriptionEnglish(object);
        productDecorators.productUrl(object);
        productDecorators.productImage(object);
        productDecorators.giftMessage(object);
        productDecorators.price(object);
        productDecorators.listPrice(object);
        productDecorators.originalListPrice(object);
        productDecorators.originalSalePrice(object);
        productDecorators.salePriceBeforeRounding(object);
        productDecorators.brand(object);
        productDecorators.categories(object);
        productDecorators.attributes(object);
        productDecorators.attributesEnglish(object);
        productDecorators.vatRateTypeLocal(object);
        productDecorators.vatRateTypeDst(object);
        productDecorators.metadata(object);
        productDecorators.virtual(object);
        productDecorators.giftCard(object);
        productDecorators.product(object);
        productDecorators.bundle(object);
        productDecorators.estimatedDeliveryDate(object);
        productDecorators.isBackOrdered(object);
        productDecorators.hubCode(object);
        productDecorators.localization(object);
    } catch (e) {
        throw new Error(object.logger.message(e));
    }
    return object;
}

/**
 * Global-e Product Factory for SFCC Product Options
 * @param {dw.order.ProductLineItem} productLineItem - SFCC Product Line Item
 * @returns {Object} - Global-e Product Object
 */
function globaleOptionProduct(productLineItem) {
    var productDecorators = require('*/cartridge/models/globale/sendCart/product/decorators/index');
    var optionDecorators = require('*/cartridge/models/globale/sendCart/option/decorators/index');
    var object = Object.create(null);
    optionDecorators.base(object, productLineItem);
    try {
        productDecorators.locales(object);
        productDecorators.productAttribute(object);
        productDecorators.cartItemId(object);
        optionDecorators.parentCartItemId(object);
        optionDecorators.cartItemOptionId(object);
        productDecorators.productType(object);
        productDecorators.productCode(object);
        optionDecorators.productName(object);
        productDecorators.productNameEnglish(object);
        optionDecorators.productDescription(object);
        productDecorators.productDescriptionEnglish(object);
        productDecorators.productUrl(object);
        optionDecorators.productImage(object);
        productDecorators.giftMessage(object);
        productDecorators.price(object);
        optionDecorators.listPrice(object);
        optionDecorators.originalListPrice(object);
        optionDecorators.originalSalePrice(object);
        optionDecorators.salePriceBeforeRounding(object);
        optionDecorators.brand(object);
        optionDecorators.categories(object);
        productDecorators.attributes(object);
        optionDecorators.attributesEnglish(object);
        productDecorators.vatRateTypeLocal(object);
        productDecorators.vatRateTypeDst(object);
        optionDecorators.metadata(object);
        optionDecorators.virtual(object);
        optionDecorators.giftCard(object);
        productDecorators.product(object);
        optionDecorators.bundle(object);
        productDecorators.estimatedDeliveryDate(object);
        productDecorators.isBackOrdered(object);
        productDecorators.hubCode(object);
        productDecorators.localization(object);
    } catch (e) {
        throw new Error(object.logger.message(e));
    }
    return object;
}

/**
 * Global-e Product Factory for SFCC Gift Certificates
 * @param {dw.order.ProductLineItem} giftCertificateLineItem - SFCC Gift Certificate Line Item
 * @returns {Object} - Global-e Product Object
 */
function globaleGiftCertificateProduct(giftCertificateLineItem) {
    var productDecorators = require('*/cartridge/models/globale/sendCart/product/decorators/index');
    var giftCertificateDecorators = require('*/cartridge/models/globale/sendCart/giftCertificate/decorators/index');
    var object = Object.create(null);
    giftCertificateDecorators.base(object, giftCertificateLineItem);
    try {
        productDecorators.locales(object);
        giftCertificateDecorators.productAttribute(object);
        giftCertificateDecorators.cartItemId(object);
        giftCertificateDecorators.parentCartItemId(object);
        giftCertificateDecorators.cartItemOptionId(object);
        giftCertificateDecorators.productType(object);
        giftCertificateDecorators.productCode(object);
        giftCertificateDecorators.productName(object);
        productDecorators.productNameEnglish(object);
        giftCertificateDecorators.productDescription(object);
        giftCertificateDecorators.productDescriptionEnglish(object);
        giftCertificateDecorators.productUrl(object);
        giftCertificateDecorators.productImage(object);
        giftCertificateDecorators.giftMessage(object);
        giftCertificateDecorators.price(object);
        giftCertificateDecorators.listPrice(object);
        giftCertificateDecorators.originalListPrice(object);
        giftCertificateDecorators.originalSalePrice(object);
        giftCertificateDecorators.salePriceBeforeRounding(object);
        giftCertificateDecorators.brand(object);
        giftCertificateDecorators.categories(object);
        giftCertificateDecorators.attributes(object);
        giftCertificateDecorators.attributesEnglish(object);
        giftCertificateDecorators.metadata(object);
        giftCertificateDecorators.virtual(object);
        giftCertificateDecorators.giftCard(object);
        giftCertificateDecorators.product(object);
        giftCertificateDecorators.bundle(object);
        giftCertificateDecorators.estimatedDeliveryDate(object);
        productDecorators.localization(object);
    } catch (e) {
        throw new Error(object.logger.message(e));
    }
    return object;
}

/**
 * Calculates and returns Global-e SendCart.Products API
 * @returns {array} - Global-e SendCart.Products API
 */
function getProducts() {
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var products = [];
    collections.forEach(this.basket.allProductLineItems, function (productLineItem) {
        var geProduct = productLineItem.isOptionProductLineItem() ? globaleOptionProduct(productLineItem) : globaleProduct(productLineItem);
        var productData = geProduct.getProduct();
        products.push(productData);
    });

    if (globaleHelpers.isNativeGiftCertificateEnabled() && this.basket.getGiftCertificateLineItems().length > 0) {
        collections.forEach(this.basket.giftCertificateLineItems, function (giftCertificateLineItem) {
            var geProduct = globaleGiftCertificateProduct(giftCertificateLineItem);
            var productData = geProduct.getProduct();
            products.push(productData);
        });
    }

    return products;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProducts', {
        value: getProducts
    });
};
