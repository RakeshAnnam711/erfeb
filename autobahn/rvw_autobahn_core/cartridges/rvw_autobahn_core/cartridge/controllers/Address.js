'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.append('List', function (req, res, next) {
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData();

    res.setViewData({
        breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
    });
    next();
});

server.append(
    'AddAddress',
    csrfProtection.generateToken,
    consentTracking.consent,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
        var viewData = res.getViewData();

        if (req.currentCustomer && req.currentCustomer.profile) {
            var addressForm = server.forms.getForm('address');
            addressForm.clear();
            addressForm.copyFrom({phone: req.currentCustomer.profile.phone || ''});
            viewData.addressForm = addressForm;
        }
        viewData.breadcrumbs = breadcrumbHelpers.updateHomeURL(viewData);

        res.setViewData(viewData);

        next();
    }
);

server.append(
    'EditAddress',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
        var viewData = res.getViewData();

        viewData.breadcrumbs = breadcrumbHelpers.updateHomeURL(viewData);

        res.setViewData(viewData);

        next();
    }
);

module.exports = server.exports();
