const pdpHelper = require('./pdp/pdpHelper');

/**
 * Applies PayPal button behavior
 */
function applyPaypalButtonBehavior() {
    const helper = require('./helpers/helper');

    const paypalButtons = document.querySelectorAll('.paypal-pvp-button-global');
    const isProductSet = Boolean(document.querySelector('.set-items'));

    if (isProductSet) {
        helper.initPayPalBtnBehaviorOnSet();
    } else if (paypalButtons) {
        helper.initPaypalButtonBehaviorOnPvp(paypalButtons);
    }
}

/**
 * Inits Apple Pay functionality on PVP
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

/**
 * Inits PayPal functionality on PVP
 */
function initPaypalFunctionality() {
    const PayPalProductModel = require('./models/buttons/payPalProduct');

    const PP_BTN_SELECTOR = '.js-paypal-button-on-product-page';
    const paypalButtonContainers = document.querySelectorAll('.paypal-pvp-button, .paypal-pvp-button-global');

    paypalButtonContainers && paypalButtonContainers.forEach((container, index) => {
        const ppButton = container.querySelector(PP_BTN_SELECTOR);

        if (ppButton) {
            ppButton.classList.add(`paypal-button-on-product-page-${index}-pvp`);

            const selector = `.${Array.from(ppButton.classList).join('.')}`;

            const payPalProductInstance = new PayPalProductModel(selector);

            payPalProductInstance.initPayPalButton();
        }
    });

    applyPaypalButtonBehavior();
}

/**
 * Inject the GooglePay SDK into the page
 */
function injectGooglePaySDK() {
    const head = document.head;
    const script = document.createElement('script');

    script.src = window.paypalSDK.googlePaySDK;
    script.onload = () => pdpHelper.initGooglePayFunctionalityForProductPage('pvp');

    head.appendChild(script);
}

/**
 * When the page loads, inject the PayPal SDK into the page and then call the initPaypalFunctionality
 * function.
 */
function injectPaypalSDK() {
    const head = document.getElementsByTagName('head').item(0);
    const ppButtonEl = document.querySelector('.js-paypal-button-on-product-page');
    const userIdToken = ppButtonEl?.getAttribute('data-user-id-token');
    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.src = window.paypalSDK.cartSdkUrl;
    script.onload = function() {
        initPaypalFunctionality();
        initApplePayFunctionality();
        // Because GooglePay functionality require PayPal sdk, and might be loaded before PayPal
        injectGooglePaySDK();
    };

    script.setAttribute('data-partner-attribution-id', window.paypalPreferences.partnerAttributionId);
    script.setAttribute('data-page-type', 'search-results');

    if (userIdToken){
        script.setAttribute('data-user-id-token', userIdToken);
    }

    head.appendChild(script);
}

$('body').on('quickview:ready', () => {
    if (window.paypal) {
        initPaypalFunctionality();
        initApplePayFunctionality();

        if (window.google) {
            pdpHelper.initGooglePayFunctionalityForProductPage('pvp');
        } else {
            injectGooglePaySDK();
        }
    } else {
        injectPaypalSDK();
    }
});
