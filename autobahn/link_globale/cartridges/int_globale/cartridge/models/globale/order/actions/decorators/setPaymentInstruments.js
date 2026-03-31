'use strict';

/**
 * Set Global-e Payment Credit Card Info
 * @param {Object} payload - Request payload
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument
 */
function setGlobalePaymentCCInfo(payload, paymentInstrument) {
    var internationalDetails = payload.InternationalDetails;
    var primaryBilling = payload.PrimaryBilling;
    if (('CardNumberLastFourDigits' in internationalDetails) && internationalDetails.CardNumberLastFourDigits) {
        // set CC number
        paymentInstrument.setCreditCardNumber('************' + internationalDetails.CardNumberLastFourDigits);

        // set CC holder
        if (
            (('FirstName' in primaryBilling) && primaryBilling.FirstName) &&
            (('LastName' in primaryBilling) && primaryBilling.LastName)
        ) {
            paymentInstrument.setCreditCardHolder(primaryBilling.FirstName + ' ' + primaryBilling.LastName);
        }

        // set CC type
        if (('PaymentMethodName' in internationalDetails) && internationalDetails.PaymentMethodName) {
            paymentInstrument.setCreditCardType(internationalDetails.PaymentMethodName);
        }

        // set CC expiration date
        if (('ExpirationDate' in internationalDetails) && internationalDetails.ExpirationDate) {
            var ccExpDate = internationalDetails.ExpirationDate.split('-');
            if (ccExpDate && ccExpDate.length > 1) {
                paymentInstrument.setCreditCardExpirationYear(Number(ccExpDate[0]));
                paymentInstrument.setCreditCardExpirationMonth(Number(ccExpDate[1]));
            }
        }
    }
}

/**
 * Set Transaction Data
 * @param {Object} transactionData - Transaction Data
 */
function setTransactionData(transactionData) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var paymentTransaction = transactionData.paymentTransaction;

    if (paymentTransaction) {
        // update payment transaction
        paymentTransaction.setPaymentProcessor(transactionData.paymentProcessor);
        paymentTransaction.setTransactionID(transactionData.transactionID);
        paymentTransaction.setAmount(transactionData.amount);

        // update custom attributes of payment transaction
        // set payment method name
        if (transactionData.paymentMethodName) {
            paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodName] = transactionData.paymentMethodName;
        }

        // set payment method type
        if (transactionData.paymentMethodType) {
            paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodType] = transactionData.paymentMethodType;
        }

        // set payment amount in customer currency
        if (!isNaN(transactionData.paymentAmountInCustomerCurrency)) { // eslint-disable-line no-restricted-globals
            paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentAmountInCustomerCurrency] = Number(transactionData.paymentAmountInCustomerCurrency);
        }

        // set payment details
        if (transactionData.paymentDetails) {
            paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentDetails] = JSON.stringify(transactionData.paymentDetails);
        }

        // set alternative payment details
        if (transactionData.alternativePaymentDetails) {
            paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.geAlternativePaymentDetails] = JSON.stringify(transactionData.alternativePaymentDetails);
        }
    }
}

/**
 * Get Gift Card Details
 * @param {Object} payload - Request payload
 * @param {Array} giftCardFields - Gift Card Fields
 * @returns {Object|null} - Gift Card details or null
 */
function getGiftCardDetails(payload, giftCardFields) {
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var giftCardTypesMapping = {
        CardId: 1,
        LoyaltyCreditUserId: 2
    };

    var giftCardType = null;
    var giftCardID = null;
    var giftCardDetails = null;

    // get gift card type and gift card ID
    giftCardFields.some(function (gcField) {
        if (gcField && ('FieldApiName' in gcField) && (gcField.FieldApiName in giftCardTypesMapping)) {
            giftCardType = giftCardTypesMapping[gcField.FieldApiName];
            giftCardID = gcField.FieldValue || null;
            return true; // stop iterating once the match is found
        }
        return false;
    });
    if (giftCardID === null) {
        return null;
    }

    // get gift card details
    giftCardDetails = arrayUtils.find((payload.GiftCards || []), function (giftCard) {
        return (
            giftCard &&
            ('GiftCardTypeId' in giftCard) &&
            giftCardType === giftCard.GiftCardTypeId &&
            ('CardFields' in giftCard) &&
            (
                (('CardId' in giftCard.CardFields) && giftCardID === giftCard.CardFields.CardId) ||
                (('LoyaltyCreditUserId' in giftCard.CardFields) && giftCardID === giftCard.CardFields.LoyaltyCreditUserId)
            )
        );
    });

    return giftCardDetails || null;
}

