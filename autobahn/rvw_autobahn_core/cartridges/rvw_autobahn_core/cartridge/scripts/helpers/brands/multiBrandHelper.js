'use strict';

var base = module.superModule || {};

/**
 * checks if brandID passed-in exists in the list of custom objects and not deleted
 * @param {string} brandID required
 */
function checkForBrandID(brandID) {
    return module.exports.checkIfBrandIsNotDeleted(brandID);
}

/**
 * Sanity check for AB upgrades using consolidated AB build (3.10)
 */

['getBrandCount','getAllBrandsOrderedBy','getCurrentBrandSettings','checkIfBrandIsNotDeleted'].forEach(function (prop) {
    if (!base.hasOwnProperty(prop)) {
        base[prop] = function () {
            throw new Error ('Missing \'bm_autobahn_core\' storefront cartridge path. Required for \'' + prop + '\' functionality');
        };
    }
});


module.exports = Object.assign(base, {
    checkForBrandID: checkForBrandID
});