'use strict';

/**
 * Invokes custom logic after Global-e init
 */
function onInit() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');

    globaleSession.set('geSupportsFixedPrices', globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED);
}

exports.onInit = onInit;
