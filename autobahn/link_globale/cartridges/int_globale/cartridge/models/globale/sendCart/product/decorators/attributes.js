'use strict';

/**
 * Calculates and returns Global-e Product.Attributes API
 * @returns {array} - Global-e Product.Attributes API
 */
function getAttributes() {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    const collections = require('*/cartridge/scripts/util/globale/collections');

    const logger = globaleHelpers.getLogger();
    let attributes = [];

    try {
        var variationAttributes = this.apiProduct.variationModel.getProductVariationAttributes();
        collections.forEach(variationAttributes, function (variationAttribute) {
            var selectedAttrValue = this.apiProduct.variationModel.getSelectedValue(variationAttribute);
            if (selectedAttrValue) {
                attributes.push({
                    AttributeCode: selectedAttrValue.ID,
                    Name: selectedAttrValue.displayValue,
                    AttributeTypeCode: variationAttribute.ID
                });
            }
        }, this);
    } catch (e) {
        logger.error('GLOBALE_SEND_CART: {0}', logger.message(e));
    }

    return attributes;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getAttributes', {
        value: getAttributes
    });
};
