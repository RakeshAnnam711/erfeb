'use strict';

var AbstractPaymentProvider = require('*/cartridge/scripts/globale/alternativePayments/providers/AbstractPaymentProvider');

/**
 * Represents gift card provider
 * @constructor
 * @param {string} geOrderId - Global-e Order ID
 */
function GiftCardNative(geOrderId) {
    AbstractPaymentProvider.call(this, geOrderId);
    this.cardData = null;
}

/* Inherits AbstractPaymentProvider */
GiftCardNative.prototype = Object.create(AbstractPaymentProvider.prototype);

/**
 * Processes Global-e Validation API Call
 * @returns {Object|null} - Result object or null
 */
GiftCardNative.prototype.validate = function () {
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var geGiftCertificateHelpers = require('*/cartridge/scripts/helpers/geGiftCertificateHelpers');

    var validateResult = {
        IsValid: false,
        Balance: 0,
        CurrencyCode: '',
        IsGlobalEGiftCard: false
    };
    try {
        var gcStorage = GiftCertificateMgr.getGiftCertificateByCode(this.cardData.CardId);
        if (!gcStorage) {
            validateResult.ErrorCode = 'Validate is failed';
            validateResult.ErrorText = 'Card was not found';
            throw new Error('Card was not found. Card ID: ' + this.cardData.CardId);
        }
        var balance = this.checkBalance('redeemResponseJSON', gcStorage, 'RedeemTransactionResult', geGiftCertificateHelpers.redeemStatus.PENDING, 0);
        validateResult = {
            IsValid: !!(balance && gcStorage.custom.originalCurrencyCode),
            Balance: balance,
            CurrencyCode: gcStorage.custom.originalCurrencyCode,
            IsGlobalEGiftCard: true
        };
        if (!validateResult.IsValid) {
            validateResult.ErrorCode = 'Validate is failed';
            validateResult.ErrorText = 'Card is not valid';
            throw new Error('Card is not valid. Card ID: ' + this.cardData.CardId);
        }
    } catch (e) {
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. VALIDATE_GIFT_CERTIFICATE : {0}', this.logger.message(e));
    }
    return validateResult;
};

/**
 * Processes Global-e Redeem API Call
 * @returns {Object|null} - Result object or null
 */
