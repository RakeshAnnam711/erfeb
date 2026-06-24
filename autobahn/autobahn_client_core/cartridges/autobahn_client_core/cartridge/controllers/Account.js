'use strict';

var server = require('server');
server.extend(module.superModule);
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var CustomerMgr = require('dw/customer/CustomerMgr');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var BasketMgr = require("dw/order/BasketMgr");
var Transaction = require('dw/system/Transaction');


server.prepend('PasswordReset', server.middleware.https, function (req, res, next) {
    var canonicalUrl = URLUtils.abs('Account-PasswordReset').toString();
    if (!req.form.token) {
        res.redirect(URLUtils.url('Error-Start'));
        Logger.error('Account Token not present in request');
    }
    res.setViewData({
        canonicalUrl: canonicalUrl
    });
    next();
});

server.prepend('SubmitRegistration', function (req, res, next) {
    var registrationForm = server.forms.getForm('profile');

    // Ensure email and password always match
    registrationForm.customer.emailconfirm.value = registrationForm.customer.email.value.toLowerCase();
    registrationForm.login.passwordconfirm.value = registrationForm.login.password.value;

    next();
});

server.append('SubmitRegistration',
    function (req, res, next) {
        var emailSubscribeHelpers = require('*/cartridge/scripts/helpers/EmailSubscribeHelpers');
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        // var Transaction = require('dw/system/Transaction');
        var registrationForm = server.forms.getForm('profile');
        var addtoemaillist = registrationForm.customer.addtoemaillist.value;
        var UUIDUtils = require('dw/util/UUIDUtils');
        try {
            if (addtoemaillist == true) {
                Transaction.wrap(function () {
                    try {
                        // var createNewsletterSubscriber = CustomObjectMgr.createCustomObject('NewsletterSubscriber', registrationForm.customer.email.value);
                        var uuid = UUIDUtils.createUUID();
                        var co = CustomObjectMgr.createCustomObject(
                            'ZetaNewsletterSubscriber', 
                            uuid
                        );
                        co.custom.Email = registrationForm.customer.email.value;
                        co.custom.source = 'web_signup';
                    } catch (error) {
                        Logger.error('Error creating NewsletterSubscriber custom object: {0}', error.message);
                    }
                });
                var email = registrationForm.customer.email.value;
                var response = emailSubscribeHelpers.subscribeMail(email);
                res.json({
                    subscribeToMail: response
                });
            }
        } catch(e) {
            Logger.error('Subscribe email error: {0}', e.message);
        }
    next();
});

server.post('UpdateUserFromMakeAnOffer', function (req, res, next) {
    try {
        // check if user is authenticated
        if(req.currentCustomer.profile == null){
            res.json({
                success: false,
                message: 'User is not authenticated!'
            });
            return next();
        }

        var phoneNumber = req.form.phoneNumber;

        if (!phoneNumber) {
            res.json({ success: false, message: 'Phone number is required.' });
            return next();
        }

        // Fetch customer profile
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var profile = customer.getProfile();

        if (!profile) {
            res.json({ success: false, message: 'Customer profile not found.' });
            return next();
        }

        Transaction.wrap(function () {
            profile.setPhoneHome(phoneNumber);
        });

        res.json({ success: true, message: 'User profile updated.' });
    } catch (e) {
        Logger.error('Phone update error: {0}', e.message);
        res.json({ success: false, message: 'Server error occurred.' + e.message });
    }

    return next();
});

server.get('GetUserForProductOffer', function (req, res, next) {
    var customerProfile = req.currentCustomer.profile;

    // check if offer made against this product for customer
    var enableOffer = true;
    if(customerProfile != null){
        var existingOffer = CustomObjectMgr.getCustomObject('MakeAnOffer', customerProfile.customerNo);
        if (existingOffer) {
            var productList = null;
            if(existingOffer.custom.productID){
                productList = existingOffer.custom.productID.split('|').map(function(item) {
                    return item.trim();
                });
            }
            if(productList && productList.indexOf(req.querystring.product_id) !== -1){
                enableOffer = false;
            }
        }
    }

    if (customerProfile) {
        res.json({
            success: true,
            firstName: customerProfile.firstName,
            lastName: customerProfile.lastName,
            phone: customerProfile.phone,
            email: customerProfile.email,
            customerNo: customerProfile.customerProfile,
            enableOffer: enableOffer,
            message: ""
        });
    } else {
        res.json({
            success: false,
            message: 'User not logged in'
        });
    }

    return next();
});

// Merge guest basket into registered user's basket upon login from Account option
server.append("Login", function (req, res, next) {
    Transaction.begin();
    try {
        if (res.viewData.success) {
             // the (transferred) basket from the previous guest shopper
             var currentBasket = BasketMgr.getCurrentBasket();
     
             // the basket from the registered shopper which was attached before the login
             var storedBasket = BasketMgr.getStoredBasket();
     
             if (storedBasket || currentBasket) {
                dw.system.HookMgr.callHook("dw.order.mergeBasket", "mergeBasket", storedBasket, currentBasket);
             }
        }
        Transaction.commit();
    } catch (error) {
        Transaction.rollback();
        Logger.error('Error during basket merge after account-login: {0}', error.message);
    }
  return next();
});

module.exports = server.exports();
