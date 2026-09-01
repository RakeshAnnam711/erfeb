'use strict';

var server = require('server');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var cache = require('*/cartridge/scripts/middleware/cache');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.get('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var canonicalUrl = URLUtils.abs('SiteMap-Show').toString();
    var pageMetaObject = {
        pageTitle: 'Our Sitemap | Check All Categories & Brands Online | WGACA',
        pageDescription: 'Check our sitemap & learn more about the luxury brands we sell. Check all categories & brands online at WGACA. International Delivery ✓ Sign Up & Get 10% OFF ✓'
    }
    pageMetaHelper.setPageMetaData(req.pageMetaData, pageMetaObject);
    res.setViewData({
        canonicalUrl: canonicalUrl
    });
    res.render('sitemap/siteMap');
    next();
}, pageMetaData.computedPageMetaData);

/**
 * Serves requests for search provider (Google, Yahoo) XML site maps. Reads a
 * given site map and copies it into the request output stream. If this is successful,
 * renders an http_200 template. If it fails, renders the http_404 template.
 * SiteMap Rule:
 * # process sitemaps
 * RewriteRule ^/(sitemap([^/]*))$ /on/demandware.store/%{HTTP_HOST}/-/SiteMap-Google?name=$1 [PT,L]
 */
server.get('Google', function (req, res, next) {
    var fileName = req.querystring.name;
    var siteMapResult = '500';

    if (fileName) {
        var SendGoogleSiteMapResult =
            new dw.system.Pipelet('SendGoogleSiteMap').execute({ // eslint-disable-line
                FileName: fileName
            });
        if (SendGoogleSiteMapResult.result === PIPELET_ERROR) { // eslint-disable-line
            siteMapResult = '404';
        } else {
            siteMapResult = '200';
        }
    }

    res.render('sitemap/result.isml', { siteMapResult: siteMapResult });
    next();
});

server.get('Get', function (req, res, next) {
    var fileName = req.querystring.name;

    if (!fileName || fileName.indexOf('..') !== -1) {
        res.setStatusCode(400);
        res.print('Invalid file name.');
        return next();
    }

    var file = new File(File.IMPEX + '/src/regional-sitemaps/' + fileName);

    if (file.exists()) {
        var reader = new FileReader(file, 'UTF-8');
        var xmlContent = reader.readString();
        reader.close();

        res.setContentType('application/xml');
        res.print(xmlContent);
    } else {
        res.setStatusCode(404);
        res.print('Sitemap not found.');
    }
    next();
});


module.exports = server.exports();
