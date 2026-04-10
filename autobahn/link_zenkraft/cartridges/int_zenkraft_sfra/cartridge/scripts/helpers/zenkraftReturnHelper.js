'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');
var Zenkraft = require('~/cartridge/scripts/zenkraft');
var ProductMgr = require('dw/catalog/ProductMgr');
var ZenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper')

function getOrder(order) {
    var thisOrder;
    if (typeof order === 'string') {
        thisOrder = OrderMgr.getOrder(order);
    } else {
        thisOrder = order;
    }
    return thisOrder;
}

function checkOrderReturnApproval(order) {
    var thisOrder = getOrder(order);
    var customerGroups = thisOrder.getCustomer().getCustomerGroups().toArray();
    var productLineItems = thisOrder.getProductLineItems().toArray();
    var isReturnApprovalRequired = Site.getCurrent().getCustomPreferenceValue('enableZenkraftReturnsApproval');
    var zenkraftReturnApprovalCatalogCategories = Site.getCurrent().getCustomPreferenceValue('zenkraftReturnApprovalCatalogCategories');
    var zenkraftReturnApprovalCustomerGroups = Site.getCurrent().getCustomPreferenceValue('zenkraftReturnApprovalCustomerGroups');
    if (isReturnApprovalRequired) {
        return isReturnApprovalRequired;
    }
    if (customerGroups.length > 0 && !empty(zenkraftReturnApprovalCustomerGroups)) {
        zenkraftReturnApprovalCustomerGroups = zenkraftReturnApprovalCustomerGroups.split(',');
        customerGroups.forEach(function (customerGroup) {
            var customerGroupID = customerGroup.getID();
            zenkraftReturnApprovalCustomerGroups.forEach(function (preferenceCustomerGroup) {
                if (customerGroupID.toLowerCase() === preferenceCustomerGroup.toLowerCase()) {
                    isReturnApprovalRequired = true;
                }
            });
        });
    }
    if (productLineItems.length > 0 && !empty(zenkraftReturnApprovalCatalogCategories) && !isReturnApprovalRequired) {
        zenkraftReturnApprovalCatalogCategories = zenkraftReturnApprovalCatalogCategories.split(',');
        productLineItems.forEach(function (productLineItem) {
            var product = productLineItem.getProduct();
            if (product.isVariant()) {
                product = product.getMasterProduct();
            }
            var catalogCategories = product.getCategories().toArray();
            catalogCategories.forEach(function (catalogCategorie) {
                zenkraftReturnApprovalCatalogCategories.forEach(function (preferenceCatalogCategorie) {
                    if (catalogCategorie.getID().toLowerCase() === preferenceCatalogCategorie.toLowerCase()) {
                        isReturnApprovalRequired = true;
                    }
                });
            });
        });
    }
    return isReturnApprovalRequired;
}

function getReturnLineItemObject(returnLineItem) {
    var thisReturnLineItem;
    if (typeof returnCase === 'string') {
        thisReturnLineItem = OrderMgr.getCustomObject('zenkraftReturnLineItem', returnLineItem);
    } else {
        thisReturnLineItem = returnLineItem;
    }
    return thisReturnLineItem;
}

function extractObject(object) {
    var returnObject = {};
    returnObject.UUID = object.UUID;
    returnObject.creationDate = object.creationDate ? object.creationDate : '';
    returnObject.lastModified = object.lastModified ? object.lastModified : '';
    var returnCaseKeys = Object.keys(object.custom);
    returnCaseKeys.forEach(function (key) {
        returnObject[key] = object.custom[key];
    });
    delete returnObject.class;
    delete returnObject.constructor;
    return returnObject;
}

function getReturnObject(returnCase) {
    var thisReturnCase;
    if (typeof returnCase === 'string') {
        thisReturnCase = CustomObjectMgr.getCustomObject('zenkraftReturn', returnCase);
    } else {
        thisReturnCase = returnCase;
    }
    return thisReturnCase;
}

