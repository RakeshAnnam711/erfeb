'use strict';

var Logger = require('dw/system/Logger');
var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var URLAction = require('dw/web/URLAction');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var EXCLUDED_PARAMS_REGEX = new RegExp('[&|?]?(lang|cid|pid|cgid)=.*?(&|$)', 'g');

/**
 * Set the page meta data to the current request
 *
 * @param {Object} req The request object
 * @param {Object} metaDataObj The object that contains all the metadata
 */
function setPageMetaData(req, metaDataObj) {
    // Extension point that allows other catridges to change the values
    var HookMgr = require('dw/system/HookMgr');
    if (HookMgr.hasHook('app.seo.setpagemetadata')) {
        var result = HookMgr.callHook('app.seo.setpagemetadata', metaDataObj.key.replace('.', '_'), metaDataObj);
        if (!empty(result)) {
            metaDataObj.title = result.title || metaDataObj.title;
            metaDataObj.description = result.description || metaDataObj.description;
            metaDataObj.keywords = result.keywords || metaDataObj.keywords;
            metaDataObj.pageMetaTags = result.pageMetaTags || metaDataObj.pageMetaTags;
        }
    }

    if (metaDataObj.title) {
        req.pageMetaData.setTitle(metaDataObj.title);
    }

    if (metaDataObj.description) {
        req.pageMetaData.setDescription(metaDataObj.description);
    }

    if (metaDataObj.keywords) {
        req.pageMetaData.setKeywords(metaDataObj.keywords);
    }

    if (metaDataObj.pageMetaTags) {
        req.pageMetaData.addPageMetaTags(metaDataObj.pageMetaTags);
    }
}

/**
 * @typedef {Object} getPageParametersReturn
 * @property {string} pipeline - The current pipeline
 * @property {string} code - The url parameter to add to the pipeline (cid, pid, cgid)
 * @property {string} qvalue - Search query parameter
 * @property {string} queryString - Extraneous query string added to the url (only used for search)
 * Get page parameters by parsing pdict
 * @param {dw.system.PipelineDictionary} pdict Pipeline Dictionnary
 * @returns {getPageParametersReturn} Page parameters
 */
function getPageParameters(pdict) {
    var server = require('server');
    var pipeline = pdict.action;
    var querystring = new server.querystring(pdict.queryString);
    var code = querystring.pid || querystring.cgid || querystring.cid || null;
    var qvalue = querystring.q;

    var queryString = '';
    // WGACA MODIFICATION - reduce hreflang failure
    // if (pipeline === 'Search-Show' && !empty(request.httpHeaders['x-is-query_string'])) {
    if (pipeline === 'Search-Show' && !empty(request.httpHeaders['x-is-query_string']) && (request.httpPath || '').indexOf('__SYSTEM__Page') === -1) {
        queryString = '?' + request.httpHeaders['x-is-query_string'];
    }

    return {
        pipeline: pipeline,
        code: code,
        qvalue: qvalue,
        queryString: queryString
    };
}

/**
 * @typedef {Object} getUrlParametersReturn
 * @property {string} pipeline - The current pipeline
 * @property {URLParameter} urlParam - The url parameter to add to the pipeline (cid, pid, cgid)
 * @property {string} queryString - Extraneous query string added to the url (only used for search)
 * Get pipeline with parameters that apply
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {getUrlParametersReturn} Url parameters
 */
function getUrlParameters(pdict) {
    var URLParameter = require('dw/web/URLParameter');
    var pageParams = getPageParameters(pdict);
    var urlParameters = {
        pipeline: pageParams.pipeline,
        urlParam: '',
        queryString: pageParams.queryString
    };

    switch (pageParams.pipeline) {
        case 'Search-Show':
            if (!empty(pageParams.code)) {
                urlParameters.urlParam = new URLParameter('cgid', pageParams.code);
             } else if (!empty(pageParams.qvalue)) {
                // avoiding double search parameters on the links
                if (!(pageParams.queryString.indexOf('?q=') >= 0 || pageParams.queryString.indexOf('&q=') >= 0)) {
                    urlParameters.urlParam = new URLParameter('q', pageParams.qvalue);
                }
            }
            break;
        case 'Page-Show':
            if (!empty(pageParams.code)) {
                urlParameters.urlParam = new URLParameter('cid', pageParams.code);
            }
            break;
        case 'Product-Show':
        case 'Product-ShowInCategory':
            if (!empty(pageParams.code)) {
                urlParameters.urlParam = new URLParameter('pid', pageParams.code);
            }
            break;
        default:
            break;
    }

    return urlParameters;
}

/**
 * Checks if meta already exists in pageMetaTags
 * @param {string} metaKey - The key to look for
 * @param {Array} pageMetaTags - Page Meta Tags array
 * @returns {boolean} true if meta exists
 */
function metaExists(metaKey, pageMetaTags) {
    if (!pageMetaTags) {
        return false;
    }
    return pageMetaTags.some(function (pageMeta) {
        return pageMeta.ID === metaKey;
    });
}

/**
 * Returns custom Open Graph Meta Tags (such as image)
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {Object} Open Graph Meta Tags
 * TODO: Discuss if middleware should not be the best place for this
 */
