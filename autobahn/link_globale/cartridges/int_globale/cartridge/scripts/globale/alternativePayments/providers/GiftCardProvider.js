'use strict';

var AbstractPaymentProvider = require('*/cartridge/scripts/globale/alternativePayments/providers/AbstractPaymentProvider');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Represents gift card provider
 * @constructor
 * @param {string} geOrderId - Global-e Order ID
 */
function GiftCard(geOrderId) {
    AbstractPaymentProvider.call(this, geOrderId);
    this.cardData = null;
}

/* Inherits AbstractPaymentProvider */
GiftCard.prototype = Object.create(AbstractPaymentProvider.prototype);

/**
 * Processes Global-e Validation API Call
 * @returns {Object|null} - Result object or null
 */
GiftCard.prototype.validate = function () {
    var validateResult = {
        IsValid: false,
        Balance: 0,
        CurrencyCode: '',
        IsGlobalEGiftCard: false
    };
    try {
        var gcStorage = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coGiftCards, this.cardData.CardId);
        if (!gcStorage) {
            validateResult.ErrorCode = 'Validate is failed';
            validateResult.ErrorText = 'Card was not found';
            throw new Error('Card was not found. Card ID: ' + this.cardData.CardId);
        }
        validateResult = {
            IsValid: !!(gcStorage.custom.currentBalance && gcStorage.custom.originalCurrencyCode),
            Balance: gcStorage.custom.currentBalance,
            CurrencyCode: gcStorage.custom.originalCurrencyCode,
            IsGlobalEGiftCard: true
        };
        if (!validateResult.IsValid) {
            validateResult.ErrorCode = 'Validate is failed';
            validateResult.ErrorText = 'Card is not valid';
            throw new Error('Card is not valid. Card ID: ' + this.cardData.CardId);
        }
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. VALIDATE_GIFT_CARD : {0}', this.logger.message(e));
    }
    return validateResult;
};

/**
 * Processes Global-e Redeem API Call
 * @returns {Object|null} - Result object or null
 */
GiftCard.prototype.redeem = function () {
    var redeemResult = this.cardData;
    var Transaction = require('dw/system/Transaction');
    Transaction.begin();
    try {
        var gcStorage = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coGiftCards, this.cardData.CardFields.CardId);
        if (!gcStorage) {
            redeemResult.ErrorCode = 'Redeem is failed';
            redeemResult.ErrorText = 'Card was not found';
            throw new Error('Card was not found. Card ID: ' + this.cardData.CardFields.CardId);
        }
        // store redeem request
        this.storeJsonPayload('redeemRequestJSON', this.cardData, gcStorage);
        // capture amount
        var diffBalance = (gcStorage.custom.currentBalance - this.cardData.BalanceUsedInCardCurrency);
        if (isNaN(diffBalance) || diffBalance < 0) { // eslint-disable-line no-restricted-globals
            redeemResult.ErrorCode = 'Redeem is failed';
            redeemResult.ErrorText = 'Amount of card balance is not enough for Redeem operation';
            throw new Error('Amount of card balance is not enough for Redeem operation. Card ID: ' + this.cardData.CardFields.CardId);
        }
        gcStorage.custom.currentBalance = diffBalance;
        // set RedeemTransactionId
        redeemResult.RedeemTransactionId = new Date().getTime();
        // store redeem result
        this.storeJsonPayload('redeemResponseJSON', redeemResult, gcStorage);
        Transaction.commit();
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. REDEEM_GIFT_CARD : {0}', this.logger.message(e));
        Transaction.rollback();
    }
    return redeemResult;
};

/**
 * Processes Global-e Refund API Call
 * @returns {Object|null} - Result object or null
 */
