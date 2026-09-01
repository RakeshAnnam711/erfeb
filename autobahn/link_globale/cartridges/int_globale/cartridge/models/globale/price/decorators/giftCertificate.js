/* eslint-disable no-undef */

'use strict';

/**
 * Returns Gift Certificate LineItem
 * @param {string} giftCertificate - Gift Certificate LineItem
 * @returns {boolean|null} - Is Gift Certificate LineItem or null
 */
function getGiftCertificate(giftCertificate) {
    try {
        return giftCertificate || null;
    } catch (e) {
        this.logger.error('getGiftCertificate: {0}', this.logger.message(e));
    }
    return null;
}

module.exports = function (object, giftCertificate) {
    Object.defineProperties(object, {
        giftCertificate: {
            enumerable: true,
            value: getGiftCertificate.call(this, giftCertificate)
        }
    });
};
