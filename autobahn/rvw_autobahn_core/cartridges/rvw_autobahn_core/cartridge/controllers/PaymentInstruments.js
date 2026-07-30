'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var recaptcha = require('*/cartridge/scripts/middleware/recaptcha');

server.append('AddPayment', csrfProtection.generateToken, consentTracking.consent, userLoggedIn.validateLoggedIn, function (req, res, next) {
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData();

    // Change Credit Card Exp Years to be 11 years
    var currentYear = new Date().getFullYear();
    var creditCardExpirationYears = [];

    for (var i = 0; i < 11; i++) {
        creditCardExpirationYears.push((currentYear + i).toString());
    }

    viewData.expirationYears = creditCardExpirationYears;
    viewData.breadcrumbs = breadcrumbHelpers.updateHomeURL(viewData);

    res.setViewData(viewData);

    next();
});

server.prepend('SavePayment', csrfProtection.validateAjaxRequest, recaptcha.checkRecaptchaAjax);

server.append('SavePayment', function (req, res, next){
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        //AUTOBAHN MOD don't send back all this private info like base sfra does
        var cleanup = [ 'name', 'cardNumber', 'cardType', 'expirationMonth', 'expirationYear', 'paymentForm'];
        var viewData = res.getViewData();
        if (viewData.success) {
            cleanup.forEach(function (c) {
                delete viewData[c];
            });
        }
    });

    next();
});

server.append('List', function (req, res, next) {
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData();

    res.setViewData({
        breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
    });
    next();
});

module.exports = server.exports();
