'use strict';

/**
 * Returns cultures localization data
 * @param {Object} geProduct - GE product
 * @param {string} cultureCode - culture code
 * @returns {Object} - localization data
 */
function getCultureLocalization(geProduct, cultureCode) {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    const logger = globaleHelpers.getLogger();
    let result = null;

    try {
        const cultureLocalizationData = {
            Name: geProduct.getProductName(),
            Description: geProduct.getProductDescription(),
            Attributes: geProduct.getAttributes()
        };

        result = {
            CultureCode: cultureCode,
            Data: cultureLocalizationData
        };
    } catch (e) {
        logger.error('GLOBALE_SEND_CART: {0}', logger.message(e));
    }

    return result;
}

/**
 * Returns Global-e Product.Localization API
 * @returns {array} - Global-e Product.Localization API
 */
function getLocalization() {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    const localizationHelpers = require('*/cartridge/scripts/helpers/localizationHelpers');

    const logger = globaleHelpers.getLogger();
    const localizationConfiguration = localizationHelpers.getLocalizationConfiguration();

    let result = [];

    try {
        localizationConfiguration.forEach(function (item) {
            let cultureLocalization = localizationHelpers.executeFuncInLocaleContext(item.locale, getCultureLocalization.bind(null, this, item.culture)) || null;

            if (cultureLocalization) {
                result.push(cultureLocalization);
            }
        }.bind(this));
    } catch (e) {
        logger.error('GLOBALE_SEND_CART: {0}', logger.message(e));
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getLocalization', {
        value: getLocalization
    });
};
