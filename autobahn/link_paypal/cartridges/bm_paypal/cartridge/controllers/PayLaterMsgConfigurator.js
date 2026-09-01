'use strict';

/**
 * @namespace PayLaterMsgConfigurator
 */

const server = require('server');

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const middleware = require('~/cartridge/scripts/paypal/middleware');

/**
 * PayLaterMsgConfigurator-Start : The PayLaterMsgConfigurator-Start endpoint will render the Paypal Pay Later configurator
 * @name PayPal/PayLaterMsgConfigurator-Start
 * @function
 * @memberof PayLaterMsgConfigurator
 * @param {middleware} - server.middleware.include
 */
server.get(
    'Start',
    server.middleware.include,
    function(req, res, next) {
        const URLUtils = require('dw/web/URLUtils');

        const urls = require('~/cartridge/config/urls');
        const PpPaylaterMessaging = require('~/cartridge/models/ppPaylaterMessaging');

        res.render('messaging/paylaterConfigurator', {
            configurations: new PpPaylaterMessaging(),
            sdk: urls.payLaterConfiguratorSdk,
            onSaveUrl: URLUtils.url('PayLaterMsgConfigurator-Save').toString()
        });

        next();
    }
);

/**
 * PayLaterMsgConfigurator-Save : The PayLaterMsgConfigurator-Save saves Paypal pay later messaging configuration
 * massage/banner configurations to Custom Preference value
 * @name Base/PayLaterMsgConfigurator-Save
 * @function
 * @memberof PayLaterMsgConfigurator
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {middleware} - middleware.parseBody Parse and validate body request
 */
server.post('Save',
    server.middleware.https,
    csrfProtection.validateRequest,
    middleware.parseBody,
    function(req, res, next) {
        const Resource = require('dw/web/Resource');

        try {
            const helpers = require('~/cartridge/scripts/paypal/helpers');

            helpers.savePayLaterMessagingStyles(res.parsedBody);

            res.json({
                error: false,
                message: Resource.msg('paylater.messaging.saved.title', 'configuration', null)
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 500);
            res.setViewData({ message: Resource.msg('paylater.messaging.not.saved.title', 'configuration', null) });
        }

        next();
    }
);

module.exports = server.exports();
