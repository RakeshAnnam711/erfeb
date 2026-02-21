'use strict';

var Velocity = require('dw/template/Velocity');

var seoHelpers = require('*/cartridge/scripts/helpers/seoHelper');
var preferences = require('*/cartridge/config/preferences');

/**
 * Renders app.template.htmlHead hook content
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 */
function htmlHead(pdict) {
    if (preferences.seo.enableHrefLangs) {
        // WGACA MODIFICATION - convert queryString to proper string for SEO Helper functionality
        pdict.queryString = pdict.queryString.toString();
        // AUTOBAHN MOD Velocity render method triggers default writer class (Controller Template Eval) to bypass chained hook rendering issue
        Velocity.render(seoHelpers.renderHreflang(pdict), {});
    }
    if (preferences.seo.enableOpenGraph) {
        // AUTOBAHN MOD Velocity render method triggers default writer class (Controller Template Eval) to bypass chained hook rendering issue
        Velocity.render(seoHelpers.renderOpenGraphMetaTags(pdict), {});
    }
}

module.exports = {
    htmlHead: htmlHead
};
