'use strict';

function setRedirectString (req, res, next) {
    // Wipe pre-existing value
    session.custom.redirectString = null;

    if (request.httpMethod === 'GET') {
        var referer = request.httpReferer;
        var host = request.httpHost;
        var refererSubString = referer && host ? referer.split(host || '')[1] : null;

        if (refererSubString) {
            var excludedPages = dw.system.Site.current.getCustomPreferenceValue('loginRedirectExclusions');
            if (!empty(excludedPages)) {
                if (excludedPages.toLowerCase() === 'all') {
                    refererSubString = null;
                } else {
                    try {
                        var subStringSansQuery = refererSubString.split('?')[0];
                        excludedPages.split(',').forEach( function(page) {
                            // check if the site pref string matches the url without checking the querystring
                            if (refererSubString && subStringSansQuery.includes(page.trim())) {
                                refererSubString = null;
                            }
                        })
                    } catch (e) {
                        dw.system.Logger.warn('loginRedirectExclusions not formatted properly: {0}', e.message);
                    }
                }
            }
        }

        // Only add redirect to referer when directed from outside account & checkout controllers
        if (!empty(refererSubString)) {
            var patterns = [
                '/Account-',
                '/Checkout-',
                '/CheckoutServices-',
                '/CheckoutShippingServices-',
                '/CheckoutAddressServices-',
                '/COPlaceOrder-',
                '/CSRF-',
                '/Login-',
                '/Order-'
            ]
            var patternMatchFn = function (accumulator, pattern) {
                    return accumulator && refererSubString.indexOf(pattern) === -1;
                };
            // if Referer does not match the patterns, allow redirect
            if ([true].concat(patterns).reduce(patternMatchFn) === true) {
                session.custom.redirectString = refererSubString;
            }
        }
    }

    next();
}

module.exports = {
    setRedirectString: setRedirectString
};
