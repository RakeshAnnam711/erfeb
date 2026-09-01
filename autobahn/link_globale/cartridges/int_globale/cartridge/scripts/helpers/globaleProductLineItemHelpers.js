'use strict';

/**
 * Updates 'metadata' array with definitions from site preferences
 * @param {array} metadata - Array with metadata attributes that are sent to Global-e
 */
function updateMetadataFromSitePref(metadata) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var logger = globaleHelpers.getLogger();
    try {
        var metadataPref = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMetadataCustomAttributes) || [];
        var metadataAttributeDefinitions = metadataPref.slice();
        metadataAttributeDefinitions.forEach(function (attrDef) {
            // init values
            var metadataAttr = null;
            var metadataAttrKey = null;
            var metadataAttrValue = null;
            var metadataAttrPath = null;
            // define attribute path and key
            attrDef = attrDef.split(':'); // eslint-disable-line no-param-reassign
            if (attrDef.length === 2) {
                metadataAttrPath = attrDef[1];
                metadataAttrKey = attrDef[0];
            } else {
                metadataAttrPath = attrDef[0];
                metadataAttrKey = metadataAttrPath.split('.').pop();
            }
            // get attribute value by path
            metadataAttr = objectUtils.getValueByPath(this.productLineItem, metadataAttrPath, null);
            if (metadataAttr === null) {
                return;
            }
            // define attribute value
            if (typeof (metadataAttr) === 'object') {
                metadataAttrValue = metadataAttr.getValue();
            } else {
                metadataAttrValue = metadataAttr;
            }
            // push attribute key and value
            metadata.Attributes.push({
                AttributeKey: metadataAttrKey,
                AttributeValue: metadataAttrValue
            });
        }.bind(this));
    } catch (e) {
        // handle error
        logger.error('GLOBALE_SEND_CART_GET_METADATA: updateMetadataFromSitePref : {0}', logger.message(e));
    }
}

/**
 * Returns 'metadata' object with attribute definitions from site preferences and from hook
 * @param {Object} metadata - Object with metadata attributes that are sent to Global-e
 * @returns {Object} - Global-e Product.MetaData API
 */
function getGeneralMetadata() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    var logger = globaleHelpers.getLogger();
    var metadata = { Attributes: [] };

    // update 'metadata' with attributes definitions from site preference
    updateMetadataFromSitePref.call(this, metadata);

    // call event hook
    try {
        var customMetadataAttributes = globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.sendCart.getPLICustomMetadata, this.productLineItem);
        if (customMetadataAttributes) {
            Object.keys(customMetadataAttributes).forEach(function (attributeKey) {
                metadata.Attributes.push({ AttributeKey: attributeKey, AttributeValue: customMetadataAttributes[attributeKey] });
            });
        }
    } catch (e) {
        // handle error
        logger.error('GLOBALE_SEND_CART_GET_METADATA: custom metadata : {0}', logger.message(e));
    }

    return metadata;
}

module.exports = {
    getGeneralMetadata: getGeneralMetadata
};
