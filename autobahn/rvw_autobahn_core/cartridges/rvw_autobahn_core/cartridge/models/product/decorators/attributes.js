'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Util = require('dw/util');


/**
 * Determines whether an attribute group will show in attributes.isml
 * @param {array} attributes - list of attributes
 * @param {array} attrGroupInclusion - list of attribute id's to compare to attributes
 * @returns {array} array with new attribute list for the attributes.isml to loop through
 */
function attributeGroupInclusionList(product, attributeGroups) {  
    if (!empty(product.attrGroupInclusion)) {
        var newAttrGroupInclusion = new Util.ArrayList();
        var attrGroupInclusionArray = product.attrGroupInclusion.toString().replace(/\s/g,'').split(',');
            collections.forEach(attributeGroups, function(attributeGroup) {
                attrGroupInclusionArray.forEach(function(attrGroupInclusionItem) {
                    if (attrGroupInclusionItem === attributeGroup.ID) {
                        newAttrGroupInclusion.add(attributeGroup);
                    }
                });
            });

        return newAttrGroupInclusion; 
    }
}

/**
 * Creates an object of the visible attributes for a product
 * @param {dw.catalog.ProductAttributeModel} attributeModel - attributeModel for a given product.
 * @return {Object|null} an object containing the visible attributes for a product.
 */
function getAttributes(product, attributeModel) {
    var attributes;
    var visibleAttributeGroups = attributeGroupInclusionList(product, attributeModel.visibleAttributeGroups);

    if (visibleAttributeGroups && visibleAttributeGroups.getLength() > 0) {
        attributes = collections.map(visibleAttributeGroups, function (group) {
            var visibleAttributeDef = attributeModel.getVisibleAttributeDefinitions(group);
            var attributeResult = {};

            

            attributeResult.ID = group.ID;
            attributeResult.name = group.displayName;
            attributeResult.attributes = collections.map(
                visibleAttributeDef,
                function (definition) {
                    var definitionResult = {};
                    definitionResult.label = definition.displayName;

                    if (definition.multiValueType) {
                        definitionResult.value = attributeModel.getDisplayValue(definition).map(
                            function (item) {
                                return item;
                            });
                    } else {
                        definitionResult.value = [attributeModel.getDisplayValue(definition)];
                    }

                    return definitionResult;
                }
            );

            return attributeResult;
        });
    } else {
        attributes = null;
    }

    return attributes;
}

module.exports = function (object, attributeModel) {
    Object.defineProperty(object, 'attributes', {
        enumerable: true,
        value: getAttributes(object, attributeModel)
    });
};
