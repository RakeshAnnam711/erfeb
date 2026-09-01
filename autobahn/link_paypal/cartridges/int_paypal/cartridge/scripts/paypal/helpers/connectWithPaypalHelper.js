'use strict';

const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');

const paypalPreferences = require('*/cartridge/config/preferences');
const paypalConstants = require('*/cartridge/config/constants');
const accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

/**
 * Create config object for the button
 * @param {Object} req request object
 * @returns {Object} config object
 */
function getBtnConfig(req) {
    const buttonConfigHelper = require('~/cartridge/scripts/paypal/helpers/buttonConfigHelper');

    const locations = { 1: 'login', 2: 'billing' };
    const oAuthReentryEndpoint = req.querystring.oauthLoginTargetEndPoint;
    const currentFlow = locations[oAuthReentryEndpoint];

    session.custom.oauthLoginTargetEndPoint = oAuthReentryEndpoint;

    const cwppButtonParameters = buttonConfigHelper.createCwppButtonConfig(currentFlow);

    // Fixed "Authorization code not found in cache" for session login user
    cwppButtonParameters.prompt = 'login';

    return {
        CWPPButtonEnabled: paypalPreferences.isCWPPEnabled,
        CWPPSdkLink: paypalPreferences.payPalExternalApiSdk,
        CWPPButtonParameters: JSON.stringify(cwppButtonParameters)
    };
}

/**
 * Handle main CwPP flow
 * @param  {Object} req request object
 * @param  {Object} payPalCustomerInfo object with customer information
 * @returns {string} redirect url for the next step
 */
function handleConnectWithPaypalFlow(req, payPalCustomerInfo) {
    const AgentUserMgr = require('dw/customer/AgentUserMgr');
    const Transaction = require('dw/system/Transaction');
    const BasketMgr = require('dw/order/BasketMgr');

    const loginPayPalAddressHelper = require('*/cartridge/scripts/paypal/helpers/loginPayPalAddressHelper');
    const CustomerModel = require('*/cartridge/models/customer');

    if (!payPalCustomerInfo) {
        throw Resource.msg('paypal.error.invalid.customer.info', 'paypalerrors', null);
    }

    if (!payPalCustomerInfo.emailConfirmed) {
        throw Resource.msg('paypal.error.email.unconfirmed', 'paypalerrors', null);
    }

    const customerEmail = payPalCustomerInfo.email;

    let newlyRegisteredUser = false;
    let customerInstance = CustomerModel.get(customerEmail);

    if (!customerInstance) {
        Transaction.wrap(function() {
            customerInstance = CustomerModel.create(customerEmail);
            customerInstance.setEmail(customerEmail);
            customerInstance.setIsExternalProfile(true);
            customerInstance.setFirstName(payPalCustomerInfo.firstName);
            customerInstance.setLastName(payPalCustomerInfo.lastName);
            customerInstance.setPhone(Resource.msg('paypal.account.address.phonenumber.notprovided', 'locale', null));

            customerInstance.sendRegistrationEmail();
            newlyRegisteredUser = true;
        });
    } else if (paypalPreferences.accountLinkingSecurityLayerEnabled
            && !customerInstance.isExternalProfile()
            && !payPalCustomerInfo.isPassedAccountLinkingSecurityLayer) {
        // Account Linking Security Layer flow

        return URLUtils.url('AutomaticPaymentMethodAdding-RenderAccountLinkingSecurityLayer', 'payPalCustomerInfo',
            encodeURIComponent(JSON.stringify(payPalCustomerInfo)));
    }

    if (CustomerModel.externalProfileExist(customerEmail)) {
        Transaction.wrap(function() {
            customerInstance.addFlashMessage(Resource.msg('account.legacy', 'notifications', null),
                CustomerModel.FLASH_MESSAGE_INFO);
        });
    }

    if (!customerInstance.isExternalProfile()) {
        customerInstance.sendLinkedAccountConfirmationEmail();

        Transaction.wrap(function() {
            customerInstance.setIsExternalProfile(true);
            customerInstance.addFlashMessage(Resource.msg('account.exists', 'notifications', null),
                CustomerModel.FLASH_MESSAGE_INFO);
        });
    }

    const requestLocale = request.getLocale();

    const guestBasket = BasketMgr.getCurrentBasket();

    // oAuth reentry endpoint (Account - 1 or Checkout - 2)
    const oauthReentryEndpoint = session.custom.oauthLoginTargetEndPoint;

    if (session.customerAuthenticated) {
        AgentUserMgr.logoutAgentUser();
    }

    if (AgentUserMgr.loginAgentUser(paypalPreferences.PP_CWPP_Agent_Login, paypalPreferences.PP_CWPP_Agent_Password).error) {
        throw Resource.msg('paypal.error.wrong.login.agent.user', 'paypalerrors', null);
    }

    if (AgentUserMgr.loginOnBehalfOfCustomer(customerInstance.dw).error) {
        throw Resource.msg('paypal.error.wrong.login.on.behalf.of.customer', 'paypalerrors', null);
    }

    if (!customerInstance.getPreferredLocale()) {
        request.setLocale(requestLocale);
    }

    if (guestBasket) {
        Transaction.wrap(function() {
            customerInstance.restoreBasket(guestBasket);
        });
    }

    const redirectURL = accountHelpers.getLoginRedirectURL(oauthReentryEndpoint,
        req.session.privacyCache,
        newlyRegisteredUser) + '&isAPMAFlow=true';

    // Automatic payment method adding flow
    if (paypalPreferences.automaticPmAddingEnabled && customerInstance.isEnabledFeatureAPMA()) {
        return URLUtils.url(paypalConstants.ENDPOINT_APMA_SHOW,
            'redirectURL',
            redirectURL,
            'addressObject',
            encodeURIComponent(JSON.stringify(loginPayPalAddressHelper.getAddressObjectFromPayPal(payPalCustomerInfo))));
    }

    return redirectURL;
}

