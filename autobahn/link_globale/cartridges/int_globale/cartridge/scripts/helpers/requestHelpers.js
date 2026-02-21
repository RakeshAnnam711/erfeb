'use strict';

/**
 * Returns JSON Payload Data sent from Global-e to SFCC
 * @throws {Error}
 * @returns {Object} - Request payload data
 */
function getPayloadData() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var payload = httpParameterMap.requestBodyAsString;

    if (!payload) {
        throw new Error('Empty payload');
    }
    var payloadJson = JSON.parse(payload);
    if (!payloadJson) {
        throw new Error('Invalid payload');
    }

    return payloadJson;
}

/**
 * Checks do sub orders exist in payload
 * @param {Object} payload - payload
 * @returns {boolean} - True or False
 */
function isSubOrdersInPayload(payload) {
    return (payload.Subs && Array.isArray(payload.Subs) && payload.Subs.length > 0);
}

/**
 * Replaces Sku with productID from the Metadata object
 * @param {string} geProducts - Products from request payload
 */
function replaceSku(geProducts) {
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    if (!geProducts) {
        return;
    }

    geProducts.forEach(function (geProduct) {
        if (geProduct.Attributes && Array.isArray(geProduct.Attributes) && geProduct.Attributes.length > 0) {
            var productID = arrayUtils.find(geProduct.Attributes, function (attr) {
                return attr.AttributeKey === globaleHelpers.consts.productID;
            });

            if (productID) {
                // eslint-disable-next-line no-param-reassign
                geProduct.Sku = productID.AttributeValue;
            }
        }
    });
}

module.exports = {
    getPayloadData: getPayloadData,
    isSubOrdersInPayload: isSubOrdersInPayload,
    replaceSku: replaceSku
};
