/**
 * whBase Model
 */
function whBase() {}

/**
 * Verifies a webhook signature.
 * @param {Object} whEvent WebHook event
 * @param {dw.util.Map} headers Headers from request body
 * @param {string} webHookId WebHook id
 * @returns {Object} Verify response object
 */
whBase.prototype.verifyWhSignature = function(whEvent, headers, webHookId) {
    const paypalConstants = require('*/cartridge/config/constants');
    const paypalRestService = require('*/cartridge/scripts/service/paypalREST');

    const requestData = {
        body: {
            auth_algo: headers.get('paypal-auth-algo'),
            cert_url: headers.get('paypal-cert-url'),
            transmission_id: headers.get('paypal-transmission-id'),
            transmission_sig: headers.get('paypal-transmission-sig'),
            transmission_time: headers.get('paypal-transmission-time'),
            webhook_id: webHookId,
            webhook_event: whEvent
        },
        method: paypalConstants.METHOD_POST,
        path: 'v1/notifications/verify-webhook-signature'
    };

    return paypalRestService.call(requestData);
};

/**
 * Throws error message about webhook verification
 * @param {string} verificationStatus webhook verification status
 */
whBase.prototype.throwVerificationError = function(verificationStatus) {
    const Resource = require('dw/web/Resource');

    throw Resource.msgf('paypal.webhook.verified.error', 'paypalerrors', null, verificationStatus);
};

module.exports = whBase;
