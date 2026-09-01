'use strict';

const api = require('../../helpers/api');
const helper = require('../../helpers/helper');
const appSwitchHelper = require('../../helpers/appSwitch');

const loaderInstance = require('../../components/loader');
const loaderContainerEl = document.querySelector('.paypalLoader');
const usedPaymentMethodNameEl = document.querySelector('.js-used-payment-method');
const savePaypalAccountEl = document.getElementById('savePaypalAccount');
const paypalButtonEl = document.querySelector('.js-paypal-button-on-cart-page, .js-paypal-button-on-billing-form, .js-paypal-button-on-product-page');

const lpms = [
    'sepa',
    'bancontact',
    'eps',
    'ideal',
    'mybank',
    'p24',
    'blik',
    'trustly',
    'multibanco'
];

const disableFunds = lpms.concat(['venmo']);

let that = null;

/**
 * Updates the PayPal button message amount based on the cart amount
 * @param {Object} btnInitResult Instance of the payment source button
 */
function updatePayPalButtonMessagesAmount(btnInitResult) {
    if (!btnInitResult) {
        return;
    }

    const buttonMessageStyle = helper.getPaypalButtonMessageStyle(this.payPalBtnContainerEl);

    if (buttonMessageStyle) {
        const updateAmount = () => {
            buttonMessageStyle.amount = helper.getPageAmount(helper.getPageType());

            btnInitResult.updateProps({
                message: buttonMessageStyle
            });
        };

        $('body').on('checkout:shippingMethodSelected', updateAmount);
    }
}

/**
 * Returns value whether LPM was used or not
 * @param {string} usedPaymentMethod - The payment method name
 * @returns {boolean} value whether LPM was used
 */
const isLpmUsed = usedPaymentMethod => {
    return lpms.indexOf(usedPaymentMethod) !== -1;
};

/**
 * Initiates a PayPalButtonBase model
 * @param {string} payPalBtnSelector A container class where PayPal button will be initiated
 */
function PayPalBaseModel(payPalBtnSelector) {
    const AlertHandlerModel = require('../alertHandler');
    const SessionStorageModel = require('../sessionStorage');

    this.alertHandler = new AlertHandlerModel();
    this.sessionInstance = new SessionStorageModel();

    this.payPalBtnSelector = payPalBtnSelector;
    this.payPalBtnContainerEl = document.querySelector(payPalBtnSelector);
    this.isDigitalGoodsFlowEnabled = window.paypalPreferences.isDigitalGoodsFlowEnabled;
    this.merchantName = window.paypalPreferences.merchantName;
    // In case if onClick is not triggered, the default value is paypal
    this.usedPaymentMethodName = window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
    this.loader = loaderInstance(loaderContainerEl);

    this.isBtnEligible = null;
    this.fundingSource = null;
    this.sdk = null;
    this.userIdToken = paypalButtonEl?.getAttribute('data-user-id-token');
    this.isCheckoutPage = true;
}

/**
 * Process the LPM flow
 */
PayPalBaseModel.prototype.processLpmFlow = function() {
    const SessionStorageModel = require('../sessionStorage');
    const sessionStorageInstance = new SessionStorageModel();

    api.finishLpmPayment(this.usedPaymentMethodName);

    sessionStorageInstance.clear();
};

/**
 * Process the generic (not Ba) Paypal button flow
 */
PayPalBaseModel.prototype.processGenericBtnFlow = function() {
    helper.updateBillingAddressForDigitalGoodsFlow();

    if (window.paypalPreferences.isStreamlinedCheckout) {
        helper.streamlinedCheckout.call(that, { isBillingPage: true });
    } else {
        document.querySelector('button.submit-payment').click();
        this.loader.hide();
    }
};

/**
 * Saves a used payment method to hidden input
 * @param {Object} data - object with data
 */
