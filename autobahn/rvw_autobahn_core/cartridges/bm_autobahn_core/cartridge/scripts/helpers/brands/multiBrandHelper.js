'use strict';

var base = module.superModule || {};

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var brandConstants = require('*/cartridge/scripts/constants/brandConstants');

/**
 * returns integer
 */
function getBrandCount() {
    return CustomObjectMgr.getAllCustomObjects(brandConstants.siteBrandConfig).count;
}

/**
 * returns list array ordered alphabetically by custom object key
 */
function getAllBrands() {
    return CustomObjectMgr.getAllCustomObjects(brandConstants.siteBrandConfig).asList().toArray();
}

/**
 * @param {string} attribute Required : attribute-id from the custom object
 * @param {string} sort optional : sort order - asc or desc, defaults to asc
 */
function getAllBrandsOrderedBy(attribute, sort) {
    return CustomObjectMgr.queryCustomObjects(brandConstants.siteBrandConfig,'', 'custom.'+ attribute +' '+ ((sort && sort === 'desc') ? 'desc' : 'asc')).asList().toArray();
}

/**
 * returns list array of non-deleted brands
 */
 function getAllNotDeletedBrands() {
    var allBrands = module.exports.getAllBrands();
    var notDeletedBrands = [];

    if (allBrands) {
        allBrands.forEach(function (site, i) {
            if (site.custom && !site.custom.siteDeleted) {
                notDeletedBrands.push(site.custom);
            }
        });
    }

    return notDeletedBrands;
}

/**
 * returns all the values for the brandID thats passed in, only if its not deleted
 * @param {string} brandID
 * @returns {object} Brand settings
 */
 function getActiveBrand(brandID) {
    // first check if brand is not deleted
    var activeSite = module.exports.checkIfBrandIsNotDeleted(brandID);
    if (!activeSite) {
        // if brand is deleted, get the default brand
        activeSite = module.exports.loopThroughBrandsToFindValue('isDefault');
        if (activeSite && activeSite.brandID) {
            activeSite = module.exports.checkIfBrandIsNotDeleted(activeSite.brandID);
        }
        if (!activeSite) {
            // if no default brand, just use the first available
            activeSite = module.exports.getAllNotDeletedBrands()[0];
        }
    }

    return activeSite;
}

/**
 * returns all the values for the current brand
 * @param {object} viewData - looks for siteContext first
 */
function getCurrentBrandSettings(viewData) {
    var bmSelectedSite = module.exports.loopThroughBrandsToFindValue('isSelected');
    var currentBrand;

    if (viewData && viewData.siteContext) {
        currentBrand = viewData.siteContext.ID;
    }

    if (!currentBrand || !viewData) {
        var lastSessionSiteContextID = session.custom && session.custom.siteContextID;
        if (lastSessionSiteContextID) {
            currentBrand = lastSessionSiteContextID;
        } else {
            currentBrand = (bmSelectedSite && bmSelectedSite.siteDeleted !== true) ? bmSelectedSite.brandID : dw.system.Site.getCurrent().ID;
        }
    }

    return module.exports.getActiveBrand(currentBrand);
}

/**
 * checks if brandID passed-in is not deleted
 * @param {string} brandID required
 * @returns {object} Brand settings
 */
 function checkIfBrandIsNotDeleted(brandID) {
    var allBrands = module.exports.getAllBrands();
    var sitePrefs;

    if (allBrands) {
        allBrands.forEach(function (site, i) {
            if (site.custom && site.custom.brandID === brandID && !site.custom.siteDeleted) {
                sitePrefs = site.custom;
            }
        });
    }

    return sitePrefs;
}

/**
 * finds the brand with boolean marked true
 * @param {boolean} value
 * @returns {object} Brand settings
 */
function loopThroughBrandsToFindValue(value) {
    var brand = null;
    var allBrands = module.exports.getAllBrands();

    if (allBrands) {
        allBrands.forEach(function (site, i) {
            if (site.custom && site.custom[value]) {
                brand = site.custom;
            }
        });
    }

    return brand;
}

module.exports = Object.assign(base, {
    getBrandCount: getBrandCount,
    getAllBrands: getAllBrands,
    getAllBrandsOrderedBy: getAllBrandsOrderedBy,
    getAllNotDeletedBrands: getAllNotDeletedBrands,
    getActiveBrand: getActiveBrand,
    getCurrentBrandSettings: getCurrentBrandSettings,
    checkIfBrandIsNotDeleted: checkIfBrandIsNotDeleted,
    loopThroughBrandsToFindValue: loopThroughBrandsToFindValue
 });
