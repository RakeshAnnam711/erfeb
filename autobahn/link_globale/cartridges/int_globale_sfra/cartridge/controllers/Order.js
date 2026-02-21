'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Logger = require('dw/system/Logger');

server.replace(
    'Details',
    server.middleware.get,
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
        var geOrderMgr = require('*/cartridge/scripts/factories/globale/dw/order');

        var order = OrderMgr.getOrder(req.querystring.orderID);
        if (!order) {
            order = OrderMgr.searchOrder('custom.' + globaleHelpers.customAttr.order.geOrderNumber + ' = {0}', req.querystring.orderID);
        }

        // create GE wrapper of SFCC order
        var geOrder = order ? geOrderMgr.get(order) : null;

        if (
            !order
            || (geOrder && geOrder.geIsSkipOrder())
            || !req.currentCustomer.profile
            || !order.customer
            || !order.customer.profile
            || (req.currentCustomer.profile.customerNo !== order.customer.profile.customerNo)
        ) {
            res.redirect(URLUtils.url('Account-Show'));
        } else {
            var breadcrumbs = [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                },
                {
                    htmlValue: Resource.msg('label.orderhistory', 'account', null),
                    url: URLUtils.url('Order-History').toString()
                }
            ];
            var config = {
                numberOfLineItems: '*'
            };

            var currentLocale = Locale.getLocale(req.locale.id);

            var orderModel = new OrderModel(
                order,
                { config: config, countryCode: currentLocale.country, containerView: 'order' }
            );
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
            res.render('account/orderDetails', {
                order: orderModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs
            });
        }
        next();
    }
);

server.replace(
    'Track',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');
        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
        var geOrderMgr = require('*/cartridge/scripts/factories/globale/dw/order');
        var order;
        var validForm = true;
        var target = req.querystring.rurl || 1;
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();

        if (req.form.trackOrderEmail
            && req.form.trackOrderPostal
            && req.form.trackOrderNumber) {
            order = OrderMgr.getOrder(req.form.trackOrderNumber);
            if (!order) {
                order = OrderMgr.searchOrder('custom.' + globaleHelpers.customAttr.order.geOrderNumber + ' = {0}', req.form.trackOrderNumber);
            }
        } else {
            validForm = false;
        }

        // create GE wrapper of SFCC order
        var geOrder = order ? geOrderMgr.get(order) : null;

        if (!order || (geOrder && geOrder.geIsSkipOrder())) {
            res.render('/account/login', {
                navTabValue: 'login',
                orderTrackFormError: validForm,
                profileForm: profileForm,
                userName: '',
                actionUrl: actionUrl
            });
            next();
        } else {
            var config = {
                numberOfLineItems: '*'
            };

            var currentLocale = Locale.getLocale(req.locale.id);

            var orderModel = new OrderModel(
                order,
                { config: config, countryCode: currentLocale.country, containerView: 'order' }
            );

            // check the email and postal code of the form
            if (req.form.trackOrderEmail.toLowerCase()
                !== orderModel.orderEmail.toLowerCase()) {
                validForm = false;
            }

            if (req.form.trackOrderPostal
                !== orderModel.billing.billingAddress.address.postalCode) {
                validForm = false;
            }

            if (validForm) {
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null);

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.url('Home-Show')
                    : URLUtils.https('Account-Show');

                res.render('account/orderDetails', {
                    order: orderModel,
                    exitLinkText: exitLinkText,
                    exitLinkUrl: exitLinkUrl
                });
            } else {
                res.render('/account/login', {
                    navTabValue: 'login',
                    profileForm: profileForm,
                    orderTrackFormError: !validForm,
                    userName: '',
                    actionUrl: actionUrl
                });
            }

            next();
        }
    }
);

module.exports = server.exports();