function getReturnProduct(product) {
    var thisProduct;
    var extractedProduct = {};
    if (typeof product === 'string') {
        thisProduct = ProductMgr.getProduct(product);
    } else {
        thisProduct = product;
    }
    var variationModel = thisProduct.getVariationModel();
    var productVariationAttributes = variationModel.getProductVariationAttributes().toArray();
    extractedProduct.selectedVariationAttributes = [];
    productVariationAttributes.forEach(function(productVariationAttribute) {
        var selectedValue = variationModel.getSelectedValue(productVariationAttribute);
        extractedProduct.selectedVariationAttributes.push({
            id: selectedValue.ID,
            value: selectedValue.displayValue,
            typeID: productVariationAttribute.ID,
            typeValue: productVariationAttribute.displayName,
        });
    });
    extractedProduct.title = thisProduct.getPageTitle();
    extractedProduct.description = thisProduct.getPageDescription();
    extractedProduct.imageURL = thisProduct.getImage('small',0).getURL().toString();
    return extractedProduct;
}

function getReturnLineItems(returnLineItemsString) {
    var returnLineItemsIds = returnLineItemsString.split(',');
    var returnLineItemsArray = [];
    returnLineItemsIds.forEach(function (returnLineItemId) {
        var returnLineItem = CustomObjectMgr.getCustomObject('zenkraftReturnLineItem', returnLineItemId);
        if (returnLineItem) {
            returnLineItemsArray.push(returnLineItem);
        }
    });
    returnLineItemsArray.sort(function(a, b) {
        return b.creationDate.getTime() - a.creationDate.getTime();
    });
    return returnLineItemsArray;
}

function getReturnCase(returnCase) {
    try {
    var thisReturnCase = getReturnObject(returnCase);
    var returnObject = extractObject(thisReturnCase);
    var totalItems = 0;
    var currentReturnlineItems = [];
    // eslint-disable-next-line no-undef
    if (!empty(returnObject) && returnObject.returnLineItems && returnObject.returnLineItems.length > 0) {
        var returnLineItems = getReturnLineItems(returnObject.returnLineItems);
        if(returnLineItems.length > 0) {
            for (var i = 0; i < returnLineItems.length; i++) {
                returnLineItems[i] = extractObject(returnLineItems[i]);
                returnLineItems[i].product = getReturnProduct(returnLineItems[i].productID);
                returnLineItems[i].quantity = parseInt(returnLineItems[i].quantity);
                totalItems += parseInt(returnLineItems[i].quantity);
                currentReturnlineItems.push(returnLineItems[i].id);
            }
            returnObject.returnLineItems = returnLineItems;
        }
    }

    if (currentReturnlineItems.length === 0) {
        deleteReturnCase(thisReturnCase);
    } else {
        Transaction.wrap(function() {
            thisReturnCase.custom.returnLineItems = currentReturnlineItems.toString();
        });
    }

    returnObject.totalItems = totalItems;
    return returnObject;
    } catch (e) {
        return e;
    }
}
function queryReturnCases(query) {
    var zenkraftReturns = CustomObjectMgr.queryCustomObjects('zenkraftReturn', query, null, null).asList().toArray();
    var returnObjects = [];
    zenkraftReturns.forEach(function (zenkraftReturn) {
        returnObjects.push(zenkraftReturn);
    });
    return returnObjects;
}

function checkForExistingReturnCase(order) {
    var thisOrder = getOrder(order);
    var query = 'custom.orderNumber =\'' + thisOrder.orderNo + '\'';
    var existingReturnCases = queryReturnCases(query);
    if (existingReturnCases.length > 0) {
        return existingReturnCases[0];
    }
    return false;
}

function updateReturnLineItem(returnLineItem, data) {
    var thisReturnLineItem = getReturnLineItemObject(returnLineItem);
    var dataKeys = Object.keys(data);
    try {
        dataKeys.forEach(function (key) {
            Transaction.wrap(function () {
                thisReturnLineItem.custom[key] = data[key];
            });
        });
    } catch (error) {
        return error;
    }
    return thisReturnLineItem;
}

