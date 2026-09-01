'use strict';

const GooglePayExpress = require('./googlePayExpress');
const googlePayHelper = require('../../helpers/googlePayHelper');
const api = require('../../helpers/api');
const loaderInstance = require('../../components/loader');
const AlertHandlerModel = require('../alertHandler');
const helper = require('../../helpers/helper');

const googlePayLoaderEl = document.querySelector('.js-paypal-googlepay-loader');

const paypalGooglePayConfig = helper.tryParseJSON(document.querySelector('.js-paypal-googlepay-button')
    ?.getAttribute('data-googlepay-config'));

let that;

class GooglePayCart extends GooglePayExpress {
    constructor() {
        super();

        that = this;
        that.loader = loaderInstance(googlePayLoaderEl);
        that.alertHandler = new AlertHandlerModel();
        that.googlePayConfig = paypalGooglePayConfig;
    }

    async onButtonClicked() {
        that.loader.show();
        that.alertHandler.hideAlerts();

        const isExpressCheckout = true;

        try {
            const basketData = await api.getBasketData();

            if (basketData.amount === 0) {
                this.loader.hide();
                that.alertHandler.showError(window.i18nMessages.ZERO_AMOUNT);

                return;
            }

            const baseRequest = googlePayHelper.getBaseGooglePayRequest(that.googlePayConfig);
            const paymentDataRequest = googlePayHelper.getPaymentDataRequest(
                basketData,
                that.googlePayConfig.allowedPaymentMethods,
                baseRequest
            );

            if (!window.paypalPreferences.isDigitalGoodsFlowEnabled) {
                await that.setShippingAddressParameters(paymentDataRequest);

                paymentDataRequest.shippingAddressParameters.allowedCountryCodes = that.paypalGooglePayConfig.allowedCountryCodes;
            }

            const paymentData = await that.paymentsClient.loadPaymentData(paymentDataRequest);
            const paymentSourceData = googlePayHelper.getGooglePayPaymentSourceFromPaymentData(
                paymentData,
                paypalGooglePayConfig.messages,
                paypalGooglePayConfig.pageFlow
            );

            const { id } = api.getPaypalOrderId({ paymentSourceData, isExpressCheckout });

            const confirmResult = await that.googlePayInstance.confirmOrder({
                orderId: id,
                paymentMethodData: paymentData.paymentMethodData,
                email: paymentData.email,
                shippingAddress: paymentData.shippingAddress
            });

            const currentPageFlow = window.paypalConstants.PAGE_FLOW_CART;

            googlePayHelper.proceedOrderPlacing.bind(that)(
                confirmResult,
                paymentData,
                currentPageFlow
            );
        } catch (error) {
            googlePayHelper.handleExpressCheckoutError.call(that, error);
        }
    }
}

module.exports = GooglePayCart;