/**
 * Set Regular Payment Instrument
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload payload - Request payload
 * @param {dw.value.Money} amount - Payment instrument amount
 * @param {Object} paymentDetails - Global-e payment details
 * @returns {dw.system.Status} - Set payment instruments status
 */
function setRegularPaymentInstrument(order, payload, amount, paymentDetails) {
    var Status = require('dw/system/Status');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // get payment method
    var paymentMethod = PaymentMgr.getPaymentMethod(globaleHelpers.paymentMethod.GLOBALE);
    if (!paymentMethod) {
        return new Status(Status.ERROR, '303', 'Payment Method ' + globaleHelpers.paymentMethod.GLOBALE + ' is not defined in SFCC');
    }

    // get payment processor
    var paymentProcessor = paymentMethod.getPaymentProcessor();
    if (!paymentProcessor) {
        return new Status(Status.ERROR, '306', 'Impossible to get ' + globaleHelpers.paymentMethod.GLOBALE + ' payment processor');
    }

    // create payment instrument
    var paymentInstrument = order.createPaymentInstrument(paymentMethod.ID, amount);
    if (!paymentInstrument) {
        return new Status(Status.ERROR, '305', 'Can\'t create PaymentInstrument with ID=' + paymentMethod.ID + ' and amount=' + amount.valueOrNull);
    }

    // get payment transaction
    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    if (!paymentTransaction) {
        return new Status(Status.ERROR, '307', 'Impossible to get ' + paymentMethod.ID + ' payment transaction');
    }

    // define transaction data
    var transactionData = {
        transactionID: payload.OrderId || order.orderNo,
        amount: amount,
        paymentMethod: paymentMethod,
        paymentProcessor: paymentProcessor,
        paymentTransaction: paymentTransaction,
        paymentMethodName: paymentDetails.PaymentMethodName,
        paymentMethodType: globaleHelpers.consts.gePaymentType,
        paymentAmountInCustomerCurrency: paymentDetails.PaidAmountInCustomerCurrency,
        paymentDetails: paymentDetails
    };

    // set transaction data
    setTransactionData(transactionData);

    // set credit card info
    setGlobalePaymentCCInfo(payload, paymentInstrument);

    return new Status(Status.OK);
}

/**
 * Redeem Gift Certificate
 * @param {Object} payload - request payload
 * @param {Object} giftCard - gift cart payment instrument
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument
 * @param {string} currencyCode - order currency code
 * @returns {dw.system.Status} - set redeem gift certificate status
 */
