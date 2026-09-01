'use strict';

const SessionStorageModel = require('./models/sessionStorage');
const AlertHandlerModel = require('./models/alertHandler');

const sessionStorageInstance = new SessionStorageModel();

const helper = require('./helpers/helper');

const lpmBtns = document.querySelectorAll('.js-lpm-btn');
const applePayContentEl = document.querySelector('.js-apple-pay-content');
const billingAddressSelectorEl = document.getElementById('billingAddressSelector');
const amount = helper.getFloatFromAmount(document.querySelector('.grand-total-sum').textContent);
const isOrderZeroAmount = !Number.isNaN(amount) && amount === 0;
const alertHandler = new AlertHandlerModel();

if (window.paypalPreferences.isDigitalGoodsFlowEnabled) {
    $('.js-submit-shipping').on('click', function() {
        const ShipmentsDomModel = require('./models/shipmentsDom');
        const billingAddressHelpers = require('./helpers/billingAddressHelpers');

        const shipmentsDomInstance = new ShipmentsDomModel();
        const observer = new MutationObserver(billingAddressHelpers.billingAddressSelectorChange);

        observer.observe(billingAddressSelectorEl, { childList: true });

        shipmentsDomInstance.setOnlinePickUpShippingMethod();
    });
}

const billingHelper = require('./billing/billingHelper');

const paypalAccountsListEl = document.getElementById('restPaypalAccountsList');
const isPPAccountsListNotEmpty = paypalAccountsListEl?.options?.length > 1;

const activatePayPalButtonTab = () => {
    const paypalButtonTab = document.querySelector('.nav-item .js-paypal-tab');
    const tabHash = paypalButtonTab.hash;

    billingHelper.handleTabChange(tabHash, sessionStorageInstance);
};

billingHelper.initPaymentStageBehavior();

$('body').on('checkout:updateCheckoutView', (e, data) => {
    e.stopPropagation();

    billingHelper.updateClientSide(data);
    helper.updateCheckoutView(data);
    helper.setDataAttributeCustomerEmail(data);

    if (data.order.paymentMethodId === 'GooglePay') {
        billingHelper.hideContinueButton();
    }

    billingHelper.updateSubmitOrderButton();
});

$('.payment-options[role=tablist] a[data-toggle="tab"]').on('shown.bs.tab', e => {
    billingHelper.handleTabChange(e, sessionStorageInstance);
});

if (window.paypal && lpmBtns.length) {
    const lpmsBuilder = require('./billing/lpmsBuilder');

    lpmsBuilder.initLpms(lpmBtns);
}

// Order id flow
if (window.paypal) {
    const PayPalBaseModel = require('./models/buttons/payPalBase');
    const payPalBaseInstance = new PayPalBaseModel('.js-paypal-button-on-billing-form');
    const venmoContentEl = document.querySelector('.js-venmo-content');
    const payPalContentEl = document.querySelector('.js-paypal-content');
    const paypalButtonTab = document.querySelector('.nav-item .js-paypal-tab');
    const venmoButtonTab = document.querySelector('.nav-item .js-venmo-tab');

    if (venmoContentEl) {
        const venmoBaseInstance = new PayPalBaseModel('.js-venmo-btn');

        venmoBaseInstance.initPayPalButton(window.paypal.FUNDING.VENMO);

        if (!payPalContentEl) {
            venmoButtonTab.click();
        }
    }

    if (payPalContentEl) {
        payPalBaseInstance.initPayPalButton();

        if (payPalBaseInstance.isDigitalGoodsFlowEnabled && helper.isPayPalButtonEligible()) {
            activatePayPalButtonTab();
        }
    }

    /* ---------- PayPal App Switch ---------- */
    if (window.paypalPreferences.appSwitchEnabled) {
        const appSwitchHelper = require('./helpers/appSwitch');

        appSwitchHelper.setupCheckoutStageNavigation();
        appSwitchHelper.addListenerOnSavePayPalCheckbox();
    }
}

const isFastlaneEnabled = Boolean(document.querySelector('.js-paypal-fastlane-content'));

if (isFastlaneEnabled) {
    const Fastlane = require('./fastlane/fastlane');

    new Fastlane().init();
}

if (isPPAccountsListNotEmpty && isOrderZeroAmount) {
    const continueButtonEl = document.querySelector('button.submit-payment');

    continueButtonEl.addEventListener('click', event => {
        const isPayPalTabActive = document.querySelector('.js-paypal-tab')?.classList.contains('active');

        if (isPayPalTabActive) {
            alertHandler.hideAlerts();

            event.preventDefault();
            event.stopPropagation();

            alertHandler.showError(window.i18nMessages.ZERO_AMOUNT);
        }
    });
}

if (paypalAccountsListEl) {
    paypalAccountsListEl.onchange = function(e) {
        const accountListEl = e ? e.target : paypalAccountsListEl;

        billingHelper.togglePaypalBtnVisibility(accountListEl);
    };
}

billingHelper.updateSubmitOrderButton();

document.querySelector('.payment-summary .edit-button').onclick = function() {
    document.querySelector('button.place-order').innerText = 'Place Order';
};

// This functionality checks that the shipping address form is filled out correctly
const isShippingAddressFormFilled = billingHelper.shippingAddressFormFillingVerifying();
const isShippingAddressFormEmpty = billingHelper.isShippingAddressFormEmptyChecking();
const shippingEditButtonEl = document.querySelector('.shipping-summary .edit-button');
const shippingUpdateButtonEl = document.querySelector('.shipping-address .shipment-selector-block .form-group .btn-show-details');
const shippingSubmitButtonEl = document.querySelector('.submit-shipping');

if (window.location.hash === '#placeOrder' && !isShippingAddressFormFilled && shippingEditButtonEl && shippingSubmitButtonEl) {
    shippingEditButtonEl.click();
    shippingSubmitButtonEl.click();
}

if (window.location.hash === '#shipping'
    && !isShippingAddressFormEmpty
    && !isShippingAddressFormFilled
    && shippingUpdateButtonEl
    && shippingSubmitButtonEl) {
    shippingUpdateButtonEl.click();
    shippingSubmitButtonEl.click();
}

if (!isFastlaneEnabled && helper.isCardFieldsEligible()) {
    require('./billing/creditCard')();
}

if (applePayContentEl) {
    const ApplePaySession = window.ApplePaySession;

    if (ApplePaySession && ApplePaySession.canMakePayments()) {
        const ApplePayModel = require('./models/buttons/applePay');
        const applePayInstance = new ApplePayModel();

        applePayInstance.initApplePay();
    }
}

// Selects first found billing address if switched to PPL and a new billing address was selected
const paymentOptionPPLTabEl = document.querySelector('.js-nav-item-paypal');

if (paymentOptionPPLTabEl) {
    paymentOptionPPLTabEl.addEventListener('click', function() {
        if (billingAddressSelectorEl && billingAddressSelectorEl.value === 'new') {
            const options = billingAddressSelectorEl.options;

            for (const option of options) {
                if (option.value !== 'new' && option.hasAttribute('data-first-name')) {
                    billingAddressSelectorEl.value = option.value;

                    break;
                }
            }
        }

        billingAddressSelectorEl.dispatchEvent(new Event('change'));
    });
}

const googlePayOptionTab = document.querySelector('.js-googlepay-tab');

if (googlePayOptionTab) {
    const GooglePayModel = require('./models/buttons/googlePay');
    const googlePayInstance = new GooglePayModel();

    googlePayInstance.initGooglePay();
}

if (window.paypalPreferences.isCWPPEnabled) {
    setTimeout(require('./cwpp/connectWithPayPal').init, 1000);
}
