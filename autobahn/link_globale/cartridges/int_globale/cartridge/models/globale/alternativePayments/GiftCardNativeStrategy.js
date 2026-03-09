'use strict';

var AbstractPaymentStrategy = require('*/cartridge/models/globale/alternativePayments/AbstractPaymentStrategy');

/**
 * Represents GiftCardStrategy
 * @param {Object} jsonPayload - JSON Payload
 * @constructor
 */
function GiftCardStrategy(jsonPayload) {
    AbstractPaymentStrategy.call(this, jsonPayload);
}

/* Inherits AbstractPaymentStrategy */
GiftCardStrategy.prototype = Object.create(AbstractPaymentStrategy.prototype);

/**
 * Validates payload
 * @param {string} actionType - Action type
 * @throws {Error}
 */
GiftCardStrategy.prototype.validatePayload = function (actionType) {
    var validator = require('*/cartridge/scripts/util/globale/validator');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var jsonSchema = null;

    try {
        switch (actionType) {
            case 'VALIDATE':
                jsonSchema = {
                    MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
                    ShippingCountryCode: { required: true },
                    CardFields: { required: true }
                };
                break;
            case 'REDEEM':
                jsonSchema = {
                    MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
                    ShippingCountryCode: { required: true },
                    Cards: { required: true },
                    OrderId: { required: true }
                };
                break;
            case 'REFUND':
                jsonSchema = {
                    MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
                    Cards: { required: true },
                    OrderId: { required: true }
                };
                break;
            default:
                throw new Error('Not valid action type: ' + actionType);
        }
        var result = validator.validate(this.jsonPayload, jsonSchema);
        if (!result.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(result));
        }
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. NATIVE_GIFT_CERTIFICATE. VALIDATE_PAYLOAD : {0}', this.logger.message(e));
        throw e;
    }
};

/**
 * Sets default error response
 * @param {string} errorMsg - Error message
 * @param {string} actionType - Action type
 */
GiftCardStrategy.prototype.setDefaultErrorResponse = function (errorMsg, actionType) {
    try {
        switch (actionType) {
            case 'VALIDATE':
                this.response = {
                    IsValid: false,
                    Balance: 0,
                    CurrencyCode: '',
                    IsGlobalEGiftCard: false,
                    ErrorCode: 'Validation is failed',
                    ErrorText: errorMsg || 'Validation is failed'
                };
                break;
            case 'REDEEM':
                this.response = {
                    Cards: [],
                    ErrorCode: 'Redeem is failed',
                    ErrorText: errorMsg || 'Redeem is failed'
                };
                break;
            case 'REFUND':
                this.response = {
                    Cards: [],
                    IsRefunded: false,
                    ErrorCode: 'Refund is failed',
                    ErrorText: errorMsg || 'Refund is failed'
                };
                break;
            default:
                throw new Error('Invalid action type: ' + actionType);
        }
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. NATIVE_GIFT_CERTIFICATE. SET_DEFAULT_RESPONSE : {0}', this.logger.message(e));
    }
};

/**
 * Processes creation of the new Gift Certificate Line Item in a basket
 */
GiftCardStrategy.prototype.create = function () {
    var collections = require('*/cartridge/scripts/util/globale/collections');

    try {
        var order = this.jsonPayload.order;

        var giftCardProvider = (require('*/cartridge/scripts/globale/alternativePayments/providers/index'))['giftCardNative']; // eslint-disable-line dot-notation
        if (!giftCardProvider) {
            // throw Error('Unsupported gift card provider: ' + giftCardProvider + '. Basket ID: ' + basket.getOrderNo());
            throw Error('Unsupported gift card provider: ' + giftCardProvider + '. Basket ID: ');
        }

        collections.forEach(this.jsonPayload.giftCertificateLineItems, function (giftCertificateLineItem) {
            giftCardProvider.create(order, giftCertificateLineItem);
        });
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. CREATE_GIFT_CARD : {0}', this.logger.message(e));
    }
};

/**
 * Processes Global-e Validation API Call
 * @returns {Object} response - Validate Response
 */
