'use strict';

/**
 * @namespace ApplePayConfig
 */

const server = require('server');

const currentSite = require('dw/system/Site').current;

const constants = require('~/cartridge/config/constants');
const preferences = require('~/cartridge/config/preferences');
const paypalHelper = require('~/cartridge/scripts/paypal/helpers');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Renders configuration template with required configurations and parameters
 */
server.get('Start', server.middleware.https, function(req, res, next) {
    const paypalUrls = require('~/cartridge/config/urls');

    res.render('button/applepay/configuration', {
        buttonStyles: preferences.buttonStyles.applePay,
        pageVisibility: paypalHelper.getPageVisibility(constants.BUTTON_LOCATIONS.slice(1), preferences.applePayButtonLocation),
        paymentMethod: paypalHelper.getPaymentMethod(constants.PAYMENT_METHOD_ID_APPLEPAY),
        buttonTypes: [
            'plain', 'book', 'add-money', 'support', 'tip', 'buy', 'top-up', 'check-out',
            'continue', 'contribute', 'donate', 'order', 'pay', 'reload', 'rent', 'set-up', 'subscribe'
        ],
        applePayButtonSdk: paypalUrls.applePaySDK,
        locale: currentSite.defaultLocale
    });

    next();
});

/**
 * Save Button configuration to Custom Preference value: PP_AP_API_Button_Styles
 *
 * success response: (status code 200) with redirect url
 * error response: (status code 500) with error message
 */
server.post('SaveButton',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        const URLUtils = require('dw/web/URLUtils');
        const Transaction = require('dw/system/Transaction');

        try {
            const params = req.httpParameterMap;
            const data = JSON.parse(preferences.buttonStyles.applePay);
            const location = params.applyToAll.booleanValue ? constants.ALL_LOCATIONS : params.location.value;

            paypalHelper.setStylesForEnabledLocations(data, {
                hm: params,
                styles: {
                    buttonStyle: params.buttonStyle.value,
                    type: params.type.value
                },
                alwaysVisiblePages: { billing: true },
                locations: constants.BUTTON_LOCATIONS,
                customPreference: preferences.applePayButtonLocation
            });

            Transaction.wrap(function() {
                currentSite.setCustomPreferenceValue('PP_AP_API_Button_Styles', JSON.stringify(data));
            });

            res.json({
                redirectUrl: URLUtils.https('Configuration-Start', 'tab', 'apple-pay', 'location', location).toString()
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 500);
        }

        next();
    }
);

module.exports = server.exports();
