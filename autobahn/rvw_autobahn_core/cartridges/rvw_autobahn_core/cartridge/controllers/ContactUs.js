'use strict';

var server = require('server');
server.extend(module.superModule);

var recaptcha = require('*/cartridge/scripts/middleware/recaptcha');

server.append('Landing', server.middleware.https, function (req, res, next) {
    var viewData = res.getViewData();
    var URLUtils = require('dw/web/URLUtils');
    var canonicalUrl = URLUtils.abs('ContactUs-Landing').toString();

    // viewData.contactUsFormTopics = Site.getCurrent().preferences.custom.contactUsFormTopics;
    var contactUsFormTopics = 'contactUsFormTopics' in dw.system.Site.current.preferences.custom && !empty(dw.system.Site.current.preferences.custom.contactUsFormTopics) ? dw.system.Site.current.preferences.custom.contactUsFormTopics : null;

    if (contactUsFormTopics) {
        viewData.contactUsFormTopics = contactUsFormTopics;
    }

    //res.setViewData(viewData);

    res.setViewData({
        canonicalUrl: canonicalUrl
    });

    next();
});

server.prepend('Subscribe', server.middleware.https, recaptcha.checkRecaptcha);

module.exports = server.exports();
