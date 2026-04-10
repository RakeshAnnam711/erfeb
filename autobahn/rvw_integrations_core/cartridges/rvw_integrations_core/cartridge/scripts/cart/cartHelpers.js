'use strict';

var base = module.superModule;

var Transaction = require('dw/system/Transaction');
var ProductMgr = require('dw/catalog/ProductMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

var collections = require('*/cartridge/scripts/util/collections');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

var DEFAULT_LINE_ITEM_QUANTITY = 1;

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {Object} params - Additional Integration params
 * @param {String} params.storeId - (BOPIS) the storeID where the item will be shipped to
 * @param {Object} params.req - (BOPIS) the request object
 * @return {Object} returns an error object
 */
function addProductToCart (currentBasket, productId, quantity, childProducts, options, params) {
    productId = productId + '';
    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var bopisEnabled = Site.current.getCustomPreferenceValue('bopisCartridgeEnabled') || false;

    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    // base.DEFAULT_LINE_ITEM_QUANTITY isn't defined anymore
    var lineItemQuantity = isNaN(quantity) ? DEFAULT_LINE_ITEM_QUANTITY : quantity;
    var totalQtyRequested = 0;
    var canBeAdded = false;

    // Adjustment for thirdaparty add to cart events
    params = params || {};

    if (bopisEnabled) {
        // Get the existing product line item from the basket if the new product item
        // has the same bundled items or options and the same instore pickup store selection
        // this function gets added by the cartHelpers in the bopis cartridge
        productInCart = base.getExistingProductLineItemInCartWithTheSameStore(product, productId, productLineItems, childProducts, options, params.storeId); // bopis specific
    } else {
        productInCart = base.getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);
    }

    if (productInCart) {
        productQuantityInCart = productInCart.quantity.value;
        var preferences = require('*/cartridge/config/preferences');
        var DEFAULT_MAX_ORDER_QUANTITY = product.custom.quantityDropdownLimit ? product.custom.quantityDropdownLimit : preferences.maxOrderQty ? preferences.maxOrderQty : 10;

        if (productQuantityInCart >= DEFAULT_MAX_ORDER_QUANTITY) {
            return {
                error: true,
                message: Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
            };
        }
        if ((quantity + productQuantityInCart) > DEFAULT_MAX_ORDER_QUANTITY) {
            return {
                error: true,
                message: Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null)
            };
        }
    }

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, lineItemQuantity);
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
        result.message = Resource.msgf('error.alert.selected.quantity.cannot.be.added.for', 'product', null, product.availabilityModel.inventoryRecord.ATS.value, product.name);
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
            result.message = availableToSell === productQuantityInCart ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null) : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
        }
    } else {
        var shipment = defaultShipment;
        if (bopisEnabled) {
            // Create a new instore pickup shipment as default shipment for product line item
            // if the shipment if not exist in the basket
            var inStoreShipment = base.createInStorePickupShipmentForLineItem(currentBasket, params.storeId, params.req);
            shipment = inStoreShipment || defaultShipment;

            if (shipment.shippingMethod && shipment.shippingMethod.custom.storePickupEnabled && !params.storeId) {
                shipment = currentBasket.createShipment(UUIDUtils.createUUID());
            }
        }

        var productLineItem = base.addLineItem(
            currentBasket,
            product,
            lineItemQuantity,
            childProducts,
            optionModel,
            shipment
        );
        if (bopisEnabled) {
            var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
            // Once the new product line item is added, set the instore pickup fromStoreId for the item
            var availableForInStorePickup = preferenceHelper.getProductAttributeValue('availableForInStorePickup', productLineItem.getProduct(), 'availableForInStorePickup', null);
            if (availableForInStorePickup) {
                if (params.storeId) {
                    instorePickupStoreHelper.setStoreInProductLineItem(params.storeId, productLineItem);
                }
            }
        }

        result.uuid = productLineItem.UUID;
    }

    // BOPIS multi-ship cleanup
    if (bopisEnabled) {
        Transaction.wrap(function () {
            COHelpers.ensureNoEmptyShipments(params.req);
        });
    }

    return result;
}

/**
 * Prepares and wraps the `addProductToCart` function in a transaction.
 * Updates the currentBasket
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {Object} req - (BOPIS) the request object
 * @return {Object} returns an error object
 */
function addProductToCartTransaction (currentBasket, req) {
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var productId = req.form.pid;
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts')
        ? JSON.parse(req.form.childProducts)
        : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var storeId = req.form.storeId ? req.form.storeId : null;

    var quantity;
    var pidsObj;
    var params = {
        storeId : storeId,
        req : req
    };

    if (currentBasket) {
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(req.form.quantity, 10);
                result = module.exports.addProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    childProducts,
                    options,
                    params
                );
            } else {
                // product set
                pidsObj = JSON.parse(req.form.pidsObj);
                pidsObj.forEach(function (PIDObj) {
                    quantity = parseInt(PIDObj.qty, 10);
                    var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                    var PIDObjResult = module.exports.addProductToCart(
                        currentBasket,
                        PIDObj.pid,
                        quantity,
                        childProducts,
                        pidOptions,
                        params
                    );
                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                });
            }
            if (!result.error) {
                base.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }

    return result;
}

/**
 * Prepares and wraps the Bonus Discount Line Items in a transaction.
 * Updates the currentBasket
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {Object} result - result object from `addProductToCart` function
 * @param {dw.util.Collection} result - result object from `addProductToCart` function
 * @return {Object} returns an newBonusDiscountLineItem object if there are bonus items
 */
function newBonusDiscountLineItem (currentBasket, result, previousBonusDiscountLineItems) {
    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };
    var newBonusDiscountLineItem =
        base.getNewBonusDiscountLineItem(
            currentBasket,
            previousBonusDiscountLineItems,
            urlObject,
            result.uuid
        );

    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line // no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }

    return newBonusDiscountLineItem;
}

