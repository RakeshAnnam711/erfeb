/* eslint-disable no-param-reassign */

'use strict';

/**
 * Get custom attribute value of SFCC object
 * @param {Object} sfccObject - SFCC object
 * @param {dw.object.ObjectAttributeDefinition} attrDef - Custom attribute definition
 * @param {null|undefined|number|string|boolean|Object|Array} defaultAttrVal - Custom attribute default value
 * @returns {null|undefined|number|string|boolean|Object|Array} result - Custom attribute value
 */
function getCustomAttributeValue(sfccObject, attrDef, defaultAttrVal) {
    var ObjectAttributeDefinition = require('dw/object/ObjectAttributeDefinition');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var result = defaultAttrVal;

    try {
        var attrID = attrDef.getID();
        switch (attrDef.valueTypeCode) {
            case ObjectAttributeDefinition.VALUE_TYPE_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_INT:
            case ObjectAttributeDefinition.VALUE_TYPE_NUMBER:
            case ObjectAttributeDefinition.VALUE_TYPE_BOOLEAN:
            case ObjectAttributeDefinition.VALUE_TYPE_DATE:
            case ObjectAttributeDefinition.VALUE_TYPE_DATETIME:
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_INT:
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_NUMBER:
                result = sfccObject.custom[attrID];
                break;
            case ObjectAttributeDefinition.VALUE_TYPE_TEXT:
                result = sfccObject.custom[attrID].toString();
                break;
            case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_INT:
                result = sfccObject.custom[attrID] ? sfccObject.custom[attrID].value : null;
                break;
            default:
                break;
        }
    } catch (e) {
        logger.error('GLOBALE_CUSTOM_ATTRIBUTE_HELPERS: getCustomAttributeValue: {0}', logger.message(e));
        result = defaultAttrVal;
    }

    return result;
}

/**
 * Get custom attributes values of SFCC object
 * @param {Object} sfccObject - SFCC object
 * @returns {Object} result - Custom attributes values
 */
function getCustomAttributesValues(sfccObject) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var result = {};

    try {
        var sfccObjectDef = sfccObject.describe();
        Object.keys(sfccObject.custom).forEach(function (attrID) {
            // define attribute definition
            var attrDef = sfccObjectDef.getCustomAttributeDefinition(attrID);
            if (attrDef === null) {
                return;
            }
            // define attribute value
            var attrVal = getCustomAttributeValue(sfccObject, attrDef, null);
            if (attrVal === null || attrVal === undefined) {
                return;
            }
            // set attribute value
            result[attrID] = attrVal;
        });
    } catch (e) {
        logger.error('GLOBALE_CUSTOM_ATTRIBUTE_HELPERS: getCustomAttributesValues: {0}', logger.message(e));
        result = {};
    }

    return result;
}

/**
 * Set custom attribute value of SFCC object
 * @param {dw.object.ObjectAttributeDefinition} attrDef - Custom attribute definition
 * @param {Object} sfccObject - SFCC object
 * @param {null|undefined|number|string|boolean|Object|Array} attrVal - Custom attribute value
 * @returns {void}
 */
function setCustomAttributeValue(attrDef, sfccObject, attrVal) {
    var ObjectAttributeDefinition = require('dw/object/ObjectAttributeDefinition');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    try {
        var attrID = attrDef.getID();
        switch (attrDef.valueTypeCode) {
            case ObjectAttributeDefinition.VALUE_TYPE_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_BOOLEAN:
            case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_TEXT:
                sfccObject.custom[attrID] = attrVal;
                break;
            case ObjectAttributeDefinition.VALUE_TYPE_INT:
            case ObjectAttributeDefinition.VALUE_TYPE_NUMBER:
            case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_INT:
                sfccObject.custom[attrID] = Number(attrVal);
                break;
            case ObjectAttributeDefinition.VALUE_TYPE_DATE:
            case ObjectAttributeDefinition.VALUE_TYPE_DATETIME:
                sfccObject.custom[attrID] = new Date(attrVal);
                break;
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_INT:
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_NUMBER:
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_STRING:
                sfccObject.custom[attrID] = Object.keys(attrVal).map(function (key) { return attrVal[key]; });
                break;
            default:
                break;
        }
    } catch (e) {
        logger.error('GLOBALE_CUSTOM_ATTRIBUTE_HELPERS: setCustomAttributeValue: {0}', logger.message(e));
    }
}

/**
 * Set custom attributes data of SFCC object
 * @param {Object} sfccObject - SFCC object
 * @param {Object} objectCustomAttributesData - SFCC object custom attributes data
 * @returns {void}
 */