/**
 * Creates a config object for the Account Linking Security Layer page
 * @param  {Object} payPalCustomerInfo object with customer information
 * @returns {Object} config object
 */
function getAccountLinkingSecurityLayerConfig(payPalCustomerInfo) {
    const actionUrl = URLUtils.url('AutomaticPaymentMethodAdding-HandleAccountLinkingSecurityLayer',
        'payPalCustomerInfo',
        encodeURIComponent(JSON.stringify(payPalCustomerInfo)));

    return {
        actionUrl: actionUrl,
        paypal: {
            payPalEmail: payPalCustomerInfo.email,
            payPalCustomerInfo: JSON.stringify(payPalCustomerInfo)
        }
    };
}

/**
 * Handle Account Linking Security Layer flow
 * @param  {Object} req request object
 * @param  {Object} payPalCustomerInfo object with customer information
 * @returns {Object} with next step url
 */
function handleAccountLinkingSecurityLayerFlow(req, payPalCustomerInfo) {
    const email = req.form.loginEmail;
    const password = req.form.loginPassword;

    const customerLoginResult = accountHelpers.loginCustomer(email, password, false);

    if (customerLoginResult.error) {
        return {
            error: true,
            errorMsg: [customerLoginResult.errorMessage || Resource.msg('error.message.login.form', 'login', null)]
        };
    }

    Object.assign(payPalCustomerInfo, { isPassedAccountLinkingSecurityLayer: true });

    return {
        error: false,
        nextStepUrl: handleConnectWithPaypalFlow(req, payPalCustomerInfo)
    };
}

/**
 * Handles the login process when a PayPal address is associated with the account.
 * @param {Object} res - The response object containing view data related to the customer account.
 */
function handleAddressOnAccountPage(res) {
    const loginPayPalAddressHelper = require('*/cartridge/scripts/paypal/helpers/loginPayPalAddressHelper');

    delete session.custom.oauthLoginTargetEndPoint;

    const lippAddress = customer.addressBook ? loginPayPalAddressHelper.getCWPPCustomerAddress() : null;

    // Updates a customer address from 'Connect with paypal feature' (LIPP-login-PayPal) with phone number
    // as 'Not Provided' in case if phone === null
    if (lippAddress && lippAddress.phone === null) {
        loginPayPalAddressHelper.savePhoneNumberInCWPPAddress(lippAddress,
            Resource.msg('paypal.account.address.phonenumber.notprovided', 'locale', null));

        res.viewData.account.addresses.forEach(function(address) {
            if (address.ID === lippAddress.ID) {
                address.phone = lippAddress.phone;
            }
        });

        if (res.viewData.account.preferredAddress.address.ID === lippAddress.ID) {
            res.viewData.account.preferredAddress.address.phone = lippAddress.phone;
        }
    }
}

module.exports = {
    getBtnConfig: getBtnConfig,
    handleAddressOnAccountPage: handleAddressOnAccountPage,
    handleConnectWithPaypalFlow: handleConnectWithPaypalFlow,
    getAccountLinkingSecurityLayerConfig: getAccountLinkingSecurityLayerConfig,
    handleAccountLinkingSecurityLayerFlow: handleAccountLinkingSecurityLayerFlow
};