GiftCardNative.prototype.redeem = function () {
    var redeemResult = this.cardData;
    var Transaction = require('dw/system/Transaction');
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var geGiftCertificateHelpers = require('*/cartridge/scripts/helpers/geGiftCertificateHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Transaction.begin();
    try {
        var gcStorage = GiftCertificateMgr.getGiftCertificateByCode(this.cardData.CardFields.CardId);
        if (!gcStorage) {
            redeemResult.ErrorCode = 'Redeem is failed';
            redeemResult.ErrorText = 'Card was not found';
            throw new Error('Card was not found. Card ID: ' + this.cardData.CardFields.CardId);
        }
        // store redeem request
        this.storeJsonPayload('redeemRequestJSON', this.cardData, gcStorage);
        // capture amount

        var diffBalance = this.checkBalance('redeemResponseJSON', gcStorage, 'RedeemTransactionResult', geGiftCertificateHelpers.redeemStatus.PENDING, this.cardData.BalanceUsedInCardCurrency);
        if (isNaN(diffBalance) || diffBalance < 0) { // eslint-disable-line no-restricted-globals
            redeemResult.ErrorCode = 'Redeem is failed';
            redeemResult.ErrorText = 'Amount of card balance is not enough for Redeem operation';
            throw new Error('Amount of card balance is not enough for Redeem operation. Card ID: ' + this.cardData.CardFields.CardId);
        }
        gcStorage.custom.currentBalance = diffBalance;
        // set RedeemTransactionId
        redeemResult.RedeemTransactionId = new Date().getTime();
        redeemResult.RedeemTransactionResult = geGiftCertificateHelpers.redeemStatus.PENDING;
        // store redeem result
        this.storeJsonPayload('redeemResponseJSON', redeemResult, gcStorage);
        Transaction.commit();

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.giftCertificate.afterGiftCertificateRedeem);
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
GiftCardNative.prototype.refund = function () {
    var refundResult = this.cardData;
    var cardId = refundResult.CardFields.CardId;
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var Transaction = require('dw/system/Transaction');
    var valuesUtils = require('*/cartridge/scripts/util/globale/values');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var geGiftCertificateHelpers = require('*/cartridge/scripts/helpers/geGiftCertificateHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Transaction.begin();
    try {
        var gcStorage = GiftCertificateMgr.getGiftCertificateByCode(cardId);
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

        var redeemJSON = valuesUtils.getJsonObjectFromString(gcStorage.custom.redeemResponseJSON, {});
        var currentRedeemTransaction = arrayUtils.find(redeemJSON, function (redeemTransaction) {
            return redeemTransaction.payload.RedeemTransactionId === Number(refundResult.RedeemTransactionId);
        });

        if (!currentRedeemTransaction) {
            refundResult.IsRefundSuccess = false;
            refundResult.ErrorCode = 'Refund is failed';
            refundResult.ErrorText = 'RedeemTransactionId was not found';
            throw new Error('RedeemTransactionId was not found. Card ID: ' + this.cardData.CardFields.CardId + 'RedeemTransactionId: ' + refundResult.RedeemTransactionId);
        }

        if (currentRedeemTransaction.payload.RedeemTransactionResult === geGiftCertificateHelpers.redeemStatus.PENDING) {
            currentRedeemTransaction.payload.RedeemTransactionResult = geGiftCertificateHelpers.redeemStatus.REFUNDED;
            gcStorage.custom.redeemResponseJSON = JSON.stringify(redeemJSON);
        } else if (currentRedeemTransaction.payload.RedeemTransactionResult === geGiftCertificateHelpers.redeemStatus.REDEEMED) {
            var gcData = {
                gePriceValue: refundResult.BalanceUsedInCardCurrency,
                recipientEmail: gcStorage.recipientEmail,
                recipientName: gcStorage.recipientName,
                senderName: gcStorage.senderName,
                message: gcStorage.message,
                orderNo: gcStorage.orderNo,
                geInternationalPrice: refundResult.BalanceUsedInCustomerCurrency,
                geCurrencyCode: refundResult.CustomerCurrencyCode,
                originalCurrencyCode: refundResult.GiftCardCurrencyCode
            };
            var status = geGiftCertificateHelpers.createGiftCertificate(gcData);
            if (status.isError()) {
                refundResult.IsRefundSuccess = false;
                refundResult.ErrorCode = 'Refund is failed';
                refundResult.ErrorText = 'New Gift Cart was not created';
                throw new Error('New Gift Cart was not created. Card ID: ' + this.cardData.CardId);
            }

            currentRedeemTransaction.payload.RedeemTransactionResult = geGiftCertificateHelpers.redeemStatus.REFUNDEDTONEW;
            gcStorage.custom.redeemResponseJSON = JSON.stringify(redeemJSON);
        }

        var balance = this.checkBalance('redeemResponseJSON', gcStorage, 'RedeemTransactionResult', geGiftCertificateHelpers.redeemStatus.PENDING, 0);
        gcStorage.custom.currentBalance = balance;
        // update result
        refundResult.IsRefundSuccess = true;
        // store refund result
        this.storeJsonPayload('refundResponseJSON', refundResult, gcStorage);
        Transaction.commit();

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.giftCertificate.afterGiftCertificateRefund);
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
GiftCardNative.prototype.storeJsonPayload = function (jsonCustomAttribute, payloadData, storage) {
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
 * Check Gift Certificate balance based on Global-e request
 * @param {string} jsonCustomAttribute - Custom attribute of storage
 * @param {dw.order.GiftCertificate} storage - SFCC Gift Certificate
 * @param {string} payloadAttribute - ''
 * @param {string} transactionStatus - ''
 * @param {number} amount - Amount to decrease
 * @returns {number} - Current GE gift cart balance
 */
GiftCardNative.prototype.checkBalance = function (jsonCustomAttribute, storage, payloadAttribute, transactionStatus, amount) {
    var valuesUtils = require('*/cartridge/scripts/util/globale/values');
    var jsonRecords = [];
    var balance = storage.getBalance().getValue();

    if (!jsonCustomAttribute || !storage || !payloadAttribute || !transactionStatus) {
        throw new Error('Invalid input arguments');
    }
    jsonRecords = valuesUtils.getJsonObjectFromString(storage.custom[jsonCustomAttribute], []);

    if (!jsonRecords) {
        jsonRecords = [];
    }

    jsonRecords.forEach(function (jsonRecord) {
        if (jsonRecord.payload && jsonRecord.payload[payloadAttribute] === transactionStatus) {
            balance -= jsonRecord.payload.BalanceUsedInCardCurrency;
        }
    });

    balance -= amount;

    return balance;
};

/**
 * Creates Gift Certificate based on a order's gift certificate line items
 * @param {dw.order.Order} order - SFCC order
 * @param {dw.order.GiftCertificateLineItem} giftCertificateLineItem - Gift Certificate Line Item
 */
function create(order, giftCertificateLineItem) {
    var Transaction = require('dw/system/Transaction');
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var GiftCertificate = require('dw/order/GiftCertificate');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Transaction.begin();
    try {
        var geGiftCertificateHelpers = require('*/cartridge/scripts/helpers/geGiftCertificateHelpers');

        var gcData = {
            gePriceValue: giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice],
            recipientEmail: giftCertificateLineItem.recipientEmail,
            recipientName: giftCertificateLineItem.recipientName,
            senderName: giftCertificateLineItem.senderName,
            message: giftCertificateLineItem.message,
            orderNo: order.getOrderNo(),
            geInternationalPrice: giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.geInternationalPrice],
            geCurrencyCode: order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode],
            originalCurrencyCode: order.getCurrencyCode(),
            giftCertificateLineItem: giftCertificateLineItem
        };

        if (!giftCertificateLineItem.getGiftCertificateID()) {
            geGiftCertificateHelpers.createGiftCertificate(gcData);
        } else {
            var giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(giftCertificateLineItem.getGiftCertificateID());
            if (giftCertificate) {
                giftCertificate.setStatus(GiftCertificate.STATUS_ISSUED);
                giftCertificate.setEnabled(true);

                geGiftCertificateHelpers.setGiftCertificateCustomAttr(giftCertificate, gcData);
            }
        }

        order.addNote('CREATE_GIFT_CARD', 'INFO: Creation is successful. ');
        Transaction.commit();

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.giftCertificate.afterGiftCertificateCreate);
    } catch (e) {
        Transaction.rollback();
        this.logger.error('ALTERNATIVE_PAYMENTS_ERROR. CREATE_GIFT_CERTIFICATE_LINE_ITEM : {0}', this.logger.message(e));
    }
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
        giftCard = new GiftCardNative(geOrderId);
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