function updateReturnCase(returnCase, data) {
    var thisReturnObject = getReturnObject(returnCase);
    var thisReturnCase;
    var returnLineItems = [];
    var dataKeys = Object.keys(data);
    if (data.returnLineItems && data.returnLineItems.length > 0) {
        data.returnLineItems.forEach(function (returnLineItem) {
            if (returnLineItem.id && returnLineItem.data) {
                var updatedReturnCase = updateReturnLineItem(returnLineItem.id, returnLineItem.data);
                returnLineItems.push(extractObject(updatedReturnCase));
            }
        });
    }
    try {
        dataKeys.forEach(function (key) {
            Transaction.wrap(function () {
                thisReturnCase.custom[key] = data[key];
            });
        });
    } catch (error) {
        return error;
    }
    thisReturnCase = extractObject(thisReturnObject);
    thisReturnCase.returnLineItems = returnLineItems;
    return thisReturnCase;
}

function deleteReturnLineItem(returnLineItem) {
    var thisRreturnLineItem = getReturnLineItemObject(returnLineItem);
    try {
        Transaction.wrap(function () {
            CustomObjectMgr.remove(thisRreturnLineItem);
        });
    } catch (error) {
        return error;
    }
    return true;
}

function deleteReturnCase(returnCase) {
    var thisReturnCase = getReturnObject(returnCase);
    try {
        if (thisReturnCase.custom && thisReturnCase.custom.returnLineItems && thisReturnCase.custom.returnLineItems.length > 0) {
            var returnLineItemsIds = getReturnLineItems(thisReturnCase.custom.returnLineItems);
            if (returnLineItemsIds.length > 0) {
                returnLineItemsIds.forEach(function (returnLineItemId) {
                    deleteReturnLineItem(returnLineItemId);
                });
            }
        }
        Transaction.wrap(function () {
            CustomObjectMgr.remove(thisReturnCase);
        });
    } catch (error) {
        return error;
    }
    return true;
}

function updateReturnCaselineItemIds(existingReturnCase, returnLineItemIds) {
    var thisReturnCase = existingReturnCase;
    Transaction.wrap(function () {
        if (existingReturnCase.custom.returnLineItems && existingReturnCase.custom.returnLineItems.length > 0) {
            thisReturnCase.custom.returnLineItems = thisReturnCase.custom.returnLineItems + ',' + returnLineItemIds.toString();
        } else {
            thisReturnCase.custom.returnLineItems = returnLineItemIds.toString();
        }
    });
}

function createReturnLineItemsForReturnCase(order, items, existingReturnCase, isReturnApprovalRequired) {
    var dateNow = new Date();
    var thisOrder = getOrder(order);
    var returnLineItemIds = [];
    var labels = [];
    var labelType;
    var returnLineItemNumber = existingReturnCase.custom.returnLineItems && existingReturnCase.custom.returnLineItems.length > 0 ? existingReturnCase.custom.returnLineItems.split(',') : [];
    if (returnLineItemNumber[0] && returnLineItemNumber[0].length > 0) {
        returnLineItemNumber = parseInt(returnLineItemNumber.length);
    } else {
        returnLineItemNumber = 0;
    }
    try {
        Transaction.wrap(function () {
            items.forEach(function (item) {
                returnLineItemNumber++;
                var returnLineItem = CustomObjectMgr.createCustomObject('zenkraftReturnLineItem', existingReturnCase.custom.id + '-' + returnLineItemNumber);
                returnLineItem.custom.productID = item.productID;
                returnLineItem.custom.returnID = existingReturnCase.custom.id;
                returnLineItem.custom.reasonCode = JSON.stringify(item.reason);
                returnLineItem.custom.subReasonCode = JSON.stringify(item.subReason);
                returnLineItem.custom.quantity = item.quantity;
                if (!isReturnApprovalRequired) {
                    var products = {};
                    products[item.productID] = item.quantity;
                    var thisLabel = Zenkraft.getShippingLabel(thisOrder, products);
                    returnLineItem.custom.label = thisLabel.shipment.packages[0].label;
                    returnLineItem.custom.labelType = thisLabel.shipment.packages[0].label_type;
                    returnLineItem.custom.carrier = thisLabel.shipment.carrier;
                    returnLineItem.custom.trackingNumber = thisLabel.shipment.packages[0].tracking_number;
                    labels.push(thisLabel.shipment.packages[0].label);
                    labelType = thisLabel.shipment.packages[0].label_type;
                }
                if (!isReturnApprovalRequired && (!returnLineItem.custom.approvedDate || empty(returnLineItem.custom.approvedDate))) {
                    returnLineItem.custom.approvedDate = dateNow;
                }
                returnLineItemIds.push(returnLineItem.custom.id);
            });
            if (!isReturnApprovalRequired) {
                Transaction.wrap(function () {
                    existingReturnCase.custom.allLabels = labels.join('').replace((/=/g), '') + '=';
                    existingReturnCase.custom.labelType = labelType;
                });
            }
        });
        updateReturnCaselineItemIds(existingReturnCase, returnLineItemIds);
    } catch (error) {
        return error;
    }
    return true;
}

