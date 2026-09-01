const pdpHelper = require('./pdp/pdpHelper');

/**
 * Applies PayPal button behavior
 */
function applyPaypalButtonBehavior() {
    const paypalButton = document.querySelector('.paypal-pdp-button');
    const isProductSet = Boolean(document.querySelector('.set-items'));

    if (isProductSet) {
        pdpHelper.initPayPalBtnBehaviorOnPdpSet();
    } else if (paypalButton) {
        pdpHelper.initPaypalButtonBehaviorOnPdp();
    }
}

/**
 * Inits PayPal functionality on PDP
 */
function initPaypalFunctionality() {
    const paypalButtonContainers = document.querySelectorAll('.paypal-pdp-button, .paypal-pdp-button-global');
    const PP_BTN_SELECTOR = '.js-paypal-button-on-product-page';
    const PayPalProductModel = require('./models/buttons/payPalProduct');

    paypalButtonContainers && paypalButtonContainers.forEach((container, index) => {
        const ppButton = container.querySelector(PP_BTN_SELECTOR);

        if (ppButton) {
            ppButton.classList.add(`paypal-button-on-product-page-${index}-pdp`);

            const selector = `.${Array.from(ppButton.classList).join('.')}`;

            const payPalProductInstance = new PayPalProductModel(selector);

            payPalProductInstance.initPayPalButton();
        }
    });

    applyPaypalButtonBehavior();
}

/**
 * Inits Apple Pay functionality on PDP
 */
function initApplePayFunctionality() {
    const applePayContent = document.querySelector('.js-applepay-content');

    if (applePayContent) {
        const ApplePaySession = window.ApplePaySession;

        if (ApplePaySession && ApplePaySession.canMakePayments()) {
            const ApplePayPdpModel = require('./models/buttons/applePayPdp');
            const applePayInstance = new ApplePayPdpModel();

            applePayInstance.initApplePay();
        }
    }
}

$('body').ready(() => {
    if (window.paypal) {
        initPaypalFunctionality();
        initApplePayFunctionality();
        pdpHelper.initGooglePayFunctionalityForProductPage('pdp');
    }
});
