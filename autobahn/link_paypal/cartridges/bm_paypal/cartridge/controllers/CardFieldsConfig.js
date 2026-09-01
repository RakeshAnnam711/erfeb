'use strict';

/**
 * @namespace CardFieldsConfig
 */

const server = require('server');

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Renders configuration template with required configurations and parameters
 */
server.get('Start', server.middleware.https, function(req, res, next) {
    const preferences = require('*/cartridge/config/preferences');

    res.render('button/cardFields/configuration', {
        cardFieldsStyles: preferences.cardFieldsStyles
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

        try {
            const params = req.httpParameterMap;

            const cardFieldsStyles = {
                color: params.inputColor.value,
                invalidColor: params.invalidColor.value,
                validColor: params.validColor.value,
                fontSize: params.fontSize.value
            };

            Transaction.wrap(function() {
                Site.current.setCustomPreferenceValue('PP_Card_Fields_Styles', JSON.stringify(cardFieldsStyles));
            });

            res.json({
                redirectUrl: URLUtils.https('Configuration-Start', 'tab', 'card-fields', 'location', 'billing').toString()
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 500);
        }

        next();
    }
);

module.exports = server.exports();