function createUnapprovedReturnCase(order, items, returnID) {
    var thisOrder = getOrder(order);
    var zenkraftReturn;
    try {
        Transaction.wrap(function () {
            zenkraftReturn = CustomObjectMgr.createCustomObject('zenkraftReturn', returnID);
            zenkraftReturn.custom.orderNumber = thisOrder.orderNo;
        });
        createReturnLineItemsForReturnCase(thisOrder, items, zenkraftReturn, true);
    } catch (error) {
        return false;
    }
    return returnID;
}

function createApprovedReturnCase(order, items, returnID) {
    var thisOrder = getOrder(order);
    var zenkraftReturn;
    try {
        Transaction.wrap(function () {
            zenkraftReturn = CustomObjectMgr.createCustomObject('zenkraftReturn', returnID);
            zenkraftReturn.custom.orderNumber = thisOrder.orderNo;
        });
        createReturnLineItemsForReturnCase(thisOrder, items, zenkraftReturn, false);
    } catch (error) {
        return false;
    }
    return returnID;
}

function createNewReturnCase(order, items, isReturnApprovalRequired) {
    var thisOrder = getOrder(order);
    var date = new Date();
    var returnID = date.getTime().toString();
    if (isReturnApprovalRequired) {
        returnID = createUnapprovedReturnCase(thisOrder, items, returnID);
    } else {
        returnID = createApprovedReturnCase(thisOrder, items, returnID);
    }
    return returnID;
}

function createReturnCase(order, items) {
    var thisOrder = getOrder(order);
    var isReturnApprovalRequired = checkOrderReturnApproval(thisOrder);
    var returnID = false;
    var existingReturnCase = checkForExistingReturnCase(thisOrder);
    if (existingReturnCase) {
        var creation = createReturnLineItemsForReturnCase(thisOrder, items, existingReturnCase, isReturnApprovalRequired, false);
        if (creation) {
            returnID = existingReturnCase.custom.id;
        }
    } else {
        returnID = createNewReturnCase(thisOrder, items, isReturnApprovalRequired);
    }
    return returnID;
}

function getCustomerReturns(currentCustomer, localeID) {
    var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var ordersResult = OrderHelpers.getOrders(currentCustomer, {}, localeID);
    var customerOrders = ordersResult.orders;
    var returns = [];
    for (var i = 0; i < customerOrders.length; i++) {
        var orderNo = customerOrders[i].orderNumber;
        var orderReturns = queryReturnCases('custom.orderNumber =\'' + orderNo + '\'');
        if (orderReturns.length > 0) {
            returns = returns.concat(orderReturns);
        }
    }
    for (var i = 0; i < returns.length; i++) {
        returns[i] = getReturnCase(returns[i]);
    }
    if (returns.length > 0) {
        returns.sort(function(a, b) {
            return b.creationDate.getTime() - a.creationDate.getTime();
        });
        return returns;
    }
    return false;
}

