const api = require('./helpers/api');

const isZeroAmount = api.getBasketData()?.amount === 0;
const PP_BTN_SELECTOR = '.js-paypal-button-on-cart-page';

const cartButtonEl = document.querySelector(PP_BTN_SELECTOR);
const miniCartButtonEl = document.querySelector('.paypal-cart-button.js-mini-cart-btn');

if (miniCartButtonEl && isZeroAmount) {
    miniCartButtonEl.classList.add('d-none');
}

let payPalCartInstance = null;

if (cartButtonEl) {
    const PayPalCartModel = require('./models/buttons/payPalCart');

    payPalCartInstance = new PayPalCartModel(PP_BTN_SELECTOR);
}

/**
 * Injects Apple Pay SDK
 */
function injectApplePaySDK() {
    const head = document.head;
    const script = document.createElement('script');

    script.src = window.paypalSDK.applePaySDK;

    head.appendChild(script);
}

/**
 * Injects Google Pay SDK
 */
function injectGooglePaySDK() {
    const head = document.head;
    const script = document.createElement('script');

    script.onload = function() {
        const GooglePayCartModel = require('./models/buttons/googlePayCart');
        const googlePayInstance = new GooglePayCartModel();

        googlePayInstance.initGooglePay();
    };

    script.src = window.paypalSDK.googlePaySDK;

    head.appendChild(script);
}

/**
 * Inits Apple Pay
*/
function initApplePay() {
    const ApplePaySession = window.ApplePaySession;

    if (ApplePaySession && ApplePaySession.canMakePayments()) {
        injectApplePaySDK();

        const ApplePayModel = require('./models/buttons/applePay');

        const applePayInstance = new ApplePayModel();

        applePayInstance.initApplePay();
    }
}

/**
 * Inits Google Pay
*/
function initGooglePay() {
    const googlePatButtonEl = document.querySelector('.js-googlepay-cart-btn, .js-googlepay-minicart-btn');

    if (googlePatButtonEl && googlePatButtonEl.children.length === 0) {
        if (!window.google) {
            injectGooglePaySDK();
        } else {
            const GooglePayCartModel = require('./models/buttons/googlePayCart');
            const googlePayInstance = new GooglePayCartModel();

            googlePayInstance.initGooglePay();
        }
    }
}

/**
 * Injects SDK into page for cart/minicart
*/
function injectPaypalSDK() {
    const head = document.head;
    const script = document.createElement('script');
    const userIdToken = cartButtonEl?.getAttribute('data-user-id-token');

    script.type = 'text/javascript';
    script.onload = function() {
        if (payPalCartInstance) {
            payPalCartInstance.initPayPalButton();
        }

        initApplePay();
        initGooglePay();
    };

    script.src = window.paypalSDK.cartSdkUrl;
    script.setAttribute('data-partner-attribution-id', window.paypalPreferences.partnerAttributionId);
    script.setAttribute('data-page-type', 'mini-cart');
    script.setAttribute('data-namespace', 'paypalSdkMiniCart');

    if (userIdToken) {
        script.setAttribute('data-user-id-token', userIdToken);
    }

    head.appendChild(script);
}

if (!window.paypalSdkMiniCart && cartButtonEl?.classList.contains('js-mini-cart-btn')) {
    // We do not inject SDK if SDK is already loaded for mini cart
    injectPaypalSDK();
} else {
    if (payPalCartInstance) {
        payPalCartInstance.initPayPalButton();
    }

    initApplePay();
    initGooglePay();
}
