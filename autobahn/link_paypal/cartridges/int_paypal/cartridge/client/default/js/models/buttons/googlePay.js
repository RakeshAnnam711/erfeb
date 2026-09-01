'use strict';

let that;

const AlertHandlerModel = require('../alertHandler');
const helper = require('../../helpers/helper');
const googlePayHelper = require('../../helpers/googlePayHelper');
const api = require('../../helpers/api');
const loaderInstance = require('../../components/loader');

class GooglePayBase {
    constructor() {
        that = this;

        const paypalSdk = window.paypalSdkMiniCart || window.paypal;
        const paymentDataCallbacks = {
            onPaymentAuthorized: () => Promise.resolve({ transactionState: 'SUCCESS' })
        };

        this.googlePayInstance = paypalSdk.Googlepay();

        this.alertHandler = new AlertHandlerModel();
        this.paypalGooglePayConfig = helper.tryParseJSON(document.querySelector('.js-paypal-googlepay-button')
            ?.getAttribute('data-googlepay-config'));

        if (!this.paypalGooglePayConfig) {
            return;
        }

        this.googlePayMessages = this.paypalGooglePayConfig.messages;
        this.paymentsClient = new google.payments.api.PaymentsClient({
            environment: that.paypalGooglePayConfig.instanceType, // TEST/PRODUCTION
            merchantInfo: {
                merchantId: that.paypalGooglePayConfig.googleMerchantId
            },
            paymentDataCallbacks: paymentDataCallbacks
        });
    }

    /**
     * Create, config and add GooglePay button on billing page
     * @param {string} [selector] - GooglePay button selector
     */
    addGooglePayButton(selector = `.js-googlepay-${this.paypalGooglePayConfig.pageFlow}-btn`) {
        const isNoGooglePayBtn = document.querySelector(selector)?.childElementCount === 0;

        if (isNoGooglePayBtn) {
            const isReadyToPayRequest = googlePayHelper.getBaseGooglePayRequest(this.paypalGooglePayConfig);

            isReadyToPayRequest.allowedPaymentMethods = this.googlePayConfig.allowedPaymentMethods;

            this.paypalGooglePayConfig.buttonStyle.onClick = this.onButtonClicked.bind(this, selector);

            this.paymentsClient.isReadyToPay(isReadyToPayRequest)
                .then((response) => {
                    if (response.result) {
                        const button = that.paymentsClient.createButton(this.paypalGooglePayConfig.buttonStyle);
                        const googlePayButtonEl = document.querySelector(selector);

                        googlePayButtonEl.appendChild(button);
                    }
                })
                .catch(() => {
                    that.alertHandler.showError(that.googlePayMessages.INTERNAL_GOOGLE_PAY_ERROR_MESSAGE);
                });
        }
    }

    /**
     * on GooglePay button click
     */
    async onButtonClicked() {
        const googlePayLoaderEl = document.querySelector('.js-paypal-googlepay-loader');

        const isExpressCheckout = false;

        this.loader = loaderInstance(googlePayLoaderEl);
        this.loader.show();

        that.alertHandler.hideAlerts();

        const basketData = await api.getBasketData();
        const baseRequest = googlePayHelper.getBaseGooglePayRequest(that.paypalGooglePayConfig);
        const paymentDataRequest = googlePayHelper.getPaymentDataRequest(basketData,
            that.googlePayConfig.allowedPaymentMethods,
            baseRequest);

        if (basketData.amount === 0) {
            this.loader.hide();
            that.alertHandler.showError(window.i18nMessages.ZERO_AMOUNT);

            return;
        }

        that.paymentsClient.loadPaymentData(paymentDataRequest)
            .then((paymentData) => {
                const paymentSourceData = googlePayHelper.getGooglePayPaymentSourceFromPaymentData(
                    paymentData,
                    this.paypalGooglePayConfig.messages,
                    this.paypalGooglePayConfig.pageFlow
                );

                const orderIdData = api.getPaypalOrderId({ paymentSourceData, isExpressCheckout });

                helper.throwIfError(orderIdData);

                that.googlePayInstance
                    .confirmOrder({
                        orderId: orderIdData.id,
                        paymentMethodData: paymentData.paymentMethodData,
                        email: paymentData.email
                    })
                    .then((confirmOrderResponse) => {
                        const currentPageFlow = window.paypalConstants.PAGE_FLOW_BILLING;

                        googlePayHelper.proceedOrderPlacing.bind(that)(
                            confirmOrderResponse,
                            paymentData,
                            currentPageFlow);
                    });
            })
            .catch((error) => {
                this.loader.hide();

                if (error?.code !== window.paypalConstants.POPUP_GOOGLE_PAY_CLOSE_DETECT_CODE) {
                    that.alertHandler.showError(error.message);
                }
            });
    }

    /**
     * Initiates the GooglePay functionality
     */
    async initGooglePay() {
        this.googlePayConfig = await this.googlePayInstance.config();

        if (this.googlePayConfig.isEligible) {
            this.addGooglePayButton();
        }
    }
}

module.exports = GooglePayBase;