function getProductReasons(orderModel) {
    var reasonsObject = JSON.parse(Site.getCurrent().getCustomPreferenceValue('returnReasonsConfig'));
    var reasons = reasonsObject.reasons;
    for (var i = 0; i < orderModel.shipping.length; i++) {
        for (var j = 0; j < orderModel.shipping[i].productLineItems.items.length; j++) {
            orderModel.shipping[i].productLineItems.items[j].returnReasons = [];
            var product = ProductMgr.getProduct(orderModel.shipping[i].productLineItems.items[j].id);
            var productCategories = product.getMasterProduct().getAllCategories().toArray();
            if (productCategories.length > 0) {
                productCategories.forEach(function(productCategorie) {
                    reasons.forEach(function(reason) {
                        if (reason.categories.indexOf(productCategorie.getID()) !== -1 && orderModel.shipping[i].productLineItems.items[j].returnReasons.indexOf(reason) === -1) {
                            orderModel.shipping[i].productLineItems.items[j].returnReasons.push(reason);
                        }
                    });
                });
            }
            if (orderModel.shipping[i].productLineItems.items[j].returnReasons.length === 0) {
                reasons.forEach(function(reason) {
                    if (reason.categories.indexOf('zk-default') !== -1) {
                        orderModel.shipping[i].productLineItems.items[j].returnReasons.push(reason);
                    }
                });
            }
        }
    }
    return orderModel;
}
function filterOrderItemsWithReturnLineItems (orderModel, returnCase) {
    for (var i = 0; i < orderModel.shipping.length; i++) {
        for (var j = 0; j < orderModel.shipping[i].productLineItems.items.length; j++) {
            for (var z = 0; z < returnCase.returnLineItems.length; z++) {
                if (orderModel.shipping[i].productLineItems.items[j].id === returnCase.returnLineItems[z].productID) {
                    if (orderModel.shipping[i].productLineItems.items[j].quantity > returnCase.returnLineItems[z].quantity) {
                        var newQuantity = orderModel.shipping[i].productLineItems.items[j].quantity - returnCase.returnLineItems[z].quantity;
                        orderModel.shipping[i].productLineItems.items[j].quantity = newQuantity;
                        orderModel.returnLineItems.push(returnCase.returnLineItems.splice(z, 1)[0]);
                        return filterOrderItemsWithReturnLineItems(orderModel, returnCase);
                    } else {
                        orderModel.shipping[i].productLineItems.items.splice(j, 1)
                        orderModel.returnLineItems.push(returnCase.returnLineItems.splice(z, 1)[0]);
                        return filterOrderItemsWithReturnLineItems(orderModel, returnCase);
                    }
                }
            }
        }
        if (empty(orderModel.shipping[i].productLineItems.items)) {
            orderModel.shipping.splice(i, 1);
        }
    }
    return orderModel;
}

function checkForNonReturnableProducts(orderModel) {
    var nonReturnableCategories = Site.getCurrent().getCustomPreferenceValue('catalogCategoriesForNonReturnableItems');
    if (nonReturnableCategories) {
        for (var i = 0; i < orderModel.shipping.length; i++) {
            for (var j = 0; j < orderModel.shipping[i].productLineItems.items.length; j++) {
                var product = ProductMgr.getProduct(orderModel.shipping[i].productLineItems.items[j].id);
                var productCategories = product.getMasterProduct().getAllCategories().toArray();
                productCategories.forEach(function (categoriy) {
                    if (nonReturnableCategories.indexOf(categoriy.ID) > -1) {
                        orderModel.shipping[i].productLineItems.items[j].notReturnable = true
                    }
                });
            }
        }
    }
    return orderModel;
}

