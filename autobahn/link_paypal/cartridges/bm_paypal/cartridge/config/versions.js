'use strict';

const System = require('dw/system/System');
const ppConstants = require('~/cartridge/config/constants');
const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');

module.exports = {
    SFRA: '7.0.0',
    PLUGIN: '25.3.0',
    PAYPAL: {
        PARTNER_ATTRIBUTION_ID: ppConstants.PARTNER_ATTRIBUTION_ID
    },
    INSTANCE_TYPE: coreHelpers.getInstanceType(),
    COMPATIBILITY_MODE: System.compatibilityMode
};
