'use strict';

var base = module.superModule;
var originalGetNewBonusDiscountLineItem = base.getNewBonusDiscountLineItem;
var originalCheckBundledProductCanBeAdded = base.checkBundledProductCanBeAdded;
var originalAddProductToCart = base.addProductToCart;

/**
 * Gets the newly added bonus discount line item
 * @param {dw.order.Basket} currentBasket -
 * @param {dw.util.Collection} previousBonusDiscountLineItems - contains BonusDiscountLineItems
 *                                                              already processed
 * @param {Object} urlObject - Object with data to be used in the choice of bonus products modal
 * @param {string} pliUUID - the uuid of the qualifying product line item.
 * @return {Object} - either the object that represents data needed for the choice of
 *                    bonus products modal window or undefined
 */
function getNewBonusDiscountLineItem(currentBasket, previousBonusDiscountLineItems, urlObject, pliUUID) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry')) {
        return originalGetNewBonusDiscountLineItem(currentBasket, previousBonusDiscountLineItems, urlObject, pliUUID);
    }
    var Transaction = require('dw/system/Transaction');
    var collections = require('*/cartridge/scripts/util/collections');
    var globalePromotion = require('*/cartridge/scripts/factories/globale/promotion');
    collections.forEach(currentBasket.getBonusDiscountLineItems(), function (item) {
        if (item.promotion) {
            var promotion = globalePromotion(item.promotion);
            if (!promotion.isGlobalePromotion()) {
                Transaction.wrap(function () {
                    currentBasket.removeBonusDiscountLineItem(item);
                });
            }
        }
    });

    return originalGetNewBonusDiscountLineItem(currentBasket, previousBonusDiscountLineItems, urlObject, pliUUID);
}

/**
 * Check if the bundled product can be added to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {number} quantity - the number of products to the cart
 * @return {boolean} - return true if the bundled product can be added
 */
function checkBundledProductCanBeAdded(childProducts, productLineItems, quantity) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry')) {
        return originalCheckBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    }

    var ProductMgr = require('dw/catalog/ProductMgr');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var atsValueByChildPid = {};
    var totalQtyRequested = 0;
    var canBeAdded = false;

    childProducts.forEach(function (childProduct) {
        var apiChildProduct = ProductMgr.getProduct(childProduct.pid);
        atsValueByChildPid[childProduct.pid] = apiChildProduct.getAvailabilityModel().inventoryRecord.ATS.value;
        var geProduct = geProductMgr.get(apiChildProduct);

        // check is product availability related to custom inventory list
        if (geProduct.geGetCustomProductInventoryListId() !== null) {
            var productInventoryList = ProductInventoryMgr.getInventoryList(geProduct.geGetCustomProductInventoryListId());
            if (productInventoryList === null || productInventoryList.getRecord(childProduct.pid) === null) {
                atsValueByChildPid[childProduct.pid] = 0;
            } else {
                atsValueByChildPid[childProduct.pid] = apiChildProduct.getAvailabilityModel(productInventoryList).inventoryRecord.ATS.value;
            }
        }
    });

    canBeAdded = childProducts.every(function (childProduct) {
        var bundleQuantity = quantity;
        var itemQuantity = bundleQuantity * childProduct.quantity;
        var childPid = childProduct.pid;
        totalQtyRequested = itemQuantity + base.getQtyAlreadyInCart(childPid, productLineItems);
        return totalQtyRequested <= atsValueByChildPid[childPid];
    });

    return canBeAdded;
}

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 *  @return {Object} returns an error object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry')) {
        return originalAddProductToCart(currentBasket, productId, quantity, childProducts, options);
    }

    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(productId);
    var Resource = require('dw/web/Resource');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    var geProduct = geProductMgr.get(product);
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var productInCart;
    var productInCartAvailabilityModel;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var totalQtyRequested = 0;
    var canBeAdded = false;
    var availabilityModel = product.availabilityModel;

    // check is product availability related to custom inventory list
    if (geProduct.geGetCustomProductInventoryListId() !== null) {
        var productInventoryList = ProductInventoryMgr.getInventoryList(geProduct.geGetCustomProductInventoryListId());
        if (productInventoryList === null || productInventoryList.getRecord(productId) === null) {
            result.error = true;
            result.message = Resource.msgf(
                'error.alert.selected.quantity.cannot.be.added.for',
                'product',
                null,
                0,
                product.name
            );
            return result;
        }
        availabilityModel = product.getAvailabilityModel(productInventoryList);
    }

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = availabilityModel.inventoryRecord.perpetual;
        canBeAdded =
            (perpetual
            || totalQtyRequested <= availabilityModel.inventoryRecord.ATS.value);
    }

    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for',
            'product',
            null,
            availabilityModel.inventoryRecord.ATS.value,
            product.name
        );
        return result;
    }

    productInCart = base.getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);

    if (productInCart) {
        productInCartAvailabilityModel = productInCart.product.availabilityModel;
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = quantity ? quantity + productQuantityInCart : productQuantityInCart + 1;
        availableToSell = productInCartAvailabilityModel.inventoryRecord.ATS.value;

        if (availableToSell >= quantityToSet || perpetual) {
            productInCart.setQuantityValue(quantityToSet);
            result.uuid = productInCart.UUID;
        } else {
            result.error = true;
            result.message = availableToSell === productQuantityInCart
                ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
        }
    } else {
        var productLineItem;
        productLineItem = base.addLineItem(
            currentBasket,
            product,
            quantity,
            childProducts,
            optionModel,
            defaultShipment
        );

        result.uuid = productLineItem.UUID;
    }

    return result;
}

module.exports = base;
module.exports.getNewBonusDiscountLineItem = getNewBonusDiscountLineItem;
module.exports.checkBundledProductCanBeAdded = checkBundledProductCanBeAdded;
module.exports.addProductToCart = addProductToCart;