PayPalBaseModel.prototype.onClick = function(data) {
    if (data.fundingSource === that.sdk.FUNDING.CARD) {
        that.usedPaymentMethodName = window.paypalConstants.PAYMENT_METHOD_ID_Debit_Credit_Card;
    } else if (data.fundingSource === that.sdk.FUNDING.VENMO) {
        that.usedPaymentMethodName = window.paypalConstants.PAYMENT_METHOD_ID_VENMO;
    } else if ([that.sdk.FUNDING.PAYPAL, that.sdk.FUNDING.PAYLATER].includes(data.fundingSource)) {
        that.usedPaymentMethodName = window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
    } else {
        that.usedPaymentMethodName = data.fundingSource;
    }

    if (data.fundingSource === that.sdk.FUNDING.VENMO && document.querySelector('.js-venmo-loader')) {
        that.loader = loaderInstance(document.querySelector('.js-venmo-loader'));
    }

    if (usedPaymentMethodNameEl) {
        usedPaymentMethodNameEl.value = that.usedPaymentMethodName;
    }
};

/**
 * Gets purchase order id from api call
 * @param {Object} [options] - Options
 * @param {Object} [options.paymentSourceData] - paymentSource data object (optional)
 * @param {boolean} [options.isLocalPaymentMethod] - Local payment method ot not
 * @returns {string} id of order
 */
function getOrderIdFromPaypal(options) {
    const orderIdData = api.getPaypalOrderId(options);

    helper.throwIfError(orderIdData);

    return orderIdData.id;
}

/**
 * Gets purchase units object, creates order and returns object with data
 * @returns {Object} With purchase units, payer and application context
 */
PayPalBaseModel.prototype.createOrder = function() {
    let paymentSourceData;

    const emailAddress = that.payPalBtnContainerEl.dataset.customerEmail;
    const isLocalPaymentMethod = isLpmUsed(that.usedPaymentMethodName);

    if (isLocalPaymentMethod && that.isDigitalGoodsFlowEnabled) {
        const getAddressFieldsFromUI = require('base/checkout/address').methods.getAddressFieldsFromUI;
        const billingFormEl = document.getElementById('dwfrm_billing');

        const billingAddress = getAddressFieldsFromUI(billingFormEl);

        paymentSourceData = {
            isLpm: true,
            billingAddressDigitalGoods: {
                name: `${billingAddress.firstName} ${billingAddress.lastName}`,
                phone: {
                    phone_number: {
                        national_number: billingAddress.phone
                    }
                },
                email_address: document.querySelector('.customer-summary-email').value,
                address: {
                    address_line_1: billingAddress.address1,
                    address_line_2: billingAddress.address2,
                    admin_area_2: billingAddress.city,
                    admin_area_1: billingAddress.stateCode,
                    postal_code: billingAddress.postalCode,
                    country_code: billingAddress.countryCode
                }
            }
        };
    }

    appSwitchHelper.setCheckboxValueInLocalStorage(savePaypalAccountEl);

    if (savePaypalAccountEl?.checked) {
        paymentSourceData = {
            paypal: {
                experience_context: {
                    return_url: 'https://example.com/returnUrl',
                    cancel_url: 'https://example.com/cancelUrl',
                    brand_name: that.merchantName
                },
                attributes: {
                    vault: {
                        store_in_vault: 'ON_SUCCESS',
                        usage_type: 'MERCHANT'
                    }
                }
            }
        };

        helper.assignEmailToPaymentSource(paymentSourceData.paypal, emailAddress);
    }

    if (!paymentSourceData && (that.usedPaymentMethodName === window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL || !that.usedPaymentMethodName)) {
        paymentSourceData = {
            paypal: {
                experience_context: {
                    brand_name: that.merchantName
                }
            }
        };

        helper.assignEmailToPaymentSource(paymentSourceData.paypal, emailAddress);
    }

    if (!paymentSourceData && that.usedPaymentMethodName === window.paypalConstants.PAYMENT_METHOD_ID_VENMO) {
        paymentSourceData = {
            venmo: {
                experience_context: {
                    brand_name: that.merchantName
                }
            }
        };

        helper.assignEmailToPaymentSource(paymentSourceData.venmo, emailAddress);
    }

    return getOrderIdFromPaypal({ paymentSourceData, isLocalPaymentMethod, isExpressCheckout: !that.isCheckoutPage });
};

/**
 * Clears irrelevant errors
 * and clicks submit payment button OR Finish LPM flow
 * Is used with adjacent instances (cart, pdp)
 */
PayPalBaseModel.prototype.onApprove = function() {
    that.loader.show();

    // Using in case of LPM
    if (isLpmUsed(that.usedPaymentMethodName)) {
        that.processLpmFlow();
    } else {
        that.processGenericBtnFlow();
    }
};

