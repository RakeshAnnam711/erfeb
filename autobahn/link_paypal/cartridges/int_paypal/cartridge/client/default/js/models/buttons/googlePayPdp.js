'use strict';

const GooglePayExpress = require('./googlePayExpress');
const googlePayHelper = require('../../helpers/googlePayHelper');
const helper = require('../../helpers/helper');
const api = require('../../helpers/api');
const loaderInstance = require('../../components/loader');

const googlePayLoaderSelector = '.js-paypal-googlepay-loader';

let that;

/**
 * Initiates a GooglePayPdp model
 */
class GooglePayPdp extends GooglePayExpress {
    constructor() {
        super();
        that = this;
    }

    /**
     * On Button click behavior
     * @param {string} googlePayButtonSelector selector for Google Pay button
     */
    onButtonClicked = async function(googlePayButtonSelector) {
        const buttonWrapEl = document.querySelector(googlePayButtonSelector).closest('.js-googlepay-pdp-button-wrap');
        const googlePayLoaderEl = buttonWrapEl.querySelector(googlePayLoaderSelector);

        that.loader = loaderInstance(googlePayLoaderEl);
        that.loader.show();

        that.alertHandler.hideAlerts();

        const addToCartResult = helper.addProductToCart(googlePayButtonSelector);

        if (!addToCartResult.error) {
            const totalAmount = addToCartResult.cart.totals.grandTotal.replace(/[^.\d]/g, '');

            // in case user used PromoCode on cart page and return to PDP/PVP
            if (parseFloat(totalAmount) === 0) {
                that.loader.hide();
                that.alertHandler.showError(window.i18nMessages.ZERO_AMOUNT);

                return;
            }

            const amount = {
                currencyCode: addToCartResult.cart.items[0].price.sales.currency,
                amount: totalAmount
            };

            const baseRequest = googlePayHelper.getBaseGooglePayRequest(that.paypalGooglePayConfig);
            const paymentDataRequest = googlePayHelper.getPaymentDataRequest(amount,
                that.googlePayConfig.allowedPaymentMethods,
                baseRequest);

            if (!window.paypalPreferences.isDigitalGoodsFlowEnabled) {
                await that.setShippingAddressParameters(paymentDataRequest);

                paymentDataRequest.shippingAddressParameters.allowedCountryCodes = that.paypalGooglePayConfig.allowedCountryCodes;
            }

            const isExpressCheckout = true;

            that.paymentsClient.loadPaymentData(paymentDataRequest)
                .then((paymentData) => {
                    const paymentSourceData = googlePayHelper.getGooglePayPaymentSourceFromPaymentData(
                        paymentData,
                        that.paypalGooglePayConfig.messages,
                        that.paypalGooglePayConfig.pageFlow
                    );

                    const { id } = api.getPaypalOrderId({ paymentSourceData, isExpressCheckout });

                    that.googlePayInstance.confirmOrder({
                        orderId: id,
                        paymentMethodData: paymentData.paymentMethodData,
                        email: paymentData.email,
                        shippingAddress: paymentData.shippingAddress
                    })
                        .then(confirmOrderResponse => {
                            const currentPageFlow = window.paypalConstants.PAGE_FLOW_PDP;

                            googlePayHelper.proceedOrderPlacing.bind(that)(
                                confirmOrderResponse,
                                paymentData,
                                currentPageFlow
                            );
                        });
                })
                .catch((error) => {
                    googlePayHelper.handleExpressCheckoutError.call(that, error);

                    helper.removeAllProductsFromCart();
                });
        }
    };

    /**
     * Initiates the GooglePay functionality
     * @param {string} selector GooglePay element selector
     */
    initGooglePay = async function(selector) {
        this.googlePayConfig = await that.googlePayInstance.config();

        if (this.googlePayConfig.isEligible) {
            this.addGooglePayButton(selector);
        }
    };
}

module.exports = GooglePayPdp;