function getOpenGraphMetaTags(pdict) {
    var pageMetaTags = pdict.CurrentPageMetaData.pageMetaTags || [];
    var ogMetaTags = [
        { ID: 'og:type', content: 'website' },
        { ID: 'og:title', content: pdict.CurrentPageMetaData.title },
        { ID: 'og:locale', content: request.getLocale() },
        { ID: 'twitter:card', content: 'summary_large_image' }
    ];
    if (!empty(pdict.CurrentPageMetaData.description)) {
        ogMetaTags.push({ ID: 'og:description', content: pdict.CurrentPageMetaData.description });
    }
    if (pdict.product && pdict.product.images && pdict.product.images.large && pdict.product.images.large[0]) {
        ogMetaTags.push({ ID: 'image', content: pdict.product.images.large[0].absURL });
    }
    if (pdict.canonicalUrl) {
        ogMetaTags.push({ ID: 'og:url', content: pdict.canonicalUrl });
    }
    return ogMetaTags.filter(function (ogMeta) {
        return !module.exports.metaExists(ogMeta.ID, pageMetaTags);
    });
}

/**
 * Returns link
 * @param {Object} urlParameters - Url parameters (pipeline, querystring)
 * @param {string} currentSiteId - Current Site ID
 * @param {string} locale - locale ID
 * @returns {string} the link
 */
function getLink(urlParameters, currentSiteId, locale) {
    if (locale == 'default') {
        return !empty(urlParameters.urlParam)
            ? URLUtils.https(new URLAction(urlParameters.pipeline, currentSiteId), urlParameters.urlParam).toString()
            : URLUtils.https(new URLAction(urlParameters.pipeline, currentSiteId)).toString();
    } else {
        // AUTOBAHN MOD when locale is null site.default_locale is used
        return !empty(urlParameters.urlParam)
            ? URLUtils.https(new URLAction(urlParameters.pipeline, currentSiteId, locale), urlParameters.urlParam).toString()
            : URLUtils.https(new URLAction(urlParameters.pipeline, currentSiteId, locale)).toString();
    }
}

/**
 * Get hreflang key
 * @param {string} locale - Locale ID
 * @param {string} defaultLocale - Current Site default locale
 * @returns {string} the hreflang key
 */
function getHreflangKey(locale, defaultLocale) {
    return locale.split('_').join('-').toLowerCase();
}

/**
 * Return list of hreflangs
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {array} List of hreflangs
 */
function getHreflangs(pdict) {
    // AUTOBAHN MOD countries.json is used to map Locale <-> Pricebook, update uses BM configured Locales
    //var countries = require('*/cartridge/config/countries');

    var urlParameters = module.exports.getUrlParameters(pdict);
    var currentSite = Site.getCurrent();
    var allowedLocales = currentSite.allowedLocales && currentSite.allowedLocales.toArray();
    var fallbackLocale = allowedLocales.indexOf('default') !== -1 ? 'default' : currentSite.defaultLocale;
    var generateLocaleObj = function (localeid) {
        var locale = Locale.getLocale(localeid);
        var link = (!empty(locale) || (localeid == 'x-default')) && module.exports.getLink(urlParameters, currentSite.ID, locale ? locale.ID : fallbackLocale);

        if (!empty(link)) {
            return {
                url: link + urlParameters.queryString.replace(module.exports.EXCLUDED_PARAMS_REGEX, function (match) {
                    return match.indexOf('?') > -1 && match.indexOf('&') > -1 ? '?' : '';
                }),
                hreflang: module.exports.getHreflangKey(locale ? locale.ID : localeid, fallbackLocale)
            };
        }
    };

    // AUTOBAHN MOD corrected loop behavior
    var hreflangs = (allowedLocales || [])
    .filter(function (localeid) {
        // only include "default" locale if it is siteDefault
        return localeid !== 'default' || localeid === currentSite.defaultLocale;
    })
    .map(generateLocaleObj)
    .filter(function (obj) {
        return obj !== null;
    });

    // Add x-default
    hreflangs.push(generateLocaleObj('x-default'));

    return hreflangs;
}

/**
 * Renders hreflang
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {string} hreflang content
 */
function renderHreflang(pdict) {
    var hreflangs = module.exports.getHreflangs(pdict);
    var model = new HashMap();
    model.put('hreflangs', hreflangs);

    try {
        var text = new Template('/seo/hreflang').render(model).text;

        return text;
    } catch (e) {
        Logger.error('Error while rendering template seo/hreflang : ' + e.message);
        return '';
    }
}

/**
 * Renders Open Graph Meta Tags
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {string} open graph content
 */
function renderOpenGraphMetaTags(pdict) {
    var ogTags = module.exports.getOpenGraphMetaTags(pdict);
    var model = new HashMap();
    model.put('ogTags', ogTags);

    try {
        return new Template('/seo/openGraphMetaTags').render(model).text;
    } catch (e) {
        Logger.error('Error while rendering template seo/openGraphMetaTags : ' + e.message);
        return '';
    }
}

// AUTOBAHN MOD corrected to be fully extendable
module.exports = module.superModule || {};
module.exports.setPageMetaData = setPageMetaData;
module.exports.getUrlParameters = getUrlParameters;
module.exports.getOpenGraphMetaTags = getOpenGraphMetaTags;
module.exports.metaExists = metaExists;
module.exports.renderOpenGraphMetaTags = renderOpenGraphMetaTags;
module.exports.renderHreflang = renderHreflang;
module.exports.getHreflangs = getHreflangs;
module.exports.getHreflangKey = getHreflangKey;
module.exports.getLink = getLink;
module.exports.EXCLUDED_PARAMS_REGEX = EXCLUDED_PARAMS_REGEX;
