'use strict';

/**
 * @namespace GooglePayConfig
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

    res.render('button/googlepay/configuration', {
        payPalSDK: paypalUrls.payPalSDK,
        googlePayButtonSdk: paypalUrls.googlePaySDK,
        buttonStyles: preferences.buttonStyles.googlePay,
        paymentMethod: paypalHelper.getPaymentMethod(constants.PAYMENT_METHOD_ID_GOOGLE_PAY),
        pageVisibility: paypalHelper.getPageVisibility(constants.BUTTON_LOCATIONS.slice(1), preferences.googlePayButtonLocation)
    });

    next();
});

/**
 * Save Button configuration to Custom Preference value: PP_Google_Pay_Button_Styles
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
            const params = request.httpParameterMap;
            const data = JSON.parse(preferences.buttonStyles.googlePay);
            const location = params.applyToAll.booleanValue ? constants.ALL_LOCATIONS : params.location.value;

            paypalHelper.setStylesForEnabledLocations(data, {
                hm: params,
                styles: {
                    buttonColor: params.buttonColor.value,
                    buttonType: params.buttonType.value,
                    buttonRadius: params.buttonRadius.value,
                    buttonSizeMode: params.buttonSizeMode.value
                },
                locations: constants.BUTTON_LOCATIONS,
                alwaysVisiblePages: { billing: true },
                customPreference: preferences.googlePayButtonLocation
            });

            Transaction.wrap(function() {
                currentSite.setCustomPreferenceValue('PP_Google_Pay_Button_Styles', JSON.stringify(data));
            });

            res.json({
                redirectUrl: URLUtils.https('Configuration-Start', 'tab', 'google-pay', 'location', location).toString()
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 500);
        }

        next();
    }
);

module.exports = server.exports();
