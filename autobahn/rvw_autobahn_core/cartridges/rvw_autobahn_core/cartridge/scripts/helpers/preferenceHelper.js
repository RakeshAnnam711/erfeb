'use strict';
/**
 * This script is used to get attributes from a system object that also have a default value set as a site preference
 * Ultimately it can be used for any System Object type however currently it's only dw.catalog.Product
 *
 * It can also be used for attributes that require additional modification / calculation
 */
/* API Includes */
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

/* Script Includes */

/* Attribute constants */

/* Private Methods */

/* Public Methods */
/**
 *
 * @param {String} sitePrefID The fall back site preference ID
 * @param {Object} systemObject The system object that has an attribute with a site preference fallback
 * @param {String} attributeID The custom attribute ID for the system object
 */
function getAttributeValue(sitePrefID, systemObject, attributeID, convertValueType) {
    var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
    var returnValue = abConfigs[sitePrefID];

    if(!empty(systemObject) && !empty(attributeID)) {
        var systemValue = systemObject.custom[attributeID];

        if(attributeID in systemObject.custom && !empty(systemValue)) {
            var currentType = typeof returnValue;
            var systemObjType = typeof systemObject.custom[attributeID];

            if (currentType !== systemObjType) {
                Logger.getLogger('Autobahn').warn('Site/Brand config pref-override type mismatch. AB Config/Site Pref [{0}] ({1} != {2})', sitePrefID, currentType, systemObjType);

                // TODO: Extend to additional type mismatches
                if (!!convertValueType) {
                    switch (currentType) {
                        case 'string':
                            systemValue = systemValue.toString();
                            break;
                        default:
                    }
                }
            }

            returnValue = systemValue;
        }
    }
    return returnValue;
}

/**
 *
 * @param {String} sitePrefID The fall back site preference ID
 * @param {dw.catalog.Product} productObject The product system object that has an attribute with a site preference fallback
 * @param {String} attributeID The custom attribute ID for the system object
 * @param {dw.catalog.ProductVariationModel} variationModel the variationModel that can be passed in to a product decorator, or even currentVariationModel if used outside of a decorator
 */
function getProductAttributeValue(sitePrefID, productObject, attributeID, variationModel) {
    var productToCheck = null;

    // first just assign the site preference as a fallback if no product data can be determined
    var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
    var returnValue = abConfigs[sitePrefID];
    if(!empty(productObject)) {
        productToCheck = productObject;
    }

    // use the variationModel if it's provided
    if(!empty(variationModel) && !empty(variationModel.getSelectedVariant())) {
        productToCheck = variationModel.getSelectedVariant();
    }
    if(!empty(attributeID)) {
        if(!empty(productToCheck) && attributeID in productToCheck.custom && !empty(productToCheck.custom[attributeID]) ) {
            returnValue = productToCheck.custom[attributeID];
        }
    }
    return returnValue;
}
module.exports = {
    getAttributeValue: getAttributeValue,
    getProductAttributeValue: getProductAttributeValue
}
