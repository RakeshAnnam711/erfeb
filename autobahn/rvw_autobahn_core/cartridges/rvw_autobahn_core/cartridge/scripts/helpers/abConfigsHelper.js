'use strict';

var Logger = require('dw/system/Logger');
/**
 * Retrieves the AutoBahn Site Configs for the current brand
 * @returns {object}
*/
function getBrandCustomObject(viewData) {
    var brandPrefs;

    try {
        var multiBrandHelper = require('*/cartridge/scripts/helpers/brands/multiBrandHelper');
        brandPrefs = multiBrandHelper.getCurrentBrandSettings(viewData);

        if (!empty(brandPrefs)) {
            brandPrefs = Object.assign({}, brandPrefs);
            for (var key in brandPrefs) {
                // remove all the style preferences to not bloat the object
                if ((JSON.stringify(key)).includes('style') || (JSON.stringify(key)).includes('siteContextJSON')) {
                    delete brandPrefs[key];
                }
                var brandPrefKeyObj = Object.assign({}, brandPrefs[key]);
                if (brandPrefKeyObj.value) {
                    brandPrefs[key] = brandPrefKeyObj.value;
                }
            };
        }
    } catch (e) {
        Logger.warn('MultiBrand — There was an issue retrieving the current Brands custom object. {0} [{1}:{2}]', e.toString(), e.fileName, e.lineNumber);
    }

    return brandPrefs;
}

function getABConfigs(viewData) {
    var abConfigs = {};

    try {
        var siteConfigsHelper = require('*/cartridge/scripts/util/siteConfigsHelper');
        abConfigs = Object.assign({}, siteConfigsHelper.buildAbConfigsObject());

        var brandPrefs = getBrandCustomObject(viewData || '');

        if (!empty(brandPrefs)) {
            abConfigs = Object.assign(abConfigs, brandPrefs);
            if (abConfigs.siteContextJSON) {
                // remove all the siteContextJSON to not bloat the object
                delete abConfigs.siteContextJSON
            }
        }
    } catch (e) {
        Logger.error('There was an issue building the AB configs object. {0} [{1}:{2}]', e.toString(), e.fileName, e.lineNumber);
    }

    return abConfigs;
}

module.exports = {
    getABConfigs: getABConfigs
};
