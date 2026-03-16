/* global session */

'use strict';

/**
 * Invokes custom logic before the order placement
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 */
function onBeforePlaceOrder(order, payload) {
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    // check cookie consent: 0 - No consent, 1 - Consent to all cookies, 2 - Consent to the essential cookies only
    var cookieConsent = objectUtils.getValueByPath(payload, 'CookieConsent', 0);
    if (['1', '2'].indexOf(String(cookieConsent)) !== -1) {
        session.setTrackingAllowed(true);
    }
}

exports.onBeforePlaceOrder = onBeforePlaceOrder;