function setCustomAttributesValues(sfccObject, objectCustomAttributesData) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    try {
        var sfccObjectDef = sfccObject.describe();
        Object.keys(objectCustomAttributesData).forEach(function (attrID) {
            if (attrID === null || attrID === undefined) {
                return;
            }

            // define attribute definition
            var attrDef = sfccObjectDef.getCustomAttributeDefinition(attrID);
            if (attrDef === null) {
                return;
            }

            // set attribute value
            setCustomAttributeValue(attrDef, sfccObject, objectCustomAttributesData[attrID]);
        });
    } catch (e) {
        logger.error('GLOBALE_CUSTOM_ATTRIBUTE_HELPERS: setCustomAttributesValues: {0}', logger.message(e));
    }
}

/**
 * Returns the custom attributes data of SFCC basket/productlineitems/priceadjusments
 * @param {dw.order.Basket} basket - SFCC basket
 * @returns {Object} - Custom attributes data
 */
function getCustomAttributesData(basket) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var logger = globaleHelpers.getLogger();

    var customAttributesData = {
        basket: {},
        productLineItems: [],
        priceAdjustments: []
    };

    try {
        // set basket custom data
        var basketCustomAttributesValues = getCustomAttributesValues(basket) || {};
        var basketExcludedCustomAttributes = globaleHelpers.customAttr && globaleHelpers.customAttr.basket
            ? Object.keys(globaleHelpers.customAttr.basket)
            : [];
        customAttributesData.basket = objectUtils.filterByKeysToExclude(basketCustomAttributesValues, basketExcludedCustomAttributes, {});

        // set pli custom data
        var pliExcludedCustomAttributes = globaleHelpers.customAttr && globaleHelpers.customAttr.productLineItem
            ? Object.keys(globaleHelpers.customAttr.productLineItem)
            : [];
        collections.forEach(basket.allProductLineItems, function (productLineItem) {
            var pliCustomAttributesValues = getCustomAttributesValues(productLineItem) || {};
            if (Object.keys(pliCustomAttributesValues).length === 0) {
                return;
            }

            var pliFilteredCustomAttributesValues = objectUtils.filterByKeysToExclude(pliCustomAttributesValues, pliExcludedCustomAttributes, {});
            if (Object.keys(pliFilteredCustomAttributesValues).length === 0) {
                return;
            }

            pliFilteredCustomAttributesValues.ProductCartItemId = productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemId];
            customAttributesData.productLineItems.push(pliFilteredCustomAttributesValues);
        });

        // set discounts custom data
        var pAdjExcludedCustomAttributes = globaleHelpers.customAttr && globaleHelpers.customAttr.priceAdjustment
            ? Object.keys(globaleHelpers.customAttr.priceAdjustment)
            : [];
        // basket/order level discounts
        collections.forEach(basket.priceAdjustments, function (priceAdjustment) {
            var pAdjCustomAttributesValues = getCustomAttributesValues(priceAdjustment) || {};
            if (Object.keys(pAdjCustomAttributesValues).length === 0) {
                return;
            }

            var pAdjFilteredCustomAttributesValues = objectUtils.filterByKeysToExclude(pAdjCustomAttributesValues, pAdjExcludedCustomAttributes, {});
            if (Object.keys(pAdjFilteredCustomAttributesValues).length === 0) {
                return;
            }

            if (priceAdjustment.promotion !== null) {
                pAdjFilteredCustomAttributesValues.DiscountCode = priceAdjustment.promotion.ID;
                if (priceAdjustment.basedOnCoupon && priceAdjustment.couponLineItem !== null) {
                    pAdjFilteredCustomAttributesValues.CouponCode = priceAdjustment.couponLineItem.couponCode;
                }
            }
            customAttributesData.priceAdjustments.push(pAdjFilteredCustomAttributesValues);
        });
        // product line item level discounts
        collections.forEach(basket.allProductLineItems, function (productLineItem) {
            collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
                var pAdjCustomAttributesValues = getCustomAttributesValues(priceAdjustment) || {};
                if (Object.keys(pAdjCustomAttributesValues).length === 0) {
                    return;
                }

                var pAdjFilteredCustomAttributesValues = objectUtils.filterByKeysToExclude(pAdjCustomAttributesValues, pAdjExcludedCustomAttributes, {});
                if (Object.keys(pAdjFilteredCustomAttributesValues).length === 0) {
                    return;
                }

                pAdjFilteredCustomAttributesValues.ProductCartItemId = productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemId];
                if (priceAdjustment.promotion !== null) {
                    pAdjFilteredCustomAttributesValues.DiscountCode = priceAdjustment.promotion.ID;
                    if (priceAdjustment.basedOnCoupon && priceAdjustment.couponLineItem !== null) {
                        pAdjFilteredCustomAttributesValues.CouponCode = priceAdjustment.couponLineItem.couponCode;
                    }
                }
                customAttributesData.priceAdjustments.push(pAdjFilteredCustomAttributesValues);
            });
        });
    } catch (e) {
        logger.error('GLOBALE_CUSTOM_ATTRIBUTE_HELPERS: getCustomAttributesData: {0}', logger.message(e));
        customAttributesData = {
            basket: {},
            productLineItems: [],
            priceAdjustments: []
        };
    }
    return customAttributesData;
}