function setOrderModelforReturns(orderModelString) {
    var oneToOneRelation = Site.getCurrent().getCustomPreferenceValue('setOrderReturnsOneToOneRelation');
    var orderModel = JSON.parse(orderModelString);
    var returnCase = checkForExistingReturnCase(orderModel.orderNumber);
    orderModel = checkForNonReturnableProducts(orderModel);
    if (!returnCase) {
        orderModel.returnLineItems = returnCase.returnLineItems;
        orderModel = getProductReasons(orderModel);
        return orderModel;
    }
    returnCase = getReturnCase(returnCase);
    if (oneToOneRelation && returnCase.returnLineItems) {
        orderModel.returnLineItems = [];
        orderModel = filterOrderItemsWithReturnLineItems(orderModel, returnCase);
    } else {
        orderModel.returnLineItems = returnCase.returnLineItems;
    }
    orderModel = getProductReasons(orderModel);
    return orderModel;
}

function checkOrderDaysAvailableForReturn(order) {
    var daysAvailable = Site.getCurrent().getCustomPreferenceValue('orderDaysAvailableForReturn');
    if (daysAvailable === 0) {
        return true;
    }
    var thisOrder = getOrder(order);
    var orderCreationDate = thisOrder.creationDate;
    var dateNow = new Date();
    if (orderCreationDate.getTime() + daysAvailable * 86400000 < dateNow.getTime()) {
        return false;
    }
    return true;
}

function handleExternalReturnCases(externalReturns) {
    var res = {
        updatedReturns: [],
        createdReturns: [],
        updatedReturnLineItems: [],
        createdReturnLineItems: []
    };
    externalReturns.forEach(function(object) {
        var existingObject = getReturnObject(object.id);
        if (existingObject) {
            var existingLineItems = existingObject.custom.returnLineItems && existingObject.custom.returnLineItems.length > 0 ? getReturnLineItems(existingObject.custom.returnLineItems) : [];
            var requestReturnLineItems = object.returnLineItems ? object.returnLineItems : [];
            delete object.returnLineItems;
            var requestReturnKeys = Object.keys(object);
            requestReturnKeys.forEach(function (key) {
                Transaction.wrap(function () {
                    existingObject.custom[key] = object[key];
                });
            });
            var unexsitingReturnLines = requestReturnLineItems.filter(function (returnLineItem) {
                if (existingObject.custom.returnLineItems && existingObject.custom.returnLineItems.indexOf(returnLineItem.id) > -1) {
                    return false;
                }
                return true;
            });
            if (requestReturnLineItems.length > 0) {
                existingLineItems.forEach(function (existingLineItemID) {
                    requestReturnLineItems.forEach(function (requestLineItem) {
                        if (requestLineItem.id === existingLineItemID) {
                            var existingLineItem = getReturnLineItemObject(existingLineItemID);
                            if (existingLineItem) {
                                var requestLineItemKeys = Object.keys(requestLineItem);
                                try {
                                    Transaction.wrap(function() {
                                        requestLineItemKeys.forEach(function(key) {
                                            if (key.toLowerCase().indexOf('date') > -1) {
                                                existingLineItem.custom[key] = ZenkraftHelper.convertTime(requestLineItem[key]);
                                            } else {
                                                existingLineItem.custom[key] = requestLineItem[key];
                                            }
                                        });
                                    });
                                    res.updatedReturnLineItems.push({
                                        return: existingObject.custom.id,
                                        lineItem: existingLineItem.custom.id
                                    });
                                } catch (e) {
                                    return {error: e};
                                }
                                res.updatedReturns.push(existingObject.custom.id);
                            } else {
                                unexsitingReturnLines.push(requestLineItem);
                            }
                        }
                    });
                });
                if (unexsitingReturnLines.length > 0) {
                    unexsitingReturnLines.forEach(function(unexsitingReturnLine) {
                        Transaction.wrap(function () {
                            var appendedReturnLine = CustomObjectMgr.createCustomObject('zenkraftReturnLineItem', unexsitingReturnLine.id);
                            var unexsitingReturnLineKeys = Object.keys(unexsitingReturnLine)
                            try {
                                unexsitingReturnLineKeys.forEach(function (key) {
                                    if (key.toLowerCase().indexOf('date') > -1) {
                                        appendedReturnLine.custom[key] = ZenkraftHelper.convertTime(unexsitingReturnLine[key]);
                                    } else {
                                        appendedReturnLine.custom[key] = unexsitingReturnLine[key];
                                    }
                                });
                                existingLineItems.push(unexsitingReturnLine.id);
                                res.createdReturnLineItems.push({
                                    return: existingObject.custom.id,
                                    lineItem: unexsitingReturnLine.id
                                });
                            } catch (e) {
                                return {error: e};
                            }
                        });
                    });
                }
                Transaction.wrap(function () {
                    existingObject.custom.returnLineItems = existingLineItems.toString();
                });
            }
        } else {
            try {
                var newReturnLines = object.returnLineItems;
                delete object.returnLineItems;
                Transaction.wrap(function() {
                    var newReturnCase = CustomObjectMgr.createCustomObject('zenkraftReturn', object.id);
                    var newReturnCaseKeys = Object.keys(object);
                    newReturnCaseKeys.forEach(function (key) {
                        newReturnCase.custom[key] = object[key];
                    });
                    res.createdReturns.push(newReturnCase.custom.id)
                    if (newReturnLines && newReturnLines.length > 0) {
                        var newLineItemIds = [];
                        newReturnLines.forEach(function(returnLineItem) {
                            var newLineItem = getReturnLineItemObject(returnLineItem.id);
                            var newLineItemKeys = Object.keys(returnLineItem);
                            newLineItemKeys.forEach(function (key) {
                                if (key.toLowerCase().indexOf('date') > -1) {
                                    newLineItem.custom[key] = ZenkraftHelper.convertTime(returnLineItem[key]);
                                } else {
                                    newLineItem.custom[key] = returnLineItem[key];
                                }
                            });
                            newLineItemIds.push(returnLineItem.id);
                            res.createdReturnLineItems.push({
                                return: object.id,
                                lineItem: returnLineItem.id
                            });
                        });
                        newReturnCase.custom.returnLineItems = newLineItemIds.toString();
                    }
                });
            } catch (e) {
                return {error: e};
            }
        }
    });
    return res;
}

