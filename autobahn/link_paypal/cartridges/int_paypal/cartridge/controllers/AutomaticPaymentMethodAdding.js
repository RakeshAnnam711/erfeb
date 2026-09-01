'use strict';

const server = require('server');

const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');

const middleware = require('*/cartridge/scripts/paypal/middleware');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const CustomerModel = require('*/cartridge/models/customer');
const connectWithPaypalHelper = require('*/cartridge/scripts/paypal/helpers/connectWithPaypalHelper');

server.get('Show',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function(req, res, next) {
        const paypalConstants = require('*/cartridge/config/constants');
        const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');
        const prefs = require('*/cartridge/config/preferences');
        const paypalSDK = require('*/cartridge/config/sdk');

        if (!req.querystring.redirectURL || !req.querystring.addressObject) {
            res.redirect(URLUtils.url(paypalConstants.ENDPOINT_HOME_SHOW));

            return next();
        }

        const customerInstance = new CustomerModel(customer);
        const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
        const customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(paypalConstants.PAYMENT_METHOD_ID_PAYPAL);
        const hasVaulting = !!customerSavedPaypalAccounts.length;
        const addressObjectString = decodeURIComponent(req.querystring.addressObject);

        const addressValidation = {
            error: false
        };

        if (addressObjectString) {
            const addressObject = JSON.parse(addressObjectString);
            const payload = {
                firstName: addressObject.firstName,
                lastName: addressObject.lastName,
                phone: addressObject.phone,
                shippingAddress: {
                    city: addressObject.city,
                    countryCode: addressObject.countryCode,
                    state: addressObject.stateCode,
                    line1: addressObject.address1,
                    postalCode: addressObject.postalCode
                }
            };

            Object.assign(addressValidation, addressHelper.validateShippingAddressForm(payload));
        }

        const hasAddress = customerInstance.hasAddress(JSON.parse(addressObjectString));

        if (!customerInstance.isEnabledFeatureAPMA()
        || (hasVaulting && hasAddress)
        || addressValidation.error
        || (hasAddress && !prefs.paypalVaultModeEnabled)) {
            res.redirect(req.querystring.redirectURL);

            return next();
        }

        let addingStage = paypalConstants.APMA_STAGE_COMPLETE;

        if (hasVaulting || !prefs.paypalVaultModeEnabled) {
            addingStage = paypalConstants.APMA_STAGE_ADDRESS;
        }

        if (hasAddress && prefs.paypalVaultModeEnabled) {
            addingStage = paypalConstants.APMA_STAGE_ACCOUNT;
        }

        res.render('paypal/apma/automaticPaymentMethodAdding', {
            paypal: {
                sdkUrl: paypalSDK.accountSDKUrl,
                partnerAttributionId: prefs.partnerAttributionId
            },
            addingStage: addingStage,
            addressObject: addressObjectString,
            redirectURL: req.querystring.redirectURL
        });

        return next();
    }
);

server.post('SavePaypalDefaultAddress',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    middleware.parseBody,
    function(req, res, next) {
        const Resource = require('dw/web/Resource');
        const customerInstance = new CustomerModel(customer);
        const utils = require('*/cartridge/scripts/paypal/utils');

        try {
            // Creates a customer address from the address provided by 'Connect with PayPal' feature
            Transaction.wrap(function() {
                customerInstance.addAddress(res.parsedBody.addressObject);
            });

            const StringUtils = require('dw/util/StringUtils');

            const resourceContext = res.parsedBody.isAccountPage ? 'account' : 'checkout';

            Transaction.wrap(function() {
                const resource = StringUtils.format('paypal.{0}.shippingaddressadded.notification.msg', resourceContext);

                customerInstance.addFlashMessage(Resource.msg(resource, 'locale', null), CustomerModel.FLASH_MESSAGE_SUCCESS);
            });
        } catch (err) {
            Transaction.wrap(function() {
                const resource = 'paypal.account.shippingaddressnotadded.notification.msg';

                customerInstance.addFlashMessage(Resource.msg(resource, 'locale', null), CustomerModel.FLASH_MESSAGE_DANGER);
            });

            utils.createErrorLog(err);
        }

        res.json({});

        return next();
    }
);

server.get('RenderAccountLinkingSecurityLayer',
    server.middleware.https,
    csrfProtection.generateToken,
    function(req, res, next) {
        const payPalCustomerInfo = req.querystring.payPalCustomerInfo ? JSON.parse(decodeURIComponent(req.querystring.payPalCustomerInfo)) : null;
        const isCanceled = req.querystring.isCancel ? JSON.parse(decodeURIComponent(req.querystring.isCancel)) : false;

        if (isCanceled) {
            res.render('paypal/apma/cancelLinking', {
                redirectUrl: URLUtils.url('Login-Show').toString()
            });

            return next();
        }

        if (!payPalCustomerInfo) {
            res.setStatusCode(404);

            res.render('/error/notFound');

            return next();
        }

        const config = connectWithPaypalHelper.getAccountLinkingSecurityLayerConfig(payPalCustomerInfo);

        res.render('paypal/apma/linkAccountSecurityLayer', config);

        return next();
    }
);

server.post('HandleAccountLinkingSecurityLayer',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    middleware.parseBody,
    function(req, res, next) {
        const utils = require('*/cartridge/scripts/paypal/utils');

        try {
            const payPalCustomerInfo = req.querystring.payPalCustomerInfo ? JSON.parse(decodeURIComponent(req.querystring.payPalCustomerInfo)) : null;
            const isCanceled = req.querystring.isCancel ? JSON.parse(decodeURIComponent(req.querystring.isCancel)) : false;

            if (isCanceled) {
                res.json({
                    redirectUrl: URLUtils.url('AutomaticPaymentMethodAdding-RenderAccountLinkingSecurityLayer', 'isCancel', isCanceled).toString()
                });

                return next();
            }

            const nextStep = connectWithPaypalHelper.handleAccountLinkingSecurityLayerFlow(req, payPalCustomerInfo);

            if (nextStep.error) {
                res.json({
                    error: nextStep.errorMsg
                });

                return next();
            }

            res.json({
                redirectUrl: nextStep.nextStepUrl.toString()
            });
        } catch (err) {
            res.render('/error', {
                message: err
            });

            utils.createErrorLog(err);
        }

        return next();
    }
);

module.exports = server.exports();
