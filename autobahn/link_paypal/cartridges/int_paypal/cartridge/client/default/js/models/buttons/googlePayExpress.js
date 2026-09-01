'use strict';

let that;

const GooglePayBase = require('./googlePay');

const helper = require('../../helpers/helper');

/**
 * Initiates a GooglePayExpress model (pvp, pdp, cart, mini-cart)
 */
class GooglePayExpress extends GooglePayBase {
    constructor() {
        super();

        that = this;

        if (!window.paypalPreferences.isDigitalGoodsFlowEnabled) {
            const paymentDataCallbacks = {
                onPaymentAuthorized: () => Promise.resolve({ transactionState: 'SUCCESS' }),
                onPaymentDataChanged: this.onPaymentDataChanged
            };

            this.paymentsClient = new google.payments.api.PaymentsClient({
                environment: that.paypalGooglePayConfig.instanceType, // TEST/PRODUCTION
                merchantInfo: {
                    merchantId: that.paypalGooglePayConfig.googleMerchantId
                },
                paymentDataCallbacks: paymentDataCallbacks
            });
        }
    }

    /**
    * Handles shipping address and shipping options callback intents.
    * @param {Object} intermediatePaymentData response from Google Pay API a shipping address or shipping option is selected in the payment sheet.
    * @returns {Promise} Promise of PaymentDataRequestUpdate object to update the payment sheet.
    */
    async onPaymentDataChanged(intermediatePaymentData) {
        const shippingAddress = intermediatePaymentData.shippingAddress;
        const paymentDataRequestUpdate = {};

        let isShippingMethodApplicable;

        const shippingOptionId = intermediatePaymentData.shippingOptionData.id;

        if (shippingAddress) {
            const { applicableShippingMethods }
                = await helper.getApplicableShippingOptions(window.paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY, shippingAddress);

            if (applicableShippingMethods) {
                isShippingMethodApplicable = applicableShippingMethods.find((shippingMethod) => shippingMethod.id === shippingOptionId);
            }
        }

        if ([
            window.paypalConstants.INTENT_INITIALIZE,
            window.paypalConstants.INTENT_SHIPPING_ADDRESS
        ].includes(intermediatePaymentData.callbackTrigger)) {
            // Showing error if store doesn't ship to the address selected in Google Pay
            if (!shippingAddress) {
                return Promise.reject(paymentDataRequestUpdate);
            }

            if (!isShippingMethodApplicable) {
                paymentDataRequestUpdate.error = that.getPaymentDataError(window.paypalConstants.INTENT_SHIPPING_ADDRESS);
            }

        } else if (intermediatePaymentData.callbackTrigger === window.paypalConstants.INTENT_SHIPPING_OPTION) {
            // Showing error if store doesn't ship to the address selected in Google Pay
            if (!isShippingMethodApplicable) {
                paymentDataRequestUpdate.error = that.getPaymentDataError(window.paypalConstants.INTENT_SHIPPING_OPTION);
            }

            // Recalculation amount taking into account new shipping price
            // Showing new amount in Google Pay
            const { amount, currencyCode } = await helper.updateAmountForShippingOption(
                shippingOptionId,
                that.paypalGooglePayConfig.getAmountForShippingOptionUrl
            );

            paymentDataRequestUpdate.newTransactionInfo = {
                currencyCode: currencyCode,
                totalPriceStatus: 'FINAL',
                totalPrice: amount,
                totalPriceLabel: 'Final'
            };
        }

        return Promise.resolve(paymentDataRequestUpdate);
    }

    /**
    * Sets shipping address parameters and applicable shipping options to the Google Pay request
    * @param {Object} paymentDataRequest base GooglePay request
    */
    async setShippingAddressParameters(paymentDataRequest) {
        paymentDataRequest.callbackIntents.push(window.paypalConstants.INTENT_SHIPPING_ADDRESS, window.paypalConstants.INTENT_SHIPPING_OPTION);

        paymentDataRequest.shippingAddressRequired = true;
        paymentDataRequest.shippingAddressParameters = { phoneNumberRequired: true };
        paymentDataRequest.shippingOptionRequired = true;

        const applicableShippingMethods = await helper.getApplicableShippingOptions(window.paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY);

        paymentDataRequest.shippingOptionParameters = {
            defaultSelectedOptionId: applicableShippingMethods.defaultSelectedOptionId,
            shippingOptions: applicableShippingMethods.applicableShippingMethods
        };
    }

    /**
     * Creates a Google Pay error object to show on Google Pay popup
     * @param {string} intent Intent of Google Pay error
     * @returns {Object} An error object
     */
    getPaymentDataError(intent) {
        const intentErrorMap = {
            [window.paypalConstants.INTENT_SHIPPING_OPTION]: {
                reason: window.paypalConstants.REASON_SHIPPING_OPTION_INVALID,
                message: that.paypalGooglePayConfig.messages.SHIPPING_OPTION_INVALID
            },
            [window.paypalConstants.INTENT_SHIPPING_ADDRESS]: {
                reason: window.paypalConstants.REASON_SHIPPING_ADDRESS_UNSERVICEABLE,
                message: that.paypalGooglePayConfig.messages.SHIPPING_ADDRESS_UNSERVICEABLE
            }
        };

        if (intentErrorMap[intent]) {
            return {
                ...intentErrorMap[intent],
                intent: intent
            };
        }

        return {};
    }
}

module.exports = GooglePayExpress;
