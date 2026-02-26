'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.append('SetConsent', function (req, res, next) {
    var consent = (req.querystring.consent === 'true');
    var enableCookieConsent = !!res.viewData.abConfigs.enableCookieConsent;

    if (!!consent && enableCookieConsent) {
        var Cookie = require('dw/web/Cookie');
        var consentCookie = new Cookie ('abconsent', 'true');

        consentCookie.setSecure(true);
        consentCookie.setPath('/');
        consentCookie.setMaxAge(res.viewData.abConfigs.cookieConsentAge);

        response.addHttpCookie(consentCookie);
    }

    next();
});

server.append('Check', csrfProtection.generateToken, function(req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');

    var ContentModel = require('*/cartridge/models/content');
    var RenderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var cid = 'tracking_hint';
    var apiContent = ContentMgr.getContent(cid);
    var content = new ContentModel(apiContent, 'components/content/contentAssetInc');

    if (!empty(apiContent)) {
        res.setViewData({
            contentHTML: RenderTemplateHelper.getRenderedHtml({cid: cid, content: content}, content.template)
        });
    }

    res.setViewData({
        tracking_consent: req.session.privacyCache.get('consent')
    });

    next();
});

module.exports = server.exports();