/**
 * Hides loader on paypal widget closing without errors
 * Is used with adjacent instances (cart, pdp)
 */
PayPalBaseModel.prototype.onCancel = function() {
    that.loader.hide();
};

/**
 * Shows errors if paypal widget was closed with errors
 * Is used with adjacent instances (cart, pdp)
 * @param {Object} error - An error object
 */
PayPalBaseModel.prototype.onError = function(error) {
    that.loader.hide();
    that.alertHandler.hideAlerts();

    const lpmBtn = document.querySelector('.js-lpm-btn');

    if (error?.code === window.paypalConstants.ZERO_AMOUNT) {
        that.alertHandler.showError(window.i18nMessages.ZERO_AMOUNT);
    } else if (error?.message === window.paypalConstants.POPUP_CLOSE_DETECT_MESSAGE && lpmBtn) {

        const lpmBlockMessages = helper.tryParseJSON(lpmBtn.dataset.lpmMessages);

        that.alertHandler.showInfo(lpmBlockMessages.paymentNotProceedMsg);
        that.alertHandler.showError(lpmBlockMessages.closedPopupErrorMsg);
    } else if (error && savePaypalAccountEl?.checked) {
        that.alertHandler.showError(savePaypalAccountEl?.dataset.errorMessage);
        that.alertHandler.showError(window.i18nMessages.INTERNAL_SERVER_ERROR);
    } else if (helper.isInterruptionError(error)) {
        return;
    } else {
        that.alertHandler.showError(window.i18nMessages.INTERNAL_SERVER_ERROR);
    }
};

/**
 * Renders a button mark(tab)
 * @param {Object} [sdk=that.sdk] Paypal sdk object
 */
PayPalBaseModel.prototype.renderButtonMarks = function(sdk = that.sdk) {
    sdk.Marks({
        fundingSource: this.fundingSource
    }).render(`.js-${this.fundingSource}-mark`);
};

/**
 * Renders the payment fields for LPM
 */
PayPalBaseModel.prototype.renderPaymentFields = function() {
    window.paypalLpm.PaymentFields({
        fundingSource: this.fundingSource
    }).render(this.payPalBtnSelector);
};

/**
 * Shows a tab by funding source
 * @param {string} fs The funding source
 */
PayPalBaseModel.prototype.showButtonTab = function(fs) {
    document.querySelector(`.js-nav-item-${fs}`).classList.remove('d-none');
};

/**
 * Returns a generic PayPal's button parameter object
 * @returns {Object} A generic button parameters object
 */
PayPalBaseModel.prototype.createBtnGeneralOption = function() {
    that = this;

    const btnGeneralOptions = {
        appSwitchWhenAvailable: window.paypalPreferences.appSwitchEnabled,
        onClick: this.onClick,
        createOrder: this.createOrder.bind(this, this.payPalBtnSelector),
        onApprove: this.onApprove,
        onCancel: this.onCancel,
        onError: this.onError,
        style: helper.getPaypalButtonStyle(this.payPalBtnContainerEl)
    };

    const buttonMessage = helper.getPaypalButtonMessageStyle(this.payPalBtnContainerEl);

    if (buttonMessage) {
        const productId = helper.getProductId(this.payPalBtnContainerEl);

        if (productId) {
            btnGeneralOptions.message = helper.getButtonMessageByProductId(buttonMessage, productId);
        } else {
            buttonMessage.amount = helper.getPageAmount(helper.getPageType());
            btnGeneralOptions.message = buttonMessage;
        }
    }

    return btnGeneralOptions;
};

/**
 * Set color white or black for button (Debit/Credit Card and PayPal Credit)
 * @param {Object} property - PayPal general options (option style)
 * @param {string} fundingSource - Funding Source
 * @returns {void}
 */
PayPalBaseModel.prototype.setPayPalButtonColor = function(property, fundingSource) {
    // Only white and black colors are available for both Debit/Credit Card and PayPal Credit btn
    if ([this.sdk.FUNDING.CARD, this.sdk.FUNDING.CREDIT].includes(fundingSource)
    && !['white', 'black'].some(el => el === property.style.color)) {
        // Sets the default color in case if color is not available for both Debit/Credit Card or PayPal Credit btn
        if (fundingSource === this.sdk.FUNDING.CREDIT) {
            property.style.color = 'darkblue';
        } else {
            property.style.color = 'black';
        }
    }
};

