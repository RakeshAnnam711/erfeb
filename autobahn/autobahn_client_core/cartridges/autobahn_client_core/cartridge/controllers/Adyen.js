'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Token', csrfProtection.generateToken, function (req, res, next) {
    csrfProtection.generateToken(req, res, ()=>{});
    var csrf = res.viewData.csrf;
    res.render('/product/adyenToken', {csrf: csrf});
    next();
});

module.exports = server.exports();
