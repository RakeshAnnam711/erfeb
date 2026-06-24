'use strict';

/**
 * @namespace Page
 */

var server = require('server');
server.extend(module.superModule);


var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Page-Show : This end point will render a content asset in full storefront page
 * @name Base/Page-Show
 * @function
 * @memberof Page
 * @param {middleware} - cache.applyDefaultCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - cid - the id of the content asset to be displayed in a full page
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('Show', cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var Logger = require('dw/system/Logger').getLogger('AB_ContentAsset');

    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    // Extend brand support for specific assets
    var apiContent = ContentMgr.getContent(req.querystring.cid);

    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);

        if (content.template) {
            res.render(content.template, { content: content });
        } else {
            Logger.info('Content asset with ID {0} is offline', req.querystring.cid);
            res.render('/components/content/offlineContent');
        }
    } else {
        Logger.info('Content asset with ID {0} was included but not found', req.querystring.cid);
    }

    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
