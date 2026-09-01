'use strict';

const Resource = require('dw/web/Resource');
const UUIDUtils = require('dw/util/UUIDUtils');

const utils = require('~/cartridge/scripts/paypal/utils');
const constants = require('~/cartridge/config/constants');

const ORDERS_API = 'v2/checkout/orders/';
const PARTIAL_URL_PAYMENTS_AUTHORIZATIONS = 'v2/payments/authorizations/';

/**
 * Call API request
 *
 * @param {Object} requestData Request data
 * @returns {Object} Response data
 */
function call(requestData) {
    const createPaypalRestService = require('~/cartridge/scripts/service/paypalREST');

    let service = null;
    let result = null;

    try {
        service = createPaypalRestService();
    } catch (error) {
        utils.createErrorLog(Resource.msgf('service.generalerror', 'errors', null, constants.SERVICE_NAME));

        throw new Error(error);
    }

    try {
        result = service.call(requestData);
    } catch (error) {
        throw new Error(Resource.msgf('service.generalerror', 'errors', null, constants.SERVICE_NAME));
    }

    if (!result.isOk()) {
        require('~/cartridge/scripts/helpers/serviceHelpers').errorHandler(result, requestData);
    }

    return service.getResponse();
}

/**
 * Function to get information about an order
 *
 * @param {string} id - paypal Order ID or paypal token for NVP orders
 * @returns {Object} Call handling result
 */
function getOrderDetails(id) {
    return call({
        path: ORDERS_API + id,
        method: 'GET',
        body: {},
        authAssertion: true
    });
}

/**
 * Voids, or cancels, an authorized payment, by ID.
 * You cannot void an authorized payment that has been fully captured.
 * NOT Captured Payment !!!
 *
 * TRANSACTION ID(authorization_id) - purchase_units[0].payments.authorizations[0].id
 *
 * @param {string} authorizationId authorization Id
 * @returns {Object} Call handling result
 */
function voidAuthorizedPayment(authorizationId) {
    // A successful request returns the HTTP 204 No Content status code with no JSON response body
    return call({
        path: [PARTIAL_URL_PAYMENTS_AUTHORIZATIONS, authorizationId, '/void'].join(''),
        method: 'POST',
        body: {},
        paypalRequestId: UUIDUtils.createUUID(),
        authAssertion: true
    });
}

/**
 * Reauthorizes an existing authorization transaction
 *
 * TRANSACTION ID(authorization_id) - purchase_units[0].payments.authorizations[0].id
 *
 * @param {string} authorizationId authorization Id
 * @returns {Object} Call handling result
 */
function reauthorizeTransaction(authorizationId) {
    // A successful request returns the HTTP 201 and body that contains a new authorization ID you can use to capture the payment
    return call({
        path: [PARTIAL_URL_PAYMENTS_AUTHORIZATIONS, authorizationId, '/reauthorize'].join(''),
        method: 'POST',
        body: {},
        paypalRequestId: UUIDUtils.createUUID(),
        authAssertion: true
    });
}

/**
 * Refunds a captured payment, by ID.
 * For a full refund, include an empty payload in the JSON request body.
 * For a partial refund, include an amount object in the JSON request body
 *
 * TRANSACTION ID(capture_id) - purchase_units[0].payments.captures[0].id
 * { "amount": { "value": "999.99", "currency_code": "USD"} } || {}
 *
 * @param {string} transactionId transaction id
 * @param {Object} reqBody prepared request body object
 * @returns {Object} Call handling result
 */
function refundTransaction(transactionId, reqBody) {
    return call({
        path: ['v2/payments/captures/', transactionId, '/refund'].join(''),
        body: reqBody,
        paypalRequestId: UUIDUtils.createUUID(),
        partnerAttributionId: constants.PARTNER_ATTRIBUTION_ID,
        authAssertion: true
    });
}

/**
 * Captures an authorized payment by ID.
 *
 * @param {string} authorizationId authorization Id
 * @param {Object} reqBody prepared request body object
 * @returns {Object} Call handling result
 */
function captureTransaction(authorizationId, reqBody) {
    return call({
        path: [PARTIAL_URL_PAYMENTS_AUTHORIZATIONS, authorizationId, '/capture'].join(''),
        body: reqBody,
        paypalRequestId: UUIDUtils.createUUID(),
        authAssertion: true
    });
}

/**
 * List of disputes
 * @returns {Object} Call handling result
 */
function getDisputes() {
    return call({
        path: 'v1/customer/disputes?page_size=50',
        method: 'GET',
        body: {}
    });
}

/**
 * Get dispute details
 * @param {string} id The ID of the dispute for which to show details.
 * @returns {Object} Call handling result
 */
function getDisputeDetails(id) {
    return call({
        path: 'v1/customer/disputes/' + id,
        method: 'GET',
        body: {}
    });
}

/**
 * Apply PayPal tracking api for COMPLETED orders
 * @param {dw.order.Order} order order to track
 * @returns {Object} Call handling result
 */
function addTrackingAPI(order) {
    const shipment = order.shipments[0];
    const shippingMethod = shipment.shippingMethod;

    const trackingNumber = shipment.trackingNumber;
    const orderID = order.paymentInstrument.custom.paypalOrderID;
    const captureID = order.custom.PP_API_TransactionID;

    return call({
        path: [ORDERS_API, orderID, '/track'].join(''),
        body: {
            tracking_number: trackingNumber,
            carrier: shippingMethod.custom.paypalCarrierName || 'OTHER',
            capture_id: captureID
        },
        authAssertion: true
    });
}

/**
 * The function creates a payment token using a provided token and PayPal customer ID.
 * The retrieved token is used for vaulting and orders creation.
 * @param {string} tokenId - The unique identifier for the specific payment method or payment source.
 * @param {string} tokenType - The type of token to generate.
 * @param {string} payPalCustomerId - The unique identifier for the PayPal customer, used for association of token with customer.
 * @returns {Object} - The result of the service call or an object containing the error message.
 */
function createPaymentToken(tokenId, tokenType, payPalCustomerId) {
    const body = {
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
        return call({
            path: 'v3/vault/payment-tokens',
            method: 'POST',
            body: body,
            paypalRequestId: UUIDUtils.createUUID()
        });
    } catch (error) {
        return { error: error.message };
    }
}

module.exports = {
    getOrderDetails: getOrderDetails,
    addTrackingAPI: addTrackingAPI,
    // transaction actions
    reauthorizeTransaction: reauthorizeTransaction,
    refundTransaction: refundTransaction,
    captureTransaction: captureTransaction,
    voidAuthorizedPayment: voidAuthorizedPayment,
    // dispute actions
    getDisputes: getDisputes,
    getDisputeDetails: getDisputeDetails,
    createPaymentToken: createPaymentToken
};
