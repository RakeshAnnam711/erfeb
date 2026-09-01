'use strict';

/**
 * @namespace CWPPConfig
 */

const server = require('server');

const constants = require('*/cartridge/config/constants');
const preferences = require('*/cartridge/config/preferences');
const paypalHelper = require('~/cartridge/scripts/paypal/helpers');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Renders configuration template with required configurations and parameters
 */
server.get('Start', server.middleware.https, function(req, res, next) {
    const paypalUrls = require('*/cartridge/config/urls');

    const payPalApiConfig = {
        appid: preferences.clientId,
        locale: paypalHelper.getLocaleWithHyphen(request.getLocale()),
        returnurl: paypalUrls.cwppConfigUrl,
        authend: constants.INSTANCE_SANDBOX
    };

    res.render('button/cwpp/configuration', {
        payPalApiConfig: JSON.stringify(payPalApiConfig),
        payPalExternalApi: paypalUrls.payPalExternalSDK,
        buttonStyles: preferences.buttonStyles.cwpp,
        paymentMethod: paypalHelper.getPaymentMethod(constants.PAYMENT_METHOD_ID_PAYPAL)
    });

    next();
});

/**
 * Save Button configuration to Custom Preference
 *
 * success response: (status code 200) with redirect url
 * error response: (status code 500) with error message
 * */
server.post('SaveButton',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        const Site = require('dw/system/Site');
        const URLUtils = require('dw/web/URLUtils');
        const Transaction = require('dw/system/Transaction');

        response.setContentType('application/json');

        try {
            const params = request.httpParameterMap;
            const data = JSON.parse(preferences.buttonStyles.cwpp);
            const location = params.applyToAll.booleanValue ? constants.ALL_LOCATIONS : params.location.value;

            paypalHelper.setStylesForEnabledLocations(data, {
                hm: params,
                styles: {
                    theme: params.theme.value,
                    buttonType: params.buttonType.value,
                    buttonSize: params.buttonSize.value,
                    buttonShape: params.buttonShape.value
                },
                alwaysVisiblePages: {},
                locations: constants.CWPP_LOCATIONS,
                customPreference: constants.CWPP_LOCATIONS
            });

            Transaction.wrap(function() {
                Site.current.setCustomPreferenceValue('PP_CWPP_Button_Styles', JSON.stringify(data));
            });

            res.json({
                redirectUrl: URLUtils.https('Configuration-Start', 'tab', 'cwpp', 'location', location).toString()
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 500);
        }

        next();
    }
);

module.exports = server.exports();
