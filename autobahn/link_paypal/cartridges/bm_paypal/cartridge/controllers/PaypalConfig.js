'use strict';

/**
 * @namespace PayPalConfig
 */

const server = require('server');

const currentSite = require('dw/system/Site').current;
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');

const constants = require('~/cartridge/config/constants');
const preferences = require('~/cartridge/config/preferences');
const paypalHelper = require('~/cartridge/scripts/paypal/helpers');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * @param {string} location - Location name
 * @param {string} section - Section name for PayPal tab
 * @returns {string} - URL for configuration endpoint
 */
function getRedirectUrl(location, section) {
    return URLUtils.https('Configuration-Start', 'tab', 'paypal', 'section', section, 'location', location).toString();
}

/**
 * Renders configurationBoard template with required configurations and parameters
 */
server.get('Start', server.middleware.https, function(req, res, next) {
    const paymentMethodVenmo = paypalHelper.getPaymentMethod(constants.PAYMENT_METHOD_ID_VENMO);
    const paymentMethodPayPal = paypalHelper.getPaymentMethod(constants.PAYMENT_METHOD_ID_PAYPAL);

    const isVenmoActive = paymentMethodVenmo && paymentMethodVenmo.active;
    const isPayPalActive = paymentMethodPayPal && paymentMethodPayPal.active;

    const venmoPageVisibility = paypalHelper.getPageVisibility(constants.BUTTON_LOCATIONS.slice(1), preferences.venmoButtonLocation);
    const paypalPageVisibility = paypalHelper.getPageVisibility(constants.BUTTON_LOCATIONS.slice(1), preferences.payPalButtonLocation);

    res.render('button/paypal/configuration', {
        savedSmartStyles: preferences.buttonStyles.payPalSmart,
        savedButtonMessageConfigs: preferences.buttonStyles.buttonMessage,
        venmoPageVisibility: venmoPageVisibility,
        buttonPageVisibility: paypalPageVisibility,
        buttonMessagePageVisibility: paypalHelper.getPageVisibility(constants.BUTTON_LOCATIONS, preferences.paypalButtonMessagesLocation),
        isButtonMessagesEnabled: Array.from(preferences.paypalButtonMessagesLocation).length > 0,
        isPaymentMethodActive: isPayPalActive || isVenmoActive,
        config: JSON.stringify({
            card: { active: preferences.debitCreditButtonEnabled },
            paylater: { active: preferences.payLaterButtonEnabled },
            venmo: { active: isVenmoActive, locations: venmoPageVisibility },
            paypal: { active: isPayPalActive, locations: paypalPageVisibility }
        })
    });

    next();
});

/**
 * Save smart Button configuration to Custom Preference value
 *
 * success response: (status code 200) with redirect url
 * error response: (status code 500) with error message
 */
server.post('SaveSmartButton',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        try {
            const params = req.httpParameterMap;
            const data = JSON.parse(preferences.buttonStyles.payPalSmart);
            const location = params.applyToAll.booleanValue ? constants.ALL_LOCATIONS : params.location.value;

            paypalHelper.setStylesForEnabledLocations(data, {
                hm: params,
                styles: {
                    height: params.heightFormControlRange.intValue,
                    color: params.color.value,
                    shape: params.shape.value,
                    label: params.label.value,
                    layout: constants.DEFAULT_PAYPAL_BUTTONS_LAYOUT,
                    tagline: constants.DEFAULT_PAYPAL_BUTTONS_TAGLINE
                },
                alwaysVisiblePages: { billing: true },
                locations: constants.BUTTON_LOCATIONS,
                customPreference: preferences.payPalButtonLocation
            });

            Transaction.wrap(function() {
                currentSite.setCustomPreferenceValue('PP_Smart_Button_Styles', JSON.stringify(data));
            });

            res.json({
                redirectUrl: getRedirectUrl(location, 'button')
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 500);
        }

        next();
    }
);

/**
 * Save button message configuration to Custom Preference value
 *
 * success response: (status code 200) with redirect url
 * error response: (status code 500) with error message
 */
server.post('SaveButtonMessage',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        try {
            const params = req.httpParameterMap;
            const data = JSON.parse(preferences.buttonStyles.buttonMessage);
            const location = params.applyToAll.booleanValue ? constants.ALL_LOCATIONS : params.location.value;

            paypalHelper.setStylesForEnabledLocations(data, {
                hm: params,
                styles: {
                    align: params.align.value,
                    color: params.color.value,
                    position: params.position.value
                },
                alwaysVisiblePages: {},
                locations: constants.BUTTON_LOCATIONS,
                customPreference: preferences.paypalButtonMessagesLocation
            });

            Transaction.wrap(function() {
                currentSite.setCustomPreferenceValue('PP_Button_Message_Styles', JSON.stringify(data));
            });

            res.json({
                redirectUrl: getRedirectUrl(location, 'message')
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 500);
        }

        next();
    }
);

module.exports = server.exports();