function redeemGiftCertificate(payload, giftCard, paymentInstrument, currencyCode) {
    var Status = require('dw/system/Status');
    var Money = require('dw/value/Money');
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var valuesUtils = require('*/cartridge/scripts/util/globale/values');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geGiftCertificateHelpers = require('*/cartridge/scripts/helpers/geGiftCertificateHelpers');

    var status;
    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    var amount = new Money(paymentTransaction.getAmount().getValue(), currencyCode);
    try {
        var giftCertificateCode = giftCard.CardFields.CardId;
        var giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);
        if (!giftCertificate || (giftCertificate && !giftCertificate.enabled)) {
            return new Status(Status.ERROR, '307', 'Impossible to get ' + giftCertificateCode + ' gift certificate');
        }
        var redeemJSON = valuesUtils.getJsonObjectFromString(giftCertificate.custom.redeemResponseJSON, []);
        if (!redeemJSON) {
            redeemJSON = [];
        }
        var currentRedeemTransaction = arrayUtils.find(redeemJSON, function (redeemTransaction) {
            return redeemTransaction.payload.RedeemTransactionId === Number(giftCard.RedeemTransactionId);
        });
        if (!currentRedeemTransaction) {
            return new Status(Status.ERROR, '307', 'Impossible to get ' + giftCard.RedeemTransactionId + ' RedeemTransactionId');
        }

        if (currentRedeemTransaction.payload.RedeemTransactionResult === geGiftCertificateHelpers.redeemStatus.PENDING) {
            var giftCardAmount = new Money(giftCard.BalanceUsedInCardCurrency, currencyCode);
            paymentTransaction.setAmount(giftCardAmount);
            paymentInstrument.setGiftCertificateCode(giftCertificateCode);
            status = GiftCertificateMgr.redeemGiftCertificate(paymentInstrument);
            paymentTransaction.setAmount(amount);
            giftCertificate.custom[globaleHelpers.customAttr.giftCertificateLineItem.currentBalance] = giftCertificate.getBalance().getValue();
            if (status.isError()) {
                return new Status(Status.ERROR, status.getCode(), status.getMessage());
            }
            currentRedeemTransaction.payload.RedeemTransactionResult = geGiftCertificateHelpers.redeemStatus.REDEEMED;
            giftCertificate.custom.redeemResponseJSON = JSON.stringify(redeemJSON);
        }
    } catch (e) {
        paymentTransaction.setAmount(amount);

        return new Status(Status.ERROR, '204', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

/**
 * Set Gift Card Payment Instrument
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload payload - Request payload
 * @param {dw.value.Money} amount - Payment instrument amount
 * @param {Object} paymentDetails - Global-e payment details
 * @returns {dw.system.Status} - Set payment instruments status
 */
function setGiftCardPaymentInstrument(order, payload, amount, paymentDetails) {
    var Status = require('dw/system/Status');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // get payment method
    var paymentMethod = PaymentMgr.getPaymentMethod(globaleHelpers.paymentMethod.GLOBALE);
    if (!paymentMethod) {
        return new Status(Status.ERROR, '303', 'Payment Method ' + globaleHelpers.paymentMethod.GLOBALE + ' is not defined in SFCC');
    }

    // get payment processor
    var paymentProcessor = paymentMethod.getPaymentProcessor();
    if (!paymentProcessor) {
        return new Status(Status.ERROR, '306', 'Impossible to get ' + globaleHelpers.paymentMethod.GLOBALE + ' payment processor');
    }

    // create payment instrument
    var paymentInstrument = order.createPaymentInstrument(paymentMethod.ID, amount);
    if (!paymentInstrument) {
        return new Status(Status.ERROR, '305', 'Can\'t create PaymentInstrument with ID=' + paymentMethod.ID + ' and amount=' + amount.valueOrNull);
    }

    // get payment transaction
    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    if (!paymentTransaction) {
        return new Status(Status.ERROR, '307', 'Impossible to get ' + paymentMethod.ID + ' payment transaction');
    }

    // get gift card details
    var giftCardsDetails;
    try {
        giftCardsDetails = getGiftCardDetails(payload, (JSON.parse(paymentDetails.GiftCardFields) || []));

        if (globaleHelpers.isNativeGiftCertificateEnabled()) {
            var redeemGiftCertificateStatus = redeemGiftCertificate(payload, giftCardsDetails, paymentInstrument, order.currencyCode);

            if (redeemGiftCertificateStatus.isError()) {
                throw new Error(redeemGiftCertificateStatus);
            }
        }
    } catch (e) {
        return new Status(Status.ERROR, '309', (e.message + '; ' + e.stack));
    }

    // define transaction data
    var transactionData = {
        transactionID: payload.OrderId || order.orderNo,
        amount: amount,
        paymentMethod: paymentMethod,
        paymentProcessor: paymentProcessor,
        paymentTransaction: paymentTransaction,
        paymentMethodName: paymentDetails.PaymentMethodName,
        paymentAmountInCustomerCurrency: paymentDetails.PaidAmountInCustomerCurrency,
        paymentDetails: paymentDetails,
        alternativePaymentDetails: giftCardsDetails
    };

    if (giftCardsDetails && giftCardsDetails.GiftCardTypeId === 1) { // gift card payment type
        transactionData.paymentMethodType = globaleHelpers.consts.geGiftCardPaymentType;
    } else if (giftCardsDetails && giftCardsDetails.GiftCardTypeId === 2) { // loyalty card payment type
        transactionData.paymentMethodType = globaleHelpers.consts.geLoyaltyCardPaymentType;
    }

    // set transaction data
    setTransactionData(transactionData);

    return new Status(Status.OK);
}

/**
 * Set Payment Instrument(s) to SFCC Order
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - Request payload
 * @returns {dw.system.Status} - Set payment instruments status
 */
function setPaymentInstruments(order, payload) {
    var Status = require('dw/system/Status');
    var Money = require('dw/value/Money');
    var collections = require('*/cartridge/scripts/util/globale/collections');

    // remove All Payment Instruments
    collections.forEach(order.getPaymentInstruments(), function (pInstrument) {
        order.removePaymentInstrument(pInstrument);
    }, this);

    // process Global-e payment methods
    var status;
    (payload.OrderPaymentMethods || []).every(function (paymentDetails, index) {
        var amount = index === 0 ? order.getTotalGrossPrice() : new Money(0, order.currencyCode); // set order total to first payment instrument amount

        if (paymentDetails.IsGiftCard === true) { // gift card payment
            status = setGiftCardPaymentInstrument(order, payload, amount, paymentDetails);
        } else { // regular payment
            status = setRegularPaymentInstrument(order, payload, amount, paymentDetails);
        }

        return !status.isError(); // continue iterating if there is no error, stop if there is an error
    });

    // check return status
    if (status && status.isError()) {
        return status;
    }

    this.addNote('Global-e PaymentInstruments have been updated');
    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setPaymentInstruments', {
        value: setPaymentInstruments
    });
};
