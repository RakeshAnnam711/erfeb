'use strict';

var base = module.superModule;

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
    productId = productId + '';
    var productMgr = require('dw/catalog/ProductMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var resource = require('dw/web/Resource');

    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = productMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        message: resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var totalQtyRequested = 0;
    var canBeAdded = false;

    productInCart = base.getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);

    if (productInCart) {
        productQuantityInCart = productInCart.quantity.value;
        var preferences = require('*/cartridge/config/preferences');
        var DEFAULT_MAX_ORDER_QUANTITY = product.custom.quantityDropdownLimit ? product.custom.quantityDropdownLimit : preferences.maxOrderQty ? preferences.maxOrderQty : 10;

        if (productQuantityInCart >= DEFAULT_MAX_ORDER_QUANTITY) {
            return {
                error: true,
                message: resource.msg('error.alert.max.quantity.in.cart', 'product', null)
            };
        }
        if ((quantity + productQuantityInCart) > DEFAULT_MAX_ORDER_QUANTITY) {
            return {
                error: true,
                message: resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null)
            };
        }
    }

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        // ***** NOTE: The change below for setting "perpetual" was the original reason for overriding this function from base SFRA.
        // The line, as of v4.4.1, checked the inventoryRecord to see if the product availability is perpetual.
        // However, if the inventory list is set to default in-stock, and no inventory record has been created,
        // checking "product.availabilityModel.inventoryRecord.perpetual" throws an error because inventoryRecord is null.
        // The product.availabilityModel.availability will be 0 if the item has inventory and it's out of stock
        // and it will be 1 if the product is perpetual inventory OR it's a stocked product with 1 or more available.
        // Because of that, we can use it for setting the "perpetual" boolean.
        // ***** Update
        // I added a check for the inventoryRecord, preferring to use that setting if it's available. We found
        // some scenarios where a user could add more items to their cart than were available because perpetual was set to the wrong value.
        // Refer to QL-490
        // *****
        perpetual = product.availabilityModel.inventoryRecord !== null ?
            product.availabilityModel.inventoryRecord.perpetual :
            product.availabilityModel.availability === 0 ? false : true;

        canBeAdded = perpetual || totalQtyRequested <= product.availabilityModel.inventoryRecord.ATS.value;
    }

    if (!canBeAdded) {
        result.error = true;
        result.message = resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for',
            'product',
            null,
            product.availabilityModel.inventoryRecord.ATS.value,
            product.name
        );

        return result;
    }

    if (productInCart) {
        quantityToSet = quantity ? quantity + productQuantityInCart : productQuantityInCart + 1;
        // ***** NOTE: Also fixed setting "availableToSell" for the above described case from base SFRA and perpetual products *****
        availableToSell = productInCart.product.availabilityModel.availability;
        if (productInCart.product.availabilityModel.inventoryRecord !== null) {
            availableToSell = productInCart.product.availabilityModel.inventoryRecord.ATS.value;
        }

        if (availableToSell >= quantityToSet || perpetual) {
            productInCart.setQuantityValue(quantityToSet);
            result.uuid = productInCart.UUID;
        } else {
            result.error = true;
            result.message = availableToSell === productQuantityInCart
                ? resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                : resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
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

base.addProductToCart = addProductToCart;

module.exports = base;
