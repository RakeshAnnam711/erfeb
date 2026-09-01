'use strict';

const Resource = require('dw/web/Resource');

const utils = require('~/cartridge/scripts/paypal/utils');
const constants = require('~/cartridge/config/constants');
const paypalApi = require('~/cartridge/scripts/paypal/api/paypal');

/**
 * Get error response
 * @param {Error} error - An error
 * @returns {Object} - An error object
 */
function errorResponse(error) {
    return {
        err: true,
        responseData: {
            l_longmessage0: error.message
        }
    };
}

/**
 * PP REST SDK model
 */
function ppRestSdk() { }

/**
* Makes void transaction api call
* @param {Object} reqData request data object
* @return {Object} response
*/
ppRestSdk.prototype.doVoid = function(reqData) {
    try {
        if (!reqData.authorizationId) {
            utils.createErrorLog(Resource.msg('api.error.noid.during.voiding', 'errors', null));

            throw new Error();
        }

        paypalApi.voidAuthorizedPayment(reqData.authorizationId);

        return {
            responseData: {
                ack: constants.ACTION_STATUS_SUCCESS
            },
            status: constants.STATUS_COMPLETED
        };
    } catch (err) {
        return errorResponse(err);
    }
};

/**
* Makes reauthorize transaction api call
* @param {Object} reqData request data object
* @return {Object} response
*/
ppRestSdk.prototype.doReauthorize = function(reqData) {
    try {
        if (!reqData.authorizationId) {
            utils.createErrorLog(Resource.msg('api.error.noid.during.reauthorization', 'errors', null));

            throw new Error();
        }

        const resp = paypalApi.reauthorizeTransaction(reqData.authorizationId);

        if (resp.status !== constants.STATUS_CREATED) {
            utils.createErrorLog(Resource.msg('api.error.not.successful.reauthorize', 'errors', null));

            throw new Error();
        }

        resp.responseData = {
            ack: constants.ACTION_STATUS_SUCCESS
        };

        return resp;
    } catch (err) {
        return errorResponse(err);
    }
};

/**
* Makes refund transaction api call
* @param {Object} reqData request data object
* @return {Object} response
*/
ppRestSdk.prototype.doRefundTransaction = function(reqData) {
    try {
        if (!reqData.transactionid) {
            utils.createErrorLog(Resource.msg('api.error.no.captureid', 'errors', null));

            throw new Error();
        }

        const reqBody = {};

        if (reqData.invNum) {
            reqBody.invoice_id = reqData.invNum;
        }

        if (reqData.note) {
            reqBody.note_to_payer = reqData.note;
        }

        if (reqData.amt) {
            reqBody.amount = {
                value: reqData.amt,
                currency_code: reqData.currencyCode
            };
        }

        const resp = paypalApi.refundTransaction(reqData.transactionid, reqBody);

        if (resp.status !== constants.STATUS_COMPLETED) {
            utils.createErrorLog(Resource.msg('api.error.not.successful.refund', 'errors', null));

            throw new Error();
        }

        resp.responseData = {
            ack: constants.ACTION_STATUS_SUCCESS
        };

        return resp;
    } catch (err) {
        return errorResponse(err);
    }
};

/**
* Makes capture transaction api call
* @param {Object} reqData request data object
* @return {Object} response
*/
ppRestSdk.prototype.doCapture = function(reqData) {
    try {
        if (!reqData.authorizationId) {
            utils.createErrorLog(Resource.msg('api.error.noid.during.capturing', 'errors', null));

            throw new Error();
        }

        const reqBody = {
            final_capture: false,
            amount: {
                value: reqData.amt,
                currency_code: reqData.currencyCode
            }
        };

        if (reqData.invNum) {
            reqData.invoice_id = reqData.invNum;
        }

        if (reqData.note) {
            reqData.note_to_payer = reqData.note;
        }

        const resp = paypalApi.captureTransaction(reqData.authorizationId, reqBody);

        resp.responseData = {
            ack: constants.ACTION_STATUS_SUCCESS
        };

        return resp;
    } catch (err) {
        return errorResponse(err);
    }
};

/**
 * Gets information about an order
 * @param {string} id - paypal Order ID/transaction id/ paypal token for NVP orders
 * @returns {Object} api call handling result
 */
ppRestSdk.prototype.getOrderDetails = function(id) {
    try {
        if (!id) {
            utils.createErrorLog(Resource.msg('api.error.no.idortoken', 'errors', null));

            throw new Error();
        }

        return paypalApi.getOrderDetails(id);
    } catch (err) {
        return errorResponse(err);
    }
};

module.exports = ppRestSdk;