/**
 * Set the custom attributes data into SFCC basket/productlineitems/priceadjusments
 * @param {dw.order.Order} order - SFCC Order
 * @param {Object} customAttributesData - Custom attributes data
 * @returns {void}
 */
function setCustomAttributesData(order, customAttributesData) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var logger = globaleHelpers.getLogger();

    try {
        var customAttributesDataJSON = customAttributesData !== undefined ? JSON.parse(customAttributesData) : null;
        if (!customAttributesDataJSON) {
            return;
        }

        // set basket custom data
        if (
            ('basket' in customAttributesDataJSON) &&
            customAttributesDataJSON.basket &&
            Object.keys(customAttributesDataJSON.basket).length > 0
        ) {
            Transaction.wrap(function () {
                setCustomAttributesValues(order, customAttributesDataJSON.basket);
            });
        }

        // set pli custom data
        if (
            ('productLineItems' in customAttributesDataJSON) &&
            customAttributesDataJSON.productLineItems &&
            customAttributesDataJSON.productLineItems.length > 0
        ) {
            collections.forEach(order.allProductLineItems, function (productLineItem) {
                var pliCustomData = arrayUtils.find(customAttributesDataJSON.productLineItems, function (pCustomData) {
                    return pCustomData && pCustomData.ProductCartItemId === productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemId];
                });
                if (!pliCustomData) {
                    return;
                }
                Transaction.wrap(function () {
                    setCustomAttributesValues(productLineItem, pliCustomData);
                });
            });
        }

        // set discounts custom data
        if (
            ('priceAdjustments' in customAttributesDataJSON) &&
            customAttributesDataJSON.priceAdjustments &&
            customAttributesDataJSON.priceAdjustments.length > 0
        ) {
            customAttributesDataJSON.priceAdjustments.forEach(function (geDiscount) {
                var priceAdjustment = null;
                var lineItemCntr = null;

                if (geDiscount.ProductCartItemId) { // product level
                    var productLineItem = collections.find(order.allProductLineItems, function (pli) {
                        return pli.custom[globaleHelpers.customAttr.productLineItem.geCartItemId] === geDiscount.ProductCartItemId;
                    });
                    if (!productLineItem) {
                        return;
                    }
                    lineItemCntr = productLineItem;
                    priceAdjustment = productLineItem.getPriceAdjustmentByPromotionID(geDiscount.DiscountCode);
                    if (productLineItem.isBonusProductLineItem() && !priceAdjustment && productLineItem.priceAdjustments.length > 0) {
                        priceAdjustment = productLineItem.priceAdjustments[0];
                    }
                } else { // order level
                    lineItemCntr = order;
                    priceAdjustment = order.getPriceAdjustmentByPromotionID(geDiscount.DiscountCode);
                    if (!priceAdjustment && geDiscount.CouponCode) {
                        var cli = order.getCouponLineItem(geDiscount.CouponCode);
                        if (cli) {
                            priceAdjustment = cli.priceAdjustments.length ? cli.priceAdjustments[0] : null;
                        }
                    }
                }
                if (!priceAdjustment) {
                    priceAdjustment = lineItemCntr.getPriceAdjustmentByPromotionID('GlobalE-custom-' + geDiscount.DiscountCode);
                }
                if (!priceAdjustment) {
                    return;
                }
                Transaction.wrap(function () {
                    setCustomAttributesValues(priceAdjustment, geDiscount);
                });
            });
        }
    } catch (e) {
        // handle error
        logger.error('GLOBALE_CUSTOM_ATTRIBUTE_HELPERS: setCustomAttributesData : {0}', logger.message(e));
    }
}

module.exports = {
    getCustomAttributeValue: getCustomAttributeValue,
    getCustomAttributesValues: getCustomAttributesValues,
    setCustomAttributeValue: setCustomAttributeValue,
    setCustomAttributesValues: setCustomAttributesValues,
    getCustomAttributesData: getCustomAttributesData,
    setCustomAttributesData: setCustomAttributesData
};
