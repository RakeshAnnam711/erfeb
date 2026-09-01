'use strict';

var UUIDUtils = require('dw/util/UUIDUtils');

var superModule = module.superModule;

/**
 * Creates payment token and makes customer object optional when customer id is absent.
 * @param {string} tokenId setup/billing token id
 * @param {string} tokenType token type
 * @param {string} payPalCustomerId PayPal customer id
 * @returns {Object} call result
 */
function createPaymentToken(tokenId, tokenType, payPalCustomerId) {
    var constants = require('*/cartridge/config/constants');
    var paypalRestService = require('*/cartridge/scripts/service/paypalREST');
    var utils = require('*/cartridge/scripts/paypal/utils');

    var body = {
        payment_source: {
            token: {
                id: tokenId,
                type: tokenType
            }
        }
    };

    if (payPalCustomerId) {
        body.customer = {
            id: payPalCustomerId
        };
    }

    try {
        return paypalRestService.call({
            path: 'v3/vault/payment-tokens',
            method: constants.METHOD_POST,
            body: body,
            paypalRequestId: UUIDUtils.createUUID()
        });
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

module.exports = Object.assign({}, superModule, {
    createPaymentToken: createPaymentToken
});
