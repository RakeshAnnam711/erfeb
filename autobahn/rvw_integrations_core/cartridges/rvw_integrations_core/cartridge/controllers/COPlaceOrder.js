'use strict';
var server = require('server');
server.extend(module.superModule);

server.append('Submit', function (req, res, next) {
    var giftCertificateForm = server.forms.getForm('giftCertificate');
    giftCertificateForm.clear();

    res.setViewData({
        giftCertificateForm: giftCertificateForm
    });

    next();
});

module.exports = server.exports();