GiftCardStrategy.prototype.validate = function () {
    var actionType = 'VALIDATE';

    try {
        var giftCardProvider = (require('*/cartridge/scripts/globale/alternativePayments/providers/index'))['giftCardNative']; // eslint-disable-line dot-notation

        if (!giftCardProvider) {
            throw new Error('Unsupported gift card provider ' + giftCardProvider);
        }
        // validate payload
        this.validatePayload(actionType);

        var cardData = this.jsonPayload.CardFields;
        var giftCard = giftCardProvider.get(cardData);
        var validateResult = giftCard.validate();
        if (!validateResult) {
            throw new Error('Validation is failed. Validation result: ' + JSON.stringify(validateResult));
        }
        this.setResponse(validateResult);
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. VALIDATE_GIFT_CERTIFICATE : {0}', this.logger.message(e));
        var errorMsg = 'Error: ' + e.message + '. Stack: ' + e.stack;
        this.setDefaultErrorResponse(errorMsg, actionType);
    }

    // return response;
    return this.response;
};

/**
 * Processes Global-e Redeem API Call
 * @returns {Object} response - Redeem Response
 */
GiftCardStrategy.prototype.redeem = function () {
    var actionType = 'REDEEM';

    try {
        var giftCardProvider = (require('*/cartridge/scripts/globale/alternativePayments/providers/index'))['giftCardNative']; // eslint-disable-line dot-notation
        if (!giftCardProvider) {
            throw new Error('Unsupported gift card provider ' + giftCardProvider);
        }
        // validate payload
        this.validatePayload(actionType);

        var redeemResponse = {
            Cards: []
        };
        for (var i = 0, length = this.jsonPayload.Cards.length; i < length; i++) {
            var cardData = this.jsonPayload.Cards[i];
            var giftCard = giftCardProvider.get(cardData, this.jsonPayload.OrderId);
            var redeemResult = giftCard.redeem();
            if (!redeemResult) {
                throw new Error('Redeem is failed. Redeem result: ' + JSON.stringify(redeemResult));
            }
            redeemResponse.Cards.push(redeemResult);
        }
        this.setResponse(redeemResponse);
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. REDEEM_GIFT_CARD : {0}', this.logger.message(e));
        var errorMsg = 'Error: ' + e.message + '. Stack: ' + e.stack;
        this.setDefaultErrorResponse(errorMsg, actionType);
    }

    // return response;
    return this.response;
};

/**
 * Processes Global-e Refund API Call
 * @returns {Object} response - Refund Response
 */
GiftCardStrategy.prototype.refund = function () { // eslint-disable-line no-unused-vars
    var actionType = 'REFUND';

    try {
        var giftCardProvider = (require('*/cartridge/scripts/globale/alternativePayments/providers/index'))['giftCardNative']; // eslint-disable-line dot-notation
        if (!giftCardProvider) {
            throw new Error('Unsupported gift card provider ' + giftCardProvider);
        }
        // validate payload
        this.validatePayload(actionType);

        var refundResponse = {
            Cards: [],
            IsRefunded: false
        };
        for (var i = 0, length = this.jsonPayload.Cards.length; i < length; i++) {
            var cardData = this.jsonPayload.Cards[i];
            var giftCard = giftCardProvider.get(cardData, this.jsonPayload.OrderId);
            var refundResult = giftCard.refund();
            if (!refundResult) {
                throw new Error('Refund is failed. Refund result: ' + JSON.stringify(refundResult));
            }
            refundResponse.Cards.push(refundResult);
        }
        refundResponse.IsRefunded = refundResponse.Cards.every(function (card) {
            return (card && card.IsRefundSuccess === true);
        });
        this.setResponse(refundResponse);
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. REFUND_GIFT_CARD : {0}', this.logger.message(e));
        var errorMsg = 'Error: ' + e.message + '. Stack: ' + e.stack;
        this.setDefaultErrorResponse(errorMsg, actionType);
    }

    // return response;
    return this.response;
};

module.exports = GiftCardStrategy;
