'use strict';

var paymentTypes = {
    giftCard: 'GiftCard',
    loyaltyPoints: 'LoyaltyPoints'
};

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
        throw new Error('Empty payload.');
    }
    var payloadJson = JSON.parse(payload);
    if (!payloadJson) {
        throw new Error('Empty payload.');
    }

    return payloadJson;
}

/**
 * Gets payment type
 * @throws {Error}
 * @param {Object} jsonPayload - JSON payload
 * @returns {string} - Payment type
 */
function getPaymentType(jsonPayload) {
    var type = null;

    if (jsonPayload.CardFields
        || jsonPayload.GiftCardTypeId === paymentTypes.giftCard
        || (Array.isArray(jsonPayload.Cards) && jsonPayload.Cards.length > 0 && ('GiftCardTypeId' in jsonPayload.Cards[0]) && jsonPayload.Cards[0].GiftCardTypeId === 1)) {
        type = paymentTypes.giftCard;
    } else if (Array.isArray(jsonPayload.Cards) && jsonPayload.Cards.length > 0 && ('GiftCardTypeId' in jsonPayload.Cards[0]) && jsonPayload.Cards[0].GiftCardTypeId === 2) {
        type = paymentTypes.loyaltyPoints;
    }

    if (!type) {
        throw new Error('Not defined alternative payment type. Payload: ' + JSON.stringify(jsonPayload));
    }

    return type;
}

/**
 * Creates payment strategy
 * @throws {Error}
 * @param {Object} jsonPayload - JSON payload
 * @param {string} paymentType - Payment type
 * @returns {Object} - Payment strategy
 */
function createPaymentStrategy(jsonPayload, paymentType) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var strategyClasses = {
        GiftCardStrategy: globaleHelpers.isNativeGiftCertificateEnabled() ? require('*/cartridge/models/globale/alternativePayments/GiftCardNativeStrategy')
            : require('*/cartridge/models/globale/alternativePayments/GiftCardStrategy'),
        LoyaltyPointsStrategy: require('*/cartridge/models/globale/alternativePayments/LoyaltyPointsStrategy')
    };
    var strategy = null;

    if (paymentType === paymentTypes.giftCard) {
        strategy = new strategyClasses['GiftCardStrategy'](jsonPayload); // eslint-disable-line dot-notation
    } else if (paymentType === paymentTypes.loyaltyPoints) {
        strategy = new strategyClasses['LoyaltyPointsStrategy'](jsonPayload); // eslint-disable-line dot-notation
    }

    if (!strategy) {
        throw new Error('Impossible to create alternative payment application strategy.');
    }

    return strategy;
}

module.exports = function (params) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var strategy = null;

    try {
        // parse payload
        var jsonPayload = params || getPayloadData();
        // get payment type
        var paymentType = getPaymentType(jsonPayload);
        // create strategy
        strategy = createPaymentStrategy(jsonPayload, paymentType);
    } catch (e) {
        logger.error('ALTERNATIVE_PAYMENTS_ERROR: {0}', logger.message(e));
        throw e;
    }

    return strategy;
};
