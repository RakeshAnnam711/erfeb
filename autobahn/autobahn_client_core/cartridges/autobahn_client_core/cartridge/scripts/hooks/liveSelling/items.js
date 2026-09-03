/* eslint no-unused-vars: "off", no-useless-return: "off", consistent-return: "off" */

'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var liveSellingHelpers = require('*/cartridge/scripts/helpers/liveSellingHelpers');

/**
 * After POST the new items are already on the basket, so we only walk PLIs.
 * Category parent is the source of truth - not the client flag.
 */
function isLiveSelling(basket) {
    var hasLiveSellingLineItem = false;

    basket.allProductLineItems.toArray().forEach(function (pli) {
        if (liveSellingHelpers.isLiveSellingProduct(pli.product)) {
            pli.custom.isLiveSellingLineItem = true;
            pli.custom.somCC_returnable = false;
            hasLiveSellingLineItem = true;
        }
    });

    return hasLiveSellingLineItem;
}

exports.afterPOST = function (basket, basketItems) {
    if (!basket) {
        return;
    }

    try {
        if (isLiveSelling(basket)) {
            var currentSite = Site.getCurrent();
            var expirationHours = currentSite.getCustomPreferenceValue('cscHandoffExpirationHours');
            basket.custom.isLiveSellingOrder = true;
            basket.custom.cscHandoffExpiration = expirationHours > 0 ? new Date(Date.now() + (expirationHours * 60 * 60 * 1000)) : null;

            if (empty(basket.custom.liveSellingEventSummary)) {
                basket.custom.liveSellingEventSummary = currentSite.getCustomPreferenceValue('liveSellingEventSummary');
            }
        }
    } catch (e) {
        Logger.error('liveSelling items.afterPOST: unable to stamp the basket: {0}', e.message);
    }
};
