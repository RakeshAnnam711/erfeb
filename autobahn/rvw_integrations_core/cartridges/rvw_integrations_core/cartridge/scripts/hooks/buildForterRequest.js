'use strict';

/**
 * hook to create forter api request payment object
 * @return {Object} an object that contains the forter api object
 */
function buildPaymentRequest(authorizePaymentResult, paymentInstrument, order) {
    var result = {};
    var giftCard = {};
    var amount = {};

    if (paymentInstrument) {
        var giftCertificate = dw.order.GiftCertificateMgr.getGiftCertificateByCode(paymentInstrument.giftCertificateCode);
        if (giftCertificate) {
            if (giftCertificate.maskedGiftCertificateCode) {
                giftCard.merchantPaymentId = giftCertificate.maskedGiftCertificateCode;
            }
            if (giftCertificate.amount) {
                giftCard.creditCurrency = giftCertificate.amount.currencyCode;
                giftCard.originalValue = {
                    currency: giftCertificate.amount.currencyCode,
                    amountLocalCurrency: giftCertificate.amount.decimalValue.toString()
                }
            }
            if (giftCertificate.recipientEmail) {
                giftCard.emailOriginallySentTo = giftCertificate.recipientEmail;
            }
            var order = dw.order.OrderMgr.getOrder(giftCertificate.orderNo);
            if (order) {
                if (order.customerEmail) {
                    giftCard.emailOriginallySentFrom = order.customerEmail;
                }
                if (order.creationDate) {
                    giftCard.activationTime = new Number(order.creationDate.toUTCString());
                }
            }
        }
        if (paymentInstrument.paymentTransaction && paymentInstrument.paymentTransaction.amount) {
            if (paymentInstrument.paymentTransaction.amount.valueOrNull) {
                giftCard.value = {
                    currency: paymentInstrument.paymentTransaction.amount.currencyCode,
                    amountLocalCurrency: paymentInstrument.paymentTransaction.amount.decimalValue.toString()
                }
                amount.amountLocalCurrency = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
                amount.currency = paymentInstrument.paymentTransaction.amount.currencyCode;
            }
        }
    }

    if (Object.keys(giftCard).length) {
        result.giftCard = giftCard
    }
    if (Object.keys(amount).length) {
        result.amount = amount;
    }

    if (Object.keys(result).length) {
        return result;
    } else {
        return '';
    }
}

exports.buildPaymentRequest = buildPaymentRequest;
