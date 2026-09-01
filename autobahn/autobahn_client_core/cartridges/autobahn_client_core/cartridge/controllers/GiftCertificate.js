'use strict';

/**
 * Controller that enhance the GiftCertificate controller with SEO data
 *
 * @module controllers/GiftCertificate
 */

var server = require('server');
server.extend(module.superModule);

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var recaptcha = require('*/cartridge/scripts/middleware/recaptcha');
var URLUtils = require('dw/web/URLUtils');


/**
 * Endpoints
 */

server.append('ApplyBalance', function (req, res, next) {
    res.viewData.removeGiftCertificateUrl =  URLUtils.https('GiftCertificate-RemoveGiftCertificatePaymentInstrument').toString();
    next();
});

server.append('RemoveGiftCertificatePaymentInstrument', function (req, res, next) {
    res.viewData.removeGiftCertificateUrl =  URLUtils.https('GiftCertificate-RemoveGiftCertificatePaymentInstrument').toString();
    next();
});

server.get('CheckBalancePage', server.middleware.https, consentTracking.consent, function(req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var giftCertificateForm = server.forms.getForm('giftCertificate');

    giftCertificateForm.clear();

    if (req.currentCustomer.profile) {
        giftCertificateForm.purchase.from.value = req.currentCustomer.profile.firstName + ' ' + customer.profile.lastName;
    }

    res.render('giftCertificate/giftCertificateCheckBalance', {
        enabled: dw.system.Site.getCurrent().getCustomPreferenceValue('giftCertificateEnabled'),
        giftCertificateForm: giftCertificateForm,
        breadcrumbs: [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.url('Home-Show').toString()
            }
        ]
    });

    next();
})

module.exports = server.exports();