/**
 * Initiates buttons for the PayPal tab
 * @param {Object} btnProperty The button property
 */
PayPalBaseModel.prototype.initBtnsForPayPalTab = function(btnProperty) {
    const eligibleFundingSources = that.sdk.getFundingSources().filter(fs => that.sdk.Buttons({
        fundingSource: fs
    }).isEligible());

    const PAYPAL_FS = that.sdk.FUNDING.PAYPAL;

    let isTabShown = false;
    let isButtonMessageRendered = false;

    if (eligibleFundingSources.length) {
        this.renderButtonMarks.call({
            fundingSource: PAYPAL_FS
        });

        const isPaypalCardFieldsEnabled = this.payPalBtnContainerEl.getAttribute('data-is-card-fields') === 'true'
            && helper.isCardFieldsEligible();

        eligibleFundingSources.forEach(fs => {
            const isEnabled = !disableFunds.includes(fs);
            const isCard = fs === that.sdk.FUNDING.CARD;
            const isPayPal = fs === that.sdk.FUNDING.PAYPAL;

            if (isEnabled && !(isCard && isPaypalCardFieldsEnabled)) {
                that.setPayPalButtonColor(btnProperty, fs);

                if (isButtonMessageRendered) {
                    btnProperty.message = null;
                }

                const btnInitResult = that.sdk.Buttons(Object.assign(btnProperty, {
                    fundingSource: fs
                }));

                that.defineAction(btnInitResult, isPayPal);

                isButtonMessageRendered = true;

                updatePayPalButtonMessagesAmount.call(this, btnInitResult);

                if (!isTabShown) {
                    // Shows the PayPal tab
                    this.showButtonTab(PAYPAL_FS);
                    isTabShown = true;
                }
            }
        });
    }
};

/**
 * Determines which action should be trigger depends on the button result
 * @param {Object} btnInitResult Instance of the payment source button
 * @param {boolean} isPayPal - Indicates whether the funding source is PayPal
 * @returns {void}
 */
PayPalBaseModel.prototype.defineAction = function(btnInitResult, isPayPal) {
    if (!btnInitResult.isEligible()) {
        return;
    }

    if (isPayPal) {
        appSwitchHelper.processReturnOrRender({
            button: btnInitResult,
            container: this.payPalBtnContainerEl,
            loader: this.loader
        });
    } else {
        btnInitResult.render(that.payPalBtnSelector);
    }
};

/**
 * Initiates a button by the provided funding source
 * @param {string} fs The function source(venmo, mybank...)
 * @param {Object} btnProperty The button property
 */
PayPalBaseModel.prototype.initBtnByFundingSource = function(fs, btnProperty) {
    const sdk = isLpmUsed(fs) ? window.paypalLpm : that.sdk;
    const btnInitResult = sdk.Buttons(Object.assign(btnProperty, {
        fundingSource: fs
    }));

    this.isBtnEligible = btnInitResult.isEligible();

    if (this.isBtnEligible) {
        if (this.isCheckoutPage) {
            this.renderButtonMarks(sdk);
            this.showButtonTab(fs);
        }

        btnInitResult.render(this.payPalBtnSelector);
        updatePayPalButtonMessagesAmount.call(this, btnInitResult);
    }
};

/**
 * Initiates a Paypal button on billing checkout page
 * Is used with adjacent instances (cart, pdp, pvp)
 * @param {string} fundingSource The funding source of payment method
 */
PayPalBaseModel.prototype.initPayPalButton = function(fundingSource) {
    this.loader.show();
    this.sdk = window.paypalSdkMiniCart || window.paypal;
    this.fundingSource = fundingSource || this.sdk.FUNDING.PAYPAL;

    const btnProperty = this.createBtnGeneralOption();

    if (fundingSource) {
        this.initBtnByFundingSource(fundingSource, btnProperty);
    } else {
        this.initBtnsForPayPalTab(btnProperty);
    }

    this.loader.hide();
};

module.exports = PayPalBaseModel;
