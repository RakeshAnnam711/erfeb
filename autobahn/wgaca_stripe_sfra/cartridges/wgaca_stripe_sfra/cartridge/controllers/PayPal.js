'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var UUIDUtils = require('dw/util/UUIDUtils');

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var prefs = require('*/cartridge/config/preferences');
var paypalConstants = require('*/cartridge/config/constants');
var customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
var paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
var paypalApi = require('*/cartridge/scripts/paypal/api');
var paypalRestService = require('*/cartridge/scripts/service/paypalREST');
var utils = require('*/cartridge/scripts/paypal/utils');

server.extend(module.superModule);

function createPaymentTokenSafe(tokenId, tokenType, payPalCustomerId) {
    var body = {
        payment_source: {
            token: {
                id: tokenId,
                type: tokenType
            }
        }
    };

    if (payPalCustomerId) {
        body.customer = {
            id: payPalCustomerId
        };
    }

    try {
        return paypalRestService.call({
            path: 'v3/vault/payment-tokens',
            method: 'POST',
            body: body,
            paypalRequestId: UUIDUtils.createUUID()
        });
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

server.replace('CreateSetupTokenForPaypal',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        var paypalUrls = require('*/cartridge/config/urls');

        var preparedForm = {
            permit_multiple_payment_tokens: true,
            usage_type: 'MERCHANT',
            customer_type: 'CONSUMER',
            experience_context: {
                brand_name: prefs.merchantName,
                return_url: paypalUrls.renderAccountsUrl,
                cancel_url: paypalUrls.renderAccountsUrl,
                shipping_preference: 'GET_FROM_FILE',
                locale: 'en-US',
                vault_instruction: 'ON_CREATE_PAYMENT_TOKENS'
            }
        };

        var body = {
            payment_source: {
                paypal: preparedForm
            }
        };

        var setupTokenResponse = paypalApi.createSetupToken(body);

        if (setupTokenResponse.err) {
            res.json({
                error: true,
                message: setupTokenResponse.err
            });

            res.setStatusCode(400);

            return next();
        }

        res.json({
            error: false,
            setupToken: setupTokenResponse.id
        });

        session.privacy.setupTokenId = setupTokenResponse.id;
        session.privacy.setupTokenCustomerId = setupTokenResponse.customer
            ? setupTokenResponse.customer.id
            : (customer.profile.custom.payPalCustomerId || null);

        return next();
    }
);

server.replace('AccountAddPaypalHandler',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        var customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(paypalConstants.PAYMENT_METHOD_ID_PAYPAL);
        var isSaveLimitReached = prefs.paypalAccountVaultLimit !== paypalConstants.SAVE_LIMIT_UNLIMITED
            && prefs.paypalAccountVaultLimit <= customerSavedPaypalAccounts.length;
        var setupTokenId = req.httpParameterMap.setupTokenId.stringValue || session.privacy.setupTokenId;
        var setupTokenCustomerId = req.httpParameterMap.setupTokenCustomerId.stringValue || session.privacy.setupTokenCustomerId;

        if (isSaveLimitReached) {
            var paypalAccountLimitMessage = Resource.msg('paypal.accountslist.vaultlimitreached', 'locale', null);

            res.json({
                error: true,
                message: paypalAccountLimitMessage
            });

            res.setStatusCode(400);

            return next();
        }

        if (!setupTokenId) {
            res.json({
                error: true,
                message: Resource.msg('error.technical', 'checkout', null)
            });

            res.setStatusCode(400);

            return next();
        }

        var payPalCustomerId = setupTokenCustomerId || customer.profile.custom.payPalCustomerId;
        var paymentTokenResponse = createPaymentTokenSafe(
            setupTokenId,
            paypalConstants.SETUP_TOKEN_TYPE,
            payPalCustomerId
        );

        if (paymentTokenResponse.err) {
            res.json({
                error: true,
                message: paymentTokenResponse.err
            });

            res.setStatusCode(400);

            return next();
        }

        if (paymentTokenResponse.payment_source && paymentTokenResponse.payment_source.paypal) {
            paymentTokenResponse.payment_source.paypal.address = paymentTokenResponse.payment_source.paypal.address || {};
            paymentTokenResponse.payment_source.paypal.name = paymentTokenResponse.payment_source.paypal.name || {};
        }

        paymentTokenResponse.customer = paymentTokenResponse.customer || { id: payPalCustomerId || null };

        var result = paypalHelper.savePaypalToCustomerWallet(paymentTokenResponse);

        if (result.error) {
            res.json({
                error: true,
                message: result.msg,
                renderAccountsUrl: require('*/cartridge/config/urls').renderAccountsUrl
            });

            return next();
        }

        if (req.httpParameterMap.isAPMA.booleanValue) {
            var CustomerModel = require('*/cartridge/models/customer');
            var customerInstance = new CustomerModel(customer);

            Transaction.wrap(function() {
                customerInstance.addFlashMessage(
                    Resource.msg('paypal.account.paymentmethodadded.notification.msg', 'locale', null),
                    CustomerModel.FLASH_MESSAGE_SUCCESS
                );
            });
        }

        delete session.privacy.setupTokenId;
        delete session.privacy.setupTokenCustomerId;

        res.json({
            error: false,
            renderPayPalAccountsUrl: require('*/cartridge/config/urls').renderPayPalAccountsUrl
        });

        return next();
    }
);

module.exports = server.exports();
