/* eslint-disable no-param-reassign */

'use strict';

/**
 * Updates product restrictions
 * @param {dw.catalog.Product} product - SFCC product
 * @param {ProductCountry} productCountry - ProductCountry API record
 */
function updateProductRestrictions(product, productCountry) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var restrSeparator = ',';

    if (product === null) {
        return;
    }

    var geRestrictedCountries = product.custom[globaleHelpers.customAttr.product.geRestrictedCountries]
        ? product.custom[globaleHelpers.customAttr.product.geRestrictedCountries].split(restrSeparator)
        : [];
    var restrArrIndex = geRestrictedCountries.indexOf(productCountry.CountryCode);
    var isRestrictedCountry = productCountry.IsRestricted;

    if (isRestrictedCountry && (restrArrIndex < 0)) {
        geRestrictedCountries.push(productCountry.CountryCode);
    } else if (!isRestrictedCountry && (restrArrIndex >= 0)) {
        geRestrictedCountries.splice(restrArrIndex, 1);
    }

    Transaction.wrap(function () {
        product.custom[globaleHelpers.customAttr.product.geRestrictedCountries] = geRestrictedCountries.join(restrSeparator);
        product.custom[globaleHelpers.customAttr.product.geIsForbidden] = productCountry.IsForbidden;
    });
}

module.exports = function (object) {
    Object.defineProperties(object, {
        updateProductRestrictions: {
            enumerable: true,
            value: updateProductRestrictions
        }
    });
};
