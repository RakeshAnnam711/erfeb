/* global session */

'use strict';

/**
 * Returns cookie consent
 * 0 - No consent
 * 1 - Consent to all cookies
 * 2 - Consent to the essential cookies only
 * @returns {number} - Global-e WebStoreCode
 */
function getCookieConsent() {
    var cookieConsent = session.isTrackingAllowed();
    return cookieConsent ? 1 : 0;
}

exports.getCookieConsent = getCookieConsent;
