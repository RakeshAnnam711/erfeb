'use strict';

/**
 * Returns default order error response
 * @param {string} errorMessage - error message
 * @param {string} errorStack - error stack
 * @returns {Object} - default error response
 */
function getDefaultOrderErrorResponse(errorMessage, errorStack) {
    var responseInfo = {
        InternalOrderId: null, // string
        OrderId: null, // string
        Success: false, // boolean
        ErrorCode: 100, // string
        Message: errorMessage || 'Unexpected error has occurred', // string
        Description: errorStack || null // string
    };
    var object = Object.create({
        errorCode: null,
        payloadData: null,
        orderNotes: []
    });
    try {
        require('*/cartridge/models/globale/order/decorators/payloadData.js')(object);
        object.parsePayloadData();
        responseInfo.InternalOrderId = object.payloadData.MerchantOrderId;
        responseInfo.OrderId = object.payloadData.MerchantOrderId;
    } catch (e) {
        // catch exception
    }
    return responseInfo;
}

/**
 * Returns default order create error response
 * @param {string} errorMessage - error message
 * @param {string} errorStack - error stack
 * @returns {Object} - default error response
 */
function getDefaultOrderCreateErrorResponse(errorMessage, errorStack) {
    // handle error message
    var errorMsg = (errorMessage || errorStack) ? '' : 'Unexpected error has occurred';
    errorMsg += errorMessage ? ('Error Message: ' + errorMessage + ';') : '';
    errorMsg += errorStack ? ('Error Stack: ' + errorStack + ';') : '';

    var responseInfo = {
        n: '-1', // string
        t: null, // string
        s: true, // boolean true
        e: 100, // string
        m: errorMsg // string
    };

    return responseInfo;
}

module.exports = {
    getDefaultOrderErrorResponse: getDefaultOrderErrorResponse,
    getDefaultOrderCreateErrorResponse: getDefaultOrderCreateErrorResponse
};
