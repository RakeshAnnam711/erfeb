'use strict';

var seoHelpers = require('*/cartridge/scripts/helpers/seoHelper');
var preferences = require('*/cartridge/config/seoPreferences');

/**
 * Renders app.template.htmlHead hook content
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {string} content to return in hook
 */
function htmlHead(pdict) {
    var returnStr = '';
    if (preferences.seo.enableHrefLangs) {
        returnStr += seoHelpers.renderHreflang(pdict);
    }
    if (preferences.seo.enableOpenGraph) {
        returnStr += seoHelpers.renderOpenGraphMetaTags(pdict);
    }
    return returnStr;
}

module.exports = {
    htmlHead: htmlHead
};
