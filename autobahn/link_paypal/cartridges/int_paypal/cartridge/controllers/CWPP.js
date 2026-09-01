'use strict';

const server = require('server');

const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

const cache = require('*/cartridge/scripts/middleware/cache');
const middleware = require('*/cartridge/scripts/paypal/middleware');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

const utils = require('*/cartridge/scripts/paypal/utils');
const connectWithPaypalHelper = require('*/cartridge/scripts/paypal/helpers/connectWithPaypalHelper');

server.get('Render', server.middleware.include, cache.applyDefaultCache, function(req, res, next) {
    const config = connectWithPaypalHelper.getBtnConfig(req);

    res.render('/paypal/components/cwppButton', config);

    next();
});

server.get('Connect',
    server.middleware.https,
    middleware.validateConnectWithPaypalUrl,
    function(req, res, next) {
        try {
            const paypalApi = require('*/cartridge/scripts/paypal/api');
            // Gets the access token according to the authentication code
            const accessToken = paypalApi.exchangeAuthCodeForAccessToken(req.httpParameterMap.code.value);
            // Gets the Paypal customer information according to the access token
            const payPalCustomerInfo = paypalApi.getPaypalCustomerInfo(accessToken);

            const nextStepUrl = connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo);

            res.redirect(nextStepUrl);
        } catch (err) {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });

            utils.createErrorLog(err);
        }

        next();
    }
);

server.post('Unlink',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const CustomerModel = require('*/cartridge/models/customer');
        const customerInstance = new CustomerModel(customer);

        try {
            Transaction.wrap(function() {
                customerInstance.setIsExternalProfile(false);
            });

            customerInstance.sendUnlinkedAccountConfirmationEmail();
        } catch (err) {
            utils.createErrorLog(err);

            res.setStatusCode(400);
            res.json({
                errorMessage: Resource.msg('paypal.error.general', 'paypalerrors', null)
            });

            return next();
        }

        res.json({
            alertMessage: Resource.msg('label.unlink.notification', 'account', null)
        });

        return next();
    }
);

module.exports = server.exports();
