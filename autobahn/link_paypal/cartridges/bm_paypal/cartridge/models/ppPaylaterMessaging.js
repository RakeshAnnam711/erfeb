'use strict';

const preferences = require('~/cartridge/config/preferences');

/**
 * Returns available pages configurations to be passed to configurator
 * @param {Array} placements An array of placements
 * @returns {Object} An object that contains all available pages configurations
 */
function getPageConfigs(placements) {
    const coreHelper = require('~/cartridge/scripts/helpers/coreHelpers');

    const savedStyles = coreHelper.tryParseJSON(preferences.buttonStyles.payLaterMessaging);

    return placements.reduce(function(accum, curr) {
        accum[curr] = savedStyles[curr];

        return accum;
    }, {});
}

/**
 * Creates PayPal Pay later messaging configurator object
 */
function PpPaylaterMessagingModel() {
    const constants = require('~/cartridge/config/constants');

    this.placements = constants.PAYLATER_MESSAGING_LOCATIONS;
    this.config = getPageConfigs(this.placements);
    this.locale = preferences.defaultLocale;
    this.merchantIdentifier = preferences.paypalMerchantId;
    this.partnerClientId = preferences.clientId;
    this.partnerName = preferences.merchantName;
    this.bnCode = constants.PARTNER_ATTRIBUTION_ID;
}

module.exports = PpPaylaterMessagingModel;
