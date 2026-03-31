'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var ImageModel = require('*/cartridge/models/product/productImages');

/**
 * Determines whether a product attribute has image swatches. This has been extended to allow any attribute to be swatchable, not just color
 * @param {string} dwAttributeId - Id of the attribute to check
 * @param {array} attrsToUseForSwatch - passes the swatchable attribute id's ['color','size']
 * @returns {boolean} flag that specifies if the current attribute should be displayed as a swatch
 */
function isSwatchable(dwAttributeId, attrsToUseForSwatch) {
    if (attrsToUseForSwatch && attrsToUseForSwatch.length > 0 ){
        return attrsToUseForSwatch.indexOf(dwAttributeId) > -1;
    } else {
        return false
    }
}
/**
 * Retrieve all attribute values
 *
 * @param {dw.catalog.ProductVariationModel} variationModel - A product's variation model
 * @param {dw.catalog.ProductVariationAttributeValue} selectedValue - Selected attribute value
 * @param {dw.catalog.ProductVariationAttribute} attr - Attribute value'
 * @param {string} endPoint - The end point to use in the Product Controller
 * @param {string} selectedOptionsQueryParams - Selected options query params
 * @param {string} quantity - Quantity selected
 * @param {array} attrsToUseForSwatch - passes the swatchable attribute id's ['color','size']
 * @returns {Object[]} - List of attribute value objects for template context
 */
function getAllAttrValues(
    variationModel,
    selectedValue,
    attr,
    endPoint,
    selectedOptionsQueryParams,
    quantity,
    attrsToUseForSwatch,
    pdpSwatchTypeAsImage
) {
    var attrValues = variationModel.getAllValues(attr);
    var actionEndpoint = 'Product-' + endPoint;

    return collections.map(attrValues, function (value) {
        var isSelected = (selectedValue && selectedValue.equals(value)) || false;
        var valueUrl = '';
        // Get unfiltered model
        var refilterVariationModel = variationModel.master.variationModel;

        var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
        var outOfStockViewable = !!abConfigs.viewOutOfStockItems;

        var processedAttr = {
            id: value.ID,
            description: value.description,
            displayValue: value.displayValue,
            value: value.value,
            selected: isSelected,
            selectable: outOfStockViewable ? true : refilterVariationModel.hasOrderableVariants(attr, value),
            available: variationModel.hasOrderableVariants(attr, value)
        };

        if (!outOfStockViewable) {
            // Add deselect if already selected
            if (isSelected && endPoint !== 'Show') {
                valueUrl = variationModel.urlUnselectVariationValue(actionEndpoint, attr);
            // Not selected but avail with all other current variation selections
            } else if (processedAttr.available) {
                valueUrl = variationModel.urlSelectVariationValue(actionEndpoint, attr, value);
            // Selectable but not with one or more current variation selections,
            } else if (processedAttr.selectable) {
                // Apply only orderable selected attributes to unfiltered model
                refilterVariationModel.setSelectedAttributeValue(attr.ID, value.ID);

                // Only apply current variation selections if orderable with this "value"
                refilterVariationModel.getProductVariationAttributes().toArray()
                .forEach(function (applyAttr) {
                    var selectedVal = attr.ID !== applyAttr.ID && variationModel.getSelectedValue(applyAttr);

                    if (!!selectedVal && refilterVariationModel.hasOrderableVariants(applyAttr, selectedVal)) {
                        refilterVariationModel.setSelectedAttributeValue(applyAttr.ID, selectedVal.ID);
                    }
                });

                valueUrl = refilterVariationModel.urlSelectVariationValue(actionEndpoint, attr, value);
            }
        } else {
            // if outOfStockViewable is enabled use this url method for all attrValues
            valueUrl = variationModel.urlSelectVariationValue(actionEndpoint, attr, value);
        }

        if (valueUrl) {
            processedAttr.url = urlHelper.appendQueryParams(valueUrl, [selectedOptionsQueryParams,
                'quantity=' + quantity]);
        }

        if (isSwatchable(attr.attributeID, attrsToUseForSwatch)) {
            if (pdpSwatchTypeAsImage) {
                processedAttr.images = new ImageModel(value, { types: ['thumbnail'], quantity: 'all' });
                processedAttr.images.type = 'thumbnail';
            }
            else {
                processedAttr.images = new ImageModel(value, { types: ['swatch'], quantity: 'all' });
                processedAttr.images.type = 'swatch';
            }
        }

        return processedAttr;
    });
}

