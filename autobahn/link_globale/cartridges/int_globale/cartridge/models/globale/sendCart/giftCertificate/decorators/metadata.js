'use strict';

/**
 * Calculates and returns Global-e Product.MetaData API
 * @returns {Object} - Global-e Product.MetaData API
 */
function getMetadata() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var keys = ['recipientEmail', 'message', 'recipientName', 'senderName', globaleHelpers.customAttr.giftCertificateLineItem.gePrice];
    var metadata = { Attributes: [] };

    keys.forEach(function (key) {
        metadata.Attributes.push({
            AttributeKey: key,
            AttributeValue: key in this.giftCertificateLineItem ? this.giftCertificateLineItem[key] : this.giftCertificateLineItem.custom[key]
        });
    }, this);

    return metadata;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getMetadata', {
        value: getMetadata
    });
};
