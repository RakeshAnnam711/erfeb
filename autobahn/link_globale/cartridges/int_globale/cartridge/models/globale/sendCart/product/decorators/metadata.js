'use strict';

/**
 * Calculates and returns Global-e Product.MetaData API
 * @returns {Object} - Global-e Product.MetaData API
 */
function getMetadata() {
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var globalePLIHelpers = require('*/cartridge/scripts/helpers/globaleProductLineItemHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var metadata = { Attributes: [] };
    var variationAttributes = this.apiProduct.variationModel.getProductVariationAttributes();
    collections.forEach(variationAttributes, function (variationAttribute) {
        var selectedAttrValue = this.apiProduct.variationModel.getSelectedValue(variationAttribute);
        if (selectedAttrValue) {
            metadata.Attributes.push({
                AttributeKey: variationAttribute.ID,
                AttributeValue: selectedAttrValue.displayValue
            });
        }
    }, this);

    // check product options of productLineItem
    metadata.Attributes.push({
        AttributeKey: 'hasProductOptions',
        AttributeValue: this.productLineItem.optionProductLineItems.size() > 0
    });

    // add productID if UseProductCodeSecondaryInFulfillment enabled on Global-e side
    if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccUseProductCodeSecondaryInFulfillmentEnabled, false, 'boolean')) {
        metadata.Attributes.push({
            AttributeKey: globaleHelpers.consts.productID,
            AttributeValue: this.apiProduct.ID
        });
    }

    // update 'metadata' with attributes definitions from site preference and from hook
    var generalMetadata = globalePLIHelpers.getGeneralMetadata.call(this);
    metadata.Attributes = metadata.Attributes.concat(generalMetadata.Attributes);
    return metadata;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getMetadata', {
        value: getMetadata
    });
};
