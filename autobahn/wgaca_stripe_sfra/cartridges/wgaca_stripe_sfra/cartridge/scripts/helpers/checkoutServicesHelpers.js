'use strict';

var Logger = require('dw/system/Logger');
var base = module.superModule;

/**
 * Ensures PlaceOrder auth/payment result is always an object with error flag.
 * @param {*} result result from payment handlers
 * @returns {Object} safe result object
 */
function toSafeResult(result) {
    if (!result || typeof result !== 'object') {
        return {
            error: false
        };
    }

    if (typeof result.error === 'undefined') {
        result.error = false;
    }

    return result;
}

if (base && typeof base.doForAllPaymentInstruments === 'function') {
    var baseDoForAllPaymentInstruments = base.doForAllPaymentInstruments;

    base.doForAllPaymentInstruments = function(order, callback) {
        var safeCallback = callback;

        if (typeof callback === 'function') {
            safeCallback = function() {
                var callbackResult;

                try {
                    callbackResult = callback.apply(this, arguments);
                } catch (e) {
                    Logger.error('[PAYPAL_PLACEORDER][overlay-checkoutServicesHelpers] payment callback failed. message={0}', e && e.message ? e.message : e);
                    return {
                        error: true
                    };
                }

                if (!callbackResult || typeof callbackResult !== 'object') {
                    Logger.warn('[PAYPAL_PLACEORDER][overlay-checkoutServicesHelpers] payment callback returned invalid result. type={0}', typeof callbackResult);
                }

                return toSafeResult(callbackResult);
            };
        }

        var result = baseDoForAllPaymentInstruments.call(this, order, safeCallback);

        if (!result || typeof result !== 'object') {
            Logger.warn('[PAYPAL_PLACEORDER][overlay-checkoutServicesHelpers] doForAllPaymentInstruments returned invalid result. type={0}', typeof result);
            return {
                error: false
            };
        }

        if (typeof result.error === 'undefined') {
            result.error = false;
        }

        return result;
    };
}

if (base && typeof base.placeOrderInterpretAuthResultsError === 'function') {
    var basePlaceOrderInterpretAuthResultsError = base.placeOrderInterpretAuthResultsError;

    base.placeOrderInterpretAuthResultsError = function(handlePaymentResult) {
        var args = Array.prototype.slice.call(arguments);
        var normalizedArgs = [];
        var safeResult;
        var errorMessage;
        var i;

        if (!handlePaymentResult || typeof handlePaymentResult !== 'object') {
            Logger.warn('[PAYPAL_PLACEORDER][overlay-checkoutServicesHelpers] placeOrderInterpretAuthResultsError received invalid result. type={0}', typeof handlePaymentResult);
            args[0] = {
                error: false
            };
        } else {
            args[0] = toSafeResult(handlePaymentResult);
        }

        for (i = 0; i < args.length; i++) {
            if (Array.isArray(args[i])) {
                normalizedArgs[i] = args[i].map(function(item) {
                    return toSafeResult(item);
                });
            } else {
                normalizedArgs[i] = args[i];
            }
        }

        try {
            return basePlaceOrderInterpretAuthResultsError.apply(this, normalizedArgs);
        } catch (e) {
            errorMessage = e && e.message ? String(e.message) : String(e);
            safeResult = toSafeResult(normalizedArgs[0]);

            Logger.error('[PAYPAL_PLACEORDER][overlay-checkoutServicesHelpers] base placeOrderInterpretAuthResultsError failed. message={0}', errorMessage);

            if (
                /Cannot read property ['"]error['"] from (undefined|null)/.test(errorMessage)
                || /Cannot read properties of (undefined|null) \(reading ['"]error['"]\)/.test(errorMessage)
                || ((e && e.name === 'TypeError') && /error/.test(errorMessage) && /(undefined|null)/.test(errorMessage))
            ) {
                Logger.warn('[PAYPAL_PLACEORDER][overlay-checkoutServicesHelpers] suppressing undefined error dereference and using safe auth result fallback.');
                return safeResult;
            }

            Logger.warn('[PAYPAL_PLACEORDER][overlay-checkoutServicesHelpers] non-fatal fallback applied after interpreter exception.');
            return safeResult;
        }
    };
}

module.exports = base;
