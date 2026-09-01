'use strict';

const server = require('server');

server.post('RemovePayPalCustomer', server.middleware.https, function(req, res, next) {
    const Resource = require('dw/web/Resource');
    const Transaction = require('dw/system/Transaction');
    const CustomerMgr = require('dw/customer/CustomerMgr');
    const AgentUserMgr = require('dw/customer/AgentUserMgr');

    const utils = require('*/cartridge/scripts/paypal/utils');
    const constants = require('*/cartridge/config/constants');
    const preferences = require('*/cartridge/config/preferences');

    const token = utils.encodeString({
        PP_CWPP_Agent_Login: preferences.PP_CWPP_Agent_Login,
        PP_CWPP_Agent_Password: preferences.PP_CWPP_Agent_Password,
        PP_CWPP_Key: 'MergeAccountsPayPalAndSingleAuthentication'
    });

    const authorization = req.httpHeaders.get('authorization');

    if (authorization.indexOf(token) === -1) {
        res.setStatusCode(500);
        res.json({ status: false, message: utils.createErrorMsg('invalid_token') });

        return next();
    }

    const profile = JSON.parse(req.body);

    try {
        const externalProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
            constants.AUTHENTICATION_PAYPAL_PROVIDER_ID,
            profile.externalID
        );

        if (externalProfile) {
            if (AgentUserMgr.loginAgentUser(preferences.PP_CWPP_Agent_Login, preferences.PP_CWPP_Agent_Password).error) {
                throw Resource.msg('paypal.error.wrong.login.agent.user', 'paypalerrors', null);
            }

            if (AgentUserMgr.loginOnBehalfOfCustomer(externalProfile.customer).error) {
                throw Resource.msg('paypal.error.wrong.login.on.behalf.of.customer', 'paypalerrors', null);
            }

            Transaction.wrap(function() {
                CustomerMgr.removeCustomer(externalProfile.customer);
            });
        }
    } catch (error) {
        utils.createErrorLog(error);

        res.setStatusCode(500);
        res.json({ status: false, message: utils.createErrorMsg('remove_customers') });

        return next();
    }

    res.setStatusCode(200);
    res.json({ status: true, message: Resource.msg('paypal.checkout.paypalaccountlist.remove.success', 'locale', null) });

    return next();
});

module.exports = server.exports();