GiftCard.prototype.refund = function () {
    var refundResult = this.cardData;
    var Transaction = require('dw/system/Transaction');
    Transaction.begin();
    try {
        var gcStorage = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coGiftCards, this.cardData.CardFields.CardId);
        if (!gcStorage) {
            refundResult.IsRefundSuccess = false;
            refundResult.ErrorCode = 'Refund is failed';
            refundResult.ErrorText = 'Card was not found';
            throw new Error('Card was not found. Card ID: ' + this.cardData.CardFields.CardId);
        }
        if (!('RefundedBalanceInGiftCardCurrency' in refundResult) || refundResult.RefundedBalanceInGiftCardCurrency === null
            || !('RefundedBalanceInCustomerCurrency' in refundResult) || refundResult.RefundedBalanceInCustomerCurrency === null) {
            refundResult.IsRefundSuccess = false;
            refundResult.ErrorCode = 'Refund is failed';
            refundResult.ErrorText = 'Not valid card details in payload';
            throw new Error('Card ID: ' + this.cardData.CardFields.CardId + '. Not valid card details in payload. RefundedBalanceInGiftCardCurrency = ' + refundResult.RefundedBalanceInGiftCardCurrency + '. RefundedBalanceInCustomerCurrency = ' + refundResult.RefundedBalanceInCustomerCurrency);
        }
        // store refund request
        this.storeJsonPayload('refundRequestJSON', this.cardData, gcStorage);
        gcStorage.custom.currentBalance += refundResult.RefundedBalanceInGiftCardCurrency;
        // update result
        refundResult.IsRefundSuccess = true;
        // store refund result
        this.storeJsonPayload('refundResponseJSON', refundResult, gcStorage);
        Transaction.commit();
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. REFUND_GIFT_CARD : {0}', this.logger.message(e));
        Transaction.rollback();
    }
    return refundResult;
};

/**
 * Stores the JSON Payload received from Global-e request
 * @param {string} jsonCustomAttribute - Custom attribute of object where the Payload data will be stored.
 * @param {Object|undefined|null} payloadData - Payload data
 * @param {dw.object.CustomObjectMgr} storage - Card storage
 */
GiftCard.prototype.storeJsonPayload = function (jsonCustomAttribute, payloadData, storage) {
    var jsonRecords = [];
    if (!jsonCustomAttribute || !payloadData || !storage) {
        throw new Error('Invalid input arguments');
    }
    jsonRecords = JSON.parse(storage.custom[jsonCustomAttribute]);
    if (jsonRecords) {
        if (Object.prototype.toString.call(jsonRecords) !== '[object Array]') {
            jsonRecords = [{ datetime: '0000-00-00T00:00:00.000Z', payload: jsonRecords }];
        }
    } else {
        jsonRecords = [];
    }
    jsonRecords.push({ datetime: (new Date()).toISOString(), payload: (payloadData) });
    storage.custom[jsonCustomAttribute] = JSON.stringify(jsonRecords); // eslint-disable-line no-param-reassign
};

/**
 * Creates Gift Card
 * @param {Object} order - SFCC order
 * @param {Object} pli - Product line item (which is processed as 'gift card')
 * @returns {Object} - Gift card wrapper
 */
function create(order, pli) {
    var Transaction = require('dw/system/Transaction');
    var giftCard = null;
    Transaction.begin();
    try {
        // gift card amount
        var amount = (pli.custom.geOriginalPriceBookTotalPrice / pli.quantityValue) || 0;
        if (isNaN(amount) || amount < 0) { // eslint-disable-line no-restricted-globals
            throw new Error('Amount is not valid: ' + amount + '. Product ID: ' + pli.product.ID);
        }
        // gift card storage
        var gcID = String(new Date().getTime());
        var gcStorage = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coGiftCards, gcID);
        gcStorage.custom.initialBalance = amount;
        gcStorage.custom.currentBalance = amount;
        gcStorage.custom.originalCurrencyCode = order.currencyCode;
        // gift card wrapper
        giftCard = new GiftCard();

        order.addNote('CREATE_GIFT_CARD', 'INFO: Creation is succesfull. Product ID: ' + pli.product.ID);
        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. CREATE_GIFT_CARD : {0}', this.logger.message(e));
    }
    return giftCard;
}

/**
 * Gets Gift Card
 * @param {Object} cardData - Gift card data
 * @param {string} geOrderId - Global-e Order ID
 * @returns {Object} - Gift card
 */
function get(cardData, geOrderId) {
    var giftCard = null;
    try {
        // gift card wrapper
        giftCard = new GiftCard(geOrderId);
        giftCard.cardData = cardData;
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. GET_GIFT_CARD : {0}', this.logger.message(e));
    }
    return giftCard;
}

module.exports = {
    create: create,
    get: get
};
