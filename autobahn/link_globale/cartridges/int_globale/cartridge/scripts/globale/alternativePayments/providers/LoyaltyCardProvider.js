'use strict';

var AbstractPaymentProvider = require('*/cartridge/scripts/globale/alternativePayments/providers/AbstractPaymentProvider');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Represents loyalty card provider
 * @constructor
 * @param {string} geOrderId - Global-e Order ID
 */
function LoyaltyCard(geOrderId) {
    AbstractPaymentProvider.call(this, geOrderId);
    this.cardData = null;
}

/* Inherits AbstractPaymentProvider */
LoyaltyCard.prototype = Object.create(AbstractPaymentProvider.prototype);

/**
 * Processes Global-e Redeem API Call
 * @returns {Object|null} - Result object or null
 */
LoyaltyCard.prototype.redeem = function () {
    var redeemResult = this.cardData;
    var Transaction = require('dw/system/Transaction');
    Transaction.begin();
    try {
        var lcStorage = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coLoyaltyCards, this.cardData.CardFields.LoyaltyCreditUserId);
        if (!lcStorage) {
            redeemResult.ErrorCode = 'Redeem is failed';
            redeemResult.ErrorText = 'Card was not found';
            throw new Error('Card was not found. Card ID: ' + this.cardData.CardFields.LoyaltyCreditUserId);
        }
        // store redeem request
        this.storeJsonPayload('redeemRequestJSON', this.cardData, lcStorage);
        // capture amount
        var diffBalance = (lcStorage.custom.currentBalance - this.cardData.BalanceUsedInCardCurrency);
        if (isNaN(diffBalance) || diffBalance < 0) { // eslint-disable-line no-restricted-globals
            redeemResult.ErrorCode = 'Redeem is failed';
            redeemResult.ErrorText = 'Amount of card balance is not enough for Redeem operation';
            throw new Error('Amount of card balance is not enough for Redeem operation. Card ID: ' + this.cardData.CardFields.LoyaltyCreditUserId);
        }
        lcStorage.custom.currentBalance = diffBalance;
        // set RedeemTransactionId
        redeemResult.RedeemTransactionId = new Date().getTime();
        // store redeem result
        this.storeJsonPayload('redeemResponseJSON', redeemResult, lcStorage);
        Transaction.commit();
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. REDEEM_LOYALTY_CARD : {0}', this.logger.message(e));
        Transaction.rollback();
    }
    return redeemResult;
};

/**
 * Processes Global-e Refund API Call
 * @returns {Object|null} - Result object or null
 */
LoyaltyCard.prototype.refund = function () {
    var refundResult = this.cardData;
    var Transaction = require('dw/system/Transaction');
    Transaction.begin();
    try {
        var lcStorage = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coLoyaltyCards, this.cardData.CardFields.LoyaltyCreditUserId);
        if (!lcStorage) {
            refundResult.IsRefundSuccess = false;
            refundResult.ErrorCode = 'Refund is failed';
            refundResult.ErrorText = 'Card was not found';
            throw new Error('Card was not found. Card ID: ' + this.cardData.CardFields.LoyaltyCreditUserId);
        }
        if (!('RefundedBalanceInGiftCardCurrency' in refundResult) || refundResult.RefundedBalanceInGiftCardCurrency === null
            || !('RefundedBalanceInCustomerCurrency' in refundResult) || refundResult.RefundedBalanceInCustomerCurrency === null) {
            refundResult.IsRefundSuccess = false;
            refundResult.ErrorCode = 'Refund is failed';
            refundResult.ErrorText = 'Not valid card details in payload';
            throw new Error('Card ID: ' + this.cardData.CardFields.LoyaltyCreditUserId + '. Not valid card details in payload. RefundedBalanceInGiftCardCurrency = ' + refundResult.RefundedBalanceInGiftCardCurrency + '. RefundedBalanceInCustomerCurrency = ' + refundResult.RefundedBalanceInCustomerCurrency);
        }
        // store refund request
        this.storeJsonPayload('refundRequestJSON', this.cardData, lcStorage);
        lcStorage.custom.currentBalance += refundResult.RefundedBalanceInGiftCardCurrency;
        // update result
        refundResult.IsRefundSuccess = true;
        // store refund result
        this.storeJsonPayload('refundResponseJSON', refundResult, lcStorage);
        Transaction.commit();
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. REFUND_LOYALTY_CARD : {0}', this.logger.message(e));
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
LoyaltyCard.prototype.storeJsonPayload = function (jsonCustomAttribute, payloadData, storage) {
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
 * Gets Loyalty Card
 * @param {Object} cardData - Loyalty card data
 * @param {string} geOrderId - Global-e Order ID
 * @returns {Object} - Loyalty card
 */
function get(cardData, geOrderId) {
    var loyaltyCard = null;
    try {
        // loyalty card wrapper
        loyaltyCard = new LoyaltyCard(geOrderId);
        loyaltyCard.cardData = cardData;
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. GET_LOYALTY_CARD : {0}', this.logger.message(e));
    }
    return loyaltyCard;
}

module.exports = {
    get: get
};
