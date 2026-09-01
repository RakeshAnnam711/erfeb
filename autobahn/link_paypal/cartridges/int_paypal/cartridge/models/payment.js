const base = module.superModule;

const collections = require('*/cartridge/scripts/util/collections');
const paypalConstants = require('*/cartridge/config/constants');

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
    return collections.map(selectedPaymentInstruments, function(paymentInstrument) {
        const results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value
        };

        switch (paymentInstrument.paymentMethod) {
            case 'GIFT_CERTIFICATE':
                results.giftCertificateCode = paymentInstrument.giftCertificateCode;
                results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;

                break;
            case 'PayPal':
            case 'Venmo':
            case 'GooglePay':
            case 'ApplePay':
                const Resource = require('dw/web/Resource');

                results.paypalAccountHolder = paymentInstrument.custom.currentPaypalEmail;
                results.accountHolderResource = Resource.msg('paypal.checkout.confirmation.account.holder', 'locale', null);
                results.isVenmoUsed = paymentInstrument.custom.paymentId === paypalConstants.PAYMENT_METHOD_ID_VENMO;
                results.fundingSource = paymentInstrument.custom.paymentId;

                if (results.isVenmoUsed) {
                    results.paymentMethod = paymentInstrument.custom.paymentId;
                }

                break;
            case paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD:
                const PaymentMgr = require('dw/order/PaymentMgr');

                results.paymentMethodName = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getName();
                results.lastFour = paymentInstrument.creditCardNumberLastDigits;
                results.owner = paymentInstrument.creditCardHolder;
                results.expirationYear = paymentInstrument.creditCardExpirationYear;
                results.type = paymentInstrument.creditCardType;
                results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
                results.expirationMonth = paymentInstrument.creditCardExpirationMonth;

                break;
            // Local payment methods
            default:
                results.paypalAccountHolder = paymentInstrument.custom.paypalLpmAccountHolderName;
                results.fundingSource = paymentInstrument.custom.paymentId;
        }

        return results;
    });
}

/**
 * @constructor
 * @classdesc Payment class that represents payment information for the current basket
 *
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    const paymentInstruments = currentBasket.paymentInstruments;

    this.selectedPaymentInstruments = paymentInstruments
        ? getSelectedPaymentInstruments(paymentInstruments) : null;
}

module.exports = Payment;
