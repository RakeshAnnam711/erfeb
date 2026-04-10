'use strict';

/**
 * Calculates and returns Global-e Product.MetaData API
 * @returns {Object} - Global-e Product.MetaData API
 */
function getMetadata() {
    var globalePLIHelpers = require('*/cartridge/scripts/helpers/globaleProductLineItemHelpers');
    var metadata = { Attributes: [] };
    metadata.Attributes.push({
        AttributeKey: this.option.getDisplayName(),
        AttributeValue: this.optionValue.getDisplayValue()
    });

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
