'use strict';

/**
 * @namespace Recaptcha
 */

var server = require('server');

server.get('Fail', function (req, res, next) {
    res.render('/recaptchaFail');
    next();
});

server.get('AjaxFail', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.setStatusCode(500);
    res.json({ recaptchaError: true, redirectUrl: URLUtils.url('Recaptcha-Fail').toString() });
    next();
});

module.exports = server.exports();
