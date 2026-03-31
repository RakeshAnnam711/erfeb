'use strict';

var base = module.superModule;

/**
 * Middleware to use consent tracking check
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function consent(req, res, next) {
    var consented = req.session.privacyCache.get('consent');
    var enableCookieConsent = !!res.viewData.abConfigs.enableCookieConsent;

    if ([null, undefined].indexOf(consented) !== -1 && enableCookieConsent && request.httpCookies.cookieCount > 0) { //If Site Pref EnableConsentTrackingCookie
        // Get Request Cookies
        for (let i = 0; i < request.httpCookies.cookieCount; i++) {
            let currentCookie = request.httpCookies[i];

            if (currentCookie && currentCookie.name === 'abconsent') {
                consented = currentCookie.value === 'true' ? true : false;
            }
        }
    }

    if (consented === null || consented === undefined) {
        req.session.privacyCache.set('consent', null);
    } else if (consented === false) {
        req.session.privacyCache.set('consent', false);
        req.session.raw.setTrackingAllowed(false);
    } else if (consented === true) {
        req.session.privacyCache.set('consent', true);
        req.session.raw.setTrackingAllowed(true);
    }

    next();
}

base.consent = consent;

module.exports = base;
