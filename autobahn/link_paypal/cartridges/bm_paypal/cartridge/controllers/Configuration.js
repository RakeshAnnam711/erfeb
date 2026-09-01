'use strict';

/**
 * @namespace Configuration
 */

const server = require('server');

const constants = require('~/cartridge/config/constants');

/**
 * Gets the alert message text to show on successful saving of button configs
 * @returns {string} alert message text
 */
function getFlashMessage() {
    const Resource = require('dw/web/Resource');

    const hm = request.httpParameterMap;
    const tabName = hm.tab.stringValue;
    const location = hm.location.stringValue;
    const section = hm.section.stringValue || 'button';
    const locations = Array.from(new Set([].concat(
        constants.BUTTON_LOCATIONS,
        constants.CWPP_LOCATIONS
    )));

    let msgArgument = Resource.msgf('locations.all', 'configuration', null, section);

    if (locations.includes(location)) {
        msgArgument = [location, 'page'].join(' ');
    }

    const tabs = {
        'apple-pay': Resource.msgf('applepay.saved.title', 'configuration', null, msgArgument),
        'google-pay': Resource.msgf('googlepay.saved.title', 'configuration', null, msgArgument),
        'card-fields': Resource.msg('cardfields.saved.title', 'configuration', null),
        cwpp: Resource.msgf('cwpp.saved.title', 'configuration', null, msgArgument),
        paypal: {
            button: Resource.msgf('smartbutton.saved.title', 'configuration', null, msgArgument),
            message: Resource.msgf('button.message.saved.title', 'configuration', null, msgArgument)
        }
    };

    if (location && tabName in tabs) {
        if (tabName === 'paypal') {
            return tabs[tabName][section];
        }

        return tabs[tabName];
    }

    return '';
}

/**
 * Renders configuration template with required configurations and parameters
 */
server.get('Start', server.middleware.https, function(req, res, next) {
    const paypalUrls = require('*/cartridge/config/urls');
    const preferences = require('*/cartridge/config/preferences');
    const paypalHelper = require('~/cartridge/scripts/paypal/helpers');
    const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');

    const paymentMethodVenmo = paypalHelper.getPaymentMethod(constants.PAYMENT_METHOD_ID_VENMO);
    const isVenmoActive = paymentMethodVenmo && paymentMethodVenmo.active;

    const fundingConfigs = [
        { condition: isVenmoActive, fundingSource: constants.FUNDING_VENMO },
        { condition: preferences.debitCreditButtonEnabled, fundingSource: constants.FUNDING_CARD },
        { condition: preferences.payLaterButtonEnabled, fundingSource: constants.FUNDING_PAYLATER }
    ];

    const enableFunding = [];
    const disableFunding = [];

    fundingConfigs.forEach(function(config) {
        (config.condition ? enableFunding : disableFunding).push(config.fundingSource);
    });

    const fundingQuery = [
        coreHelpers.buildQueryPart('enable-funding', enableFunding),
        coreHelpers.buildQueryPart('disable-funding', disableFunding)
    ].join('');

    res.render('button/configurationBoard', {
        flashMessages: getFlashMessage(),
        payPalSDK: paypalUrls.payPalSDK.replace(/\{0\}/, preferences.clientId) + fundingQuery
    });

    next();
});

module.exports = server.exports();
