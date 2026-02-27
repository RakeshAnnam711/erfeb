'use strict';

var server = require('server');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
server.extend(module.superModule);

server.prepend('Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken
);

server.prepend('Track',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken, function (req, res, next) {

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    giftCertificateForm.clear();

    res.setViewData({
        giftCertificateForm: giftCertificateForm
    });

    next();

});

server.append('History', function (req, res, next) {
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData();

    res.setViewData({
        breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
    });
    next();
});

server.append('CreateAccount', function (req, res, next) {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        var viewData = res.getViewData();
        var wishlistList = productListHelper.getDefaultList();
        viewData.wishlistList = wishlistList;
        res.setViewData(viewData);
    }

    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    storeHelpers.setPreferredStoreViewData(req, res);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.viewData;
        if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
            var OrderMgr = require('dw/order/OrderMgr');
            var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
            var listGuest = viewData.wishlistList;
            var order = OrderMgr.getOrder(viewData.orderID);
            if (viewData.success && order && listGuest.items.length) {
                var listLoggedIn = productListHelper.getDefaultList();
                productListHelper.mergelists(listLoggedIn, listGuest, req, { type: 10 });
            } else {
                //create a default wishlist if there is not one
                productListHelper.getDefaultList()
            }
        }

        if (viewData.success && viewData.newCustomer && viewData.preferredStoreID && empty(viewData.newCustomer.profile.custom.preferredStoreID)) {
            dw.system.Transaction.wrap(function (){
                viewData.newCustomer.profile.custom.preferredStoreID = viewData.preferredStoreID;
            })
        }

        delete viewData.firstName;
        delete viewData.lastName;
        delete viewData.phone;
    });
    next();
});

server.append('Details', function (req, res, next) {
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData();

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    giftCertificateForm.clear();
    viewData.giftCertificateForm = giftCertificateForm;

    if(viewData.order) {
        if(!req.querystring.hasOwnProperty('orderFilter')) {
            var URLUtils = require('dw/web/URLUtils');
            viewData.exitLinkUrl = URLUtils.https('Order-History');
        }
    }

    viewData.breadcrumbs = breadcrumbHelpers.updateHomeURL(viewData);

    res.setViewData(viewData);
    next();
});

var setPasswordConstraints = function (req, res, next) {

    next();
};
server.append('Confirm', function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');

    var passwordConstraints = CustomerMgr.getPasswordConstraints();

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    giftCertificateForm.clear();

    res.setViewData({
        giftCertificateForm: giftCertificateForm,
        passwordConstraints: passwordConstraints
    });

    next();
});

module.exports = server.exports();