function getCombineLabel(returnObject, items) {
    var date = new Date();
    var dateInMiliseconds = date.getTime();
    var fileType;
    var combinedLabel = [];
    returnObject.returnLineItems.forEach(function(returnLineItem) {
        items.forEach(function(item) {
            if (returnLineItem.productID === item.productID &&
                returnLineItem.quantity === parseInt(item.quantity) &&
                returnLineItem.reasonCode === JSON.stringify(item.reason) &&
                returnLineItem.subReasonCode === JSON.stringify(item.subReason) &&
                returnLineItem.creationDate.getTime() + 90000 > dateInMiliseconds
            ) {
                fileType = returnLineItem.labelType;
                combinedLabel.push(returnLineItem.label)
            }
        });
    });
    if (combinedLabel.length === 1) {
        returnObject.combinedLabel = combinedLabel[0];
        returnObject.labelType = fileType;
        return returnObject;
    }
    var serviceResponse = Zenkraft.configureZenkraftService('http.zenkraft.label', JSON.stringify({file_type: fileType, files: combinedLabel}));
    if (!empty(serviceResponse.object)) {
        if (empty(serviceResponse.object.error)) {
            returnObject.combinedLabel = serviceResponse.object.pdf;
            returnObject.labelType = 'pdf'
            return returnObject;
        }
    }
    returnObject.combinedLabel = combinedLabel[0];
    returnObject.labelType = fileType;
    return returnObject;
}

exports.getReturnCase = getReturnCase;
exports.updateReturnCase = updateReturnCase;
exports.createReturnCase = createReturnCase;
exports.deleteReturnCase = deleteReturnCase;
exports.queryReturnCases = queryReturnCases;
exports.checkOrderReturnApproval = checkOrderReturnApproval;
exports.getCustomerReturns = getCustomerReturns;
exports.setOrderModelforReturns = setOrderModelforReturns;
exports.checkOrderDaysAvailableForReturn = checkOrderDaysAvailableForReturn;
exports.handleExternalReturnCases = handleExternalReturnCases;
exports.getCombineLabel = getCombineLabel;