/**
 * Prepares and wraps the Product Line Items in a transaction.
 * Updates the currentBasket
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {Object} req - req object
 * @return {Object} returns an responseObject object error or cartModel
 */
function editProductLineItemHelper (currentBasket, req) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var Logger = require('dw/system/Logger');

    var responseObject = {};

    var uuid = req.form.uuid;
    var productId = req.form.pid;
    var updateQuantity = parseInt(req.form.quantity, 10);
    var storeId = req.form.storeId ? req.form.storeId : null;
    var selectedOptionValueIds = req.form.selectedOptionValueIds ? JSON.parse(req.form.selectedOptionValueIds) : [];

    var productLineItems = currentBasket.allProductLineItems;
    var requestLineItem = collections.find(productLineItems, function (item) {
        return item.UUID === uuid;
    });

    var uuidToBeDeleted = null;
    var pliToBeDeleted;

    var newPidAlreadyExist = collections.find(productLineItems, function (item) {
        var itemHasSameStoreId = 'fromStoreId' in item.custom ? item.custom.fromStoreId === storeId : false;
        if (item.productID === productId && item.UUID !== uuid && itemHasSameStoreId) {
            uuidToBeDeleted = item.UUID;
            pliToBeDeleted = item;
            updateQuantity += parseInt(item.quantity, 10);
            return true;
        }
        return false;
    });

    var availableToSell = 0;
    var totalQtyRequested = 0;
    var qtyAlreadyInCart = 0;
    var minOrderQuantity = 0;

    var canBeUpdated = false;
    var perpetual = false;
    var error = false;

    var bundleItems;

    if (requestLineItem) {
        if (requestLineItem.product.bundle) {
            bundleItems = requestLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                var quantityToUpdate = updateQuantity *
                    requestLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = base.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell || perpetual) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            availableToSell = requestLineItem.product.availabilityModel.inventoryRecord.ATS.value;
            perpetual = requestLineItem.product.availabilityModel.inventoryRecord.perpetual;
            qtyAlreadyInCart = base.getQtyAlreadyInCart(
                productId,
                productLineItems,
                requestLineItem.UUID
            );
            totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            minOrderQuantity = requestLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell || perpetual) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    if (canBeUpdated) {
        var product = ProductMgr.getProduct(productId);
        try {
            Transaction.wrap(function () {
                if (newPidAlreadyExist) {
                    var shipmentToRemove = pliToBeDeleted.shipment;
                    currentBasket.removeProductLineItem(pliToBeDeleted);
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                }

                if (!requestLineItem.product.bundle) {
                    requestLineItem.replaceProduct(product);
                }

                // If the product has options
                var optionModel = product.getOptionModel();
                if (optionModel && optionModel.options && optionModel.options.length) {
                    // AUTOBAHN MOD support multiple options
                    var productOptions = optionModel.options.iterator();
                    while (productOptions.hasNext()) {
                        var productOption = productOptions.next();
                        for (var i in selectedOptionValueIds) {
                            if (productOption.ID === selectedOptionValueIds[i].optionId) {
                                var productOptionValue = optionModel.getOptionValue(productOption, selectedOptionValueIds[i].selectedValueId);
                                var optionProductLineItems = requestLineItem.getOptionProductLineItems().iterator();
                                while (optionProductLineItems.hasNext()) {
                                    var optionProductLineItem = optionProductLineItems.next();
                                    if (productOption.ID === optionProductLineItem.optionID) {
                                        optionProductLineItem.updateOptionValue(productOptionValue);
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                }

                // If a store ID is provided, update the shipment line item
                if (storeId) {
                    var inStoreShipment = base.createInStorePickupShipmentForLineItem(currentBasket, storeId, req);
                    requestLineItem.setShipment(inStoreShipment);
                    requestLineItem.custom.fromStoreId = storeId;
                } else {
                    // if no store ID was provided, check for the requested UUID in the shipments and remove the store if found
                    var shipments = currentBasket.getShipments();
                    collections.forEach(shipments, function(shipment) {
                        var requestLineItemInShipment = collections.find(shipment.productLineItems, function (item) {
                            return item.UUID === uuid;
                        });

                        if (requestLineItemInShipment) {
                            if (shipment.custom && shipment.custom.fromStoreId && shipment.custom.shipmentType) {
                                delete shipment.custom.fromStoreId;
                                delete shipment.custom.shipmentType;
                                shipment.setShippingMethod(ShippingMgr.getDefaultShippingMethod());
                                shipment.createShippingAddress();
                            }
                            collections.forEach(shipment.productLineItems, function(lineItem) {
                                if (lineItem.custom && lineItem.custom.fromStoreId) {
                                    delete lineItem.custom.fromStoreId;
                                }
                            });
                        }
                    });
                }

                requestLineItem.setQuantityValue(updateQuantity);
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        } catch (e) {
            error = true;
            Logger.error("Error Processed while updating cart: ", e);
        }
    }

    if (!error && requestLineItem && canBeUpdated) {
        var CartModel = require('*/cartridge/models/cart');

        responseObject = {
            error: error,
            cartModel: new CartModel(currentBasket),
            newProductId: productId,
            uuid: uuid
        };

        if (uuidToBeDeleted) {
            responseObject.uuidToBeDeleted = uuidToBeDeleted;
        }
    } else {
        responseObject = { error: true };
    }

    return responseObject;
}

base.addProductToCart = addProductToCart;
base.addProductToCartTransaction = addProductToCartTransaction;
base.newBonusDiscountLineItem = newBonusDiscountLineItem;
base.editProductLineItemHelper = editProductLineItemHelper;

module.exports = base;
