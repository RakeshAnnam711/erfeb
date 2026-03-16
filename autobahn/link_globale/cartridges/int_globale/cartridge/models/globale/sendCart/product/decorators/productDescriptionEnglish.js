'use strict';

/**
 * Calculates and returns Global-e Product.DescriptionEnglish API
 * @returns {string} - Global-e Product.DescriptionEnglish API
 */
function getProductDescriptionEnglish() {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    const localizationHelpers = require('*/cartridge/scripts/helpers/localizationHelpers');

    const logger = globaleHelpers.getLogger();
    let result = this.getProductDescription();

    try {
        if (this.englishLocale !== null) {
            result = localizationHelpers.executeFuncInLocaleContext(this.englishLocale, this.getProductDescription.bind(this));
        }
    } catch (e) {
        logger.error('GLOBALE_SEND_CART: {0}', logger.message(e));
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getProductDescriptionEnglish: {
            value: getProductDescriptionEnglish
        }
    });
};
