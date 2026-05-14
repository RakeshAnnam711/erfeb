'use strict';

/**
 * Calculates and returns Global-e Product.Categories API
 * @returns {array} - Global-e Product.Categories API
 */
function getCategories() {
    var globaleProductHelpers = require('*/cartridge/scripts/helpers/globaleProductHelpers');
    var globaleRequest = require('*/cartridge/models/globale/request');

    if (this.englishLocale !== null) {
        globaleRequest.set('locale', this.englishLocale);
    }

    var categoriesHashSet = globaleProductHelpers.getProductCategories(this.apiProduct);

    globaleRequest.set('locale', this.userLocale);

    return categoriesHashSet.toArray().map(function (category) {
        return {
            CategoryCode: category.getID(),
            Name: category.getDisplayName()
        };
    });
}

module.exports = function (object) {
    Object.defineProperty(object, 'getCategories', {
        value: getCategories
    });
};
