'use strict';

/**
 * customize and modify the CCAuth request.
 *
 * @param {Object} requestIn - The request object about to be sent to Cybersource.
 * @param {dw.order.Basket} basket - basket for current order
 * @returns {Object} - A modified version of requestIn.
 */
function CCAuth(requestIn, basket) {
    return addGiftCertificatePaymentInstrumentToRequest(requestIn, basket);
}

/**
 * customize and modify the mobilPaymentAuth request (applepay)
 *
 * @param {Object} requestIn - The request object about to be sent to Cybersource.
 * @param {dw.order.Basket} basket - basket for current order
 * @returns {Object} - A modified version of requestIn.
 */
function mobilePaymentAuth(requestIn, basket) {
    return addGiftCertificatePaymentInstrumentToRequest(requestIn, basket);
}

function addGiftCertificatePaymentInstrumentToRequest(requestIn, basket) {
    try {
        var reference = webreferences2.CyberSourceTransaction
        for (var i in basket.giftCertificatePaymentInstruments) {
            var paymentInstrument = basket.giftCertificatePaymentInstruments[i];
            requestIn.merchantDefinedData = requestIn.merchantDefinedData || new reference.MerchantDefinedData();
            requestIn.merchantDefinedData['field' + (i + 1)] = 'Gift Certificate ' + paymentInstrument.maskedGiftCertificateCode + ' for amount ' + dw.util.StringUtils.formatMoney(paymentInstrument.paymentTransaction.amount);
        }
    } catch (e) {
        dw.system.Logger.error('error attempting to attach gift certificate information to cybersource authorization ' + e.msg);
    }

    return requestIn;
}

exports.CCAuth = CCAuth;
exports.mobilePaymentAuth = mobilePaymentAuth;
exports.addGiftCertificatePaymentInstrumentToRequest = addGiftCertificatePaymentInstrumentToRequest;