/**
 * Gets the Url needed to relax the given attribute selection, this will not return
 * anything for attributes represented as swatches.
 *
 * @param {Array} values - Attribute values
 * @param {string} attrID - id of the attribute
 * @returns {string} -the Url that will remove the selected attribute.
 */
function getAttrResetUrl(values, attrID) {
    var urlReturned;
    var value;

    for (var i = 0; i < values.length; i++) {
        value = values[i];
        if (!value.images) {
            if (value.selected) {
                urlReturned = value.url;
                break;
            }

            if (value.selectable) {
                urlReturned = value.url.replace(attrID + '=' + value.value, attrID + '=');
                break;
            }
        }
    }

    return urlReturned;
}

/**
 * @constructor
 * @classdesc Get a list of available attributes that matches provided config
 *
 * @param {dw.catalog.ProductVariationModel} variationModel - current product variation
 * @param {Object} attrConfig - attributes to select
 * @param {Array} attrConfig.attributes - an array of strings,representing the
 *                                        id's of product attributes.
 * @param {string} attrConfig.attributes - If this is a string and equal to '*' it signifies
 *                                         that all attributes should be returned.
 *                                         If the string is 'selected', then this is comming
 *                                         from something like a product line item, in that
 *                                         all the attributes have been selected.
 *
 * @param {string} attrConfig.endPoint - the endpoint to use when generating urls for
 *                                       product attributes
 * @param {string} selectedOptionsQueryParams - Selected options query params
 * @param {string} quantity - Quantity selected
 */
function VariationAttributesModel(variationModel, attrConfig, selectedOptionsQueryParams, quantity) {
    var allAttributes = variationModel.productVariationAttributes;
    var result = [];

    collections.forEach(allAttributes, function (attr) {
        var selectedValue = variationModel.getSelectedValue(attr);
        var values = getAllAttrValues(variationModel, selectedValue, attr, attrConfig.endPoint,
            selectedOptionsQueryParams, quantity, attrConfig.attrsToUseForSwatch, attrConfig.pdpSwatchTypeAsImage);
        var resetUrl = getAttrResetUrl(values, attr.ID);
        var variantSelected = values.find(function (val) { return val && !!val.selected; });

        if ((Array.isArray(attrConfig.attributes)
            && attrConfig.attributes.indexOf(attr.attributeID) > -1)
            || attrConfig.attributes === '*') {
            result.push({
                attributeId: attr.attributeID,
                displayName: attr.displayName,
                id: attr.ID,
                swatchable: isSwatchable(attr.attributeID, attrConfig.attrsToUseForSwatch),
                displayValue: selectedValue && selectedValue.displayValue ? selectedValue.displayValue : '',
                values: values,
                variantSelected: variantSelected ? true : false,
                resetUrl: resetUrl,
                isOnlyVariant: variationModel.variants.length === 1
            });
        } else if (attrConfig.attributes === 'selected') {
            result.push({
                displayName: attr.displayName,
                displayValue: selectedValue && selectedValue.displayValue ? selectedValue.displayValue : '',
                attributeId: attr.attributeID,
                id: attr.ID,
                isOnlyVariant: variationModel.variants.length === 1
            });
        }
    });
    result.forEach(function (item) {
        this.push(item);
    }, this);
}

VariationAttributesModel.prototype = [];

module.exports = VariationAttributesModel;
