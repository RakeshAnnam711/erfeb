'use strict';

const MIN_NUMBER_OF_PARAMETERS = 8;

const containerEl = document.getElementById('js-cwpp-button');

/**
 * Overrides the native window.open function.
 * If the target is '__ppax__', the URL will load in the current window.
 * Otherwise, it will use the native window.open function.
 *
 * __ppax__ - custom target value from PayPal login.js file
 */
function overrideWindowOpen() {
    const nativeWindowOpen = window.open;

    window.open = (url, target, windowFeatures) => {
        if (target === '__ppax__') {
            window.location.href = url;

            return null;
        }

        return nativeWindowOpen(url, target, windowFeatures);
    };
}

/**
 * @param {Function} callback - a callback function for onload event
 * @returns {void}
 */
function addConnectWithPayPalScript(callback) {
    if (!containerEl) {
        return;
    }

    const script = document.createElement('script');

    script.id = 'paypal-api';
    script.async = true;
    script.src = containerEl.getAttribute('data-cwpp-sdk');

    script.onload = () => {
        if (callback && typeof callback === 'function') {
            callback();
        }
    };

    document.body.appendChild(script);
}

/**
 * Connect with PayPal
 * @link {https://developer.paypal.com/docs/log-in-with-paypal/integrate/generate-button}
 */
function initConnectWithPayPal() {
    const parameters = JSON.parse(containerEl.getAttribute('data-parameters'));

    if (!(window.paypal && 'use' in window.paypal && Object.keys(parameters).length > MIN_NUMBER_OF_PARAMETERS)) {
        return;
    }

    overrideWindowOpen();

    window.paypal.use(['login'], (login) => {
        login.render(parameters);
    });
}

/**
 * Function which initiate PayPal functionality on the Login Page
 */
function init() {
    addConnectWithPayPalScript(initConnectWithPayPal);
}

module.exports = {
    init
};
