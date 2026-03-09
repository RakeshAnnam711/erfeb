'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var recaptcha = require('*/cartridge/scripts/middleware/recaptcha');

var setPasswordConstraints = function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var passwordConstraints = CustomerMgr.getPasswordConstraints();

    res.setViewData({
        passwordConstraints: passwordConstraints
    });

    next();
};

server.append('Show',
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var canonicalUrl = URLUtils.abs('Account-Show').toString();
        var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
        var viewData = res.getViewData();

        res.setViewData({
            canonicalUrl: canonicalUrl,
            breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
        });

        if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
            var accountModel = res.viewData.account;
            var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
            var wishListAccount = require('*/cartridge/models/account/wishListAccount');
            var wishListType = require('dw/customer/ProductList').TYPE_WISH_LIST;
            var apiWishList = productListHelper.getList(req.currentCustomer.raw, {
                type: wishListType
            });

            var defaultList = productListHelper.getDefaultList();
            var allLists = productListHelper.getLists(customer, {type: wishListType});

            // WGACA MODIFICATION
            // look for wishlist items that no longer exist (product has been deleted)
            var wishListItemsToRemove = [];
            for(var i = 0; i < apiWishList.items.length; i++) {
                if(empty(apiWishList.items[i].product)) {
                    wishListItemsToRemove.push(apiWishList.items[i])
                }
            }
            //remove any non-existant wishlist items from the list
            for(var i = 0; i < wishListItemsToRemove.length; i++) {
                apiWishList.removeItem(wishListItemsToRemove[i]);
            }
            // END MODIFICATION

            wishListAccount(accountModel, apiWishList);

            var wishlist = {
                UUID: apiWishList.ID
            };

            res.setViewData({
                wishlist: wishlist,
                defaultList: defaultList,
                allLists: allLists
            });
        }

        next();
    }
);

server.append('DoSetNewPassword', setPasswordConstraints);

server.append('EditPassword', setPasswordConstraints);

server.prepend('Login',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    recaptcha.checkRecaptchaAjax,
    function (req, res, next) {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
        var viewData = res.getViewData();
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        // grab old wishlist if it exists
        var deprecatedWishlist = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
        var wishlistList = productListHelper.getDefaultList(deprecatedWishlist ? deprecatedWishlist : '');
        viewData.wishlistList = wishlistList;
        res.setViewData(viewData);
    }

    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    storeHelpers.setPreferredStoreViewData(req, res);

    next();
});

server.append('Login',
    function (req, res, next) {
    var viewData = res.getViewData();
    var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {

        var listGuest = viewData.wishlistList;
        if (viewData.authenticatedCustomer && listGuest.items.length) {
            var listLoggedIn = productListHelper.getDefaultList();
            productListHelper.mergelists(listLoggedIn, listGuest, req, { type: 10 });
        } else {
            //create a default wishlist if there is not one
            productListHelper.getDefaultList()
        }
    }

    if (viewData.authenticatedCustomer && viewData.preferredStoreID && empty(viewData.authenticatedCustomer.profile.custom.preferredStoreID)) {
        dw.system.Transaction.wrap(function (){
            viewData.authenticatedCustomer.profile.custom.preferredStoreID = viewData.preferredStoreID;
        })
    }

    // if theres a referer, redirect back to that page, otherwise go to Account-Login
    if (viewData.authenticatedCustomer && session.custom.redirectString) {

        // handle wishlist redirects where guest user's wishlist ID doesn't match authenticated customer's
        session.custom.redirectString = productListHelper.updateWishlistDetailRedirectUrl(session.custom.redirectString);

        res.setViewData({
            redirectUrl: session.custom.redirectString
        });
    }

    next();
});

server.prepend('SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    recaptcha.checkRecaptchaAjax,
    function (req, res, next) {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
        var viewData = res.getViewData();
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        var wishlistList = productListHelper.getDefaultList();
        viewData.wishlistList = wishlistList;
        res.setViewData(viewData);
    }

    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    storeHelpers.setPreferredStoreViewData(req, res);

    next();
});

server.append('SubmitRegistration',
    function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
            var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
            var listGuest = viewData.wishlistList;
            if (viewData.authenticatedCustomer && listGuest.items.length) {
                var listLoggedIn = productListHelper.getDefaultList();
                productListHelper.mergelists(listLoggedIn, listGuest, req, { type: 10 });
            } else {
                //create a default wishlist if there is not one
                productListHelper.getDefaultList()
            }
        }
        if (viewData.authenticatedCustomer && viewData.preferredStoreID && empty(viewData.authenticatedCustomer.profile.custom.preferredStoreID)) {
            dw.system.Transaction.wrap(function (){
                viewData.authenticatedCustomer.profile.custom.preferredStoreID = viewData.preferredStoreID;
            })
        }
    });
    next();
});

server.append('EditPassword', function (req, res, next) {
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData();

    res.setViewData({
        breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
    });
    next();
});

server.prepend('SavePassword', server.middleware.https, csrfProtection.validateAjaxRequest, recaptcha.checkRecaptchaAjax);

server.append('SavePassword', setPasswordConstraints, function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) {
        if (res.viewData.success) {
            var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            accountHelpers.sendPasswordChangeEmail(customer.profile.email);
        }
    });
    next();
});

server.append('SaveNewPassword', setPasswordConstraints, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customer = CustomerMgr.getCustomerByToken(res.viewData.token);
    if (customer && customer.profile) {
        res.viewData.customerEmail = customer.profile.email
        this.on('route:BeforeComplete', function (req, res) {
            if (res.redirectUrl) {
                // base sfra controller only indicates success with a redirect to Login-Show
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                res.viewData.success = true;
                accountHelpers.sendPasswordChangeEmail(res.viewData.customerEmail);
            }
        });
    }
    next();
});

server.append('EditProfile', function (req, res, next) {
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData();

    res.setViewData({
        breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
    });
    next();
});

server.prepend('SaveProfile', server.middleware.https, csrfProtection.validateAjaxRequest, recaptcha.checkRecaptchaAjax);

server.prepend('PasswordResetDialogForm', server.middleware.https, recaptcha.checkRecaptchaAjax);

module.exports = server.exports();
