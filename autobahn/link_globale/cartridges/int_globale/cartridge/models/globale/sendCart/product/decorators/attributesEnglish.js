'use strict';

/**
 * Calculates and returns Global-e Product.AttributesEnglish API
 * @returns {array} - Global-e Product.AttributesEnglish API
 */
function getAttributesEnglish() {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    const localizationHelpers = require('*/cartridge/scripts/helpers/localizationHelpers');

    const logger = globaleHelpers.getLogger();
    let attributes = [];

    try {
        if (this.englishLocale !== null) {
            attributes = localizationHelpers.executeFuncInLocaleContext(this.englishLocale, this.getAttributes.bind(this));
        }
    } catch (e) {
        logger.error('GLOBALE_SEND_CART: {0}', logger.message(e));
    }

    return attributes;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getAttributesEnglish', {
        value: getAttributesEnglish
    });
};
