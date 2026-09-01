const helper = require('../helpers/helper');
const GooglePayPdp = require('../models/buttons/googlePayPdp');

/**
 * Check if PDP product price is zero
 * @returns {boolean} "true" in case if PDP product price is zero
 */
function isZeroPdpProductPrice() {
    const productPriceSelectorEl = document.querySelector('.price .sales .value');

    if (productPriceSelectorEl) {
        const price = parseInt(productPriceSelectorEl.getAttribute('content'), 0);

        return price <= 0;
    }

    return true;
}

/**
 * Is add to cart button disabled
 * @returns {boolean} "true" in case if add to cart button disabled
 */
function isAddToCartButtonDisabled() {
    const addToCartButtonEl = document.querySelector('.js-add-to-cart, .js-add-to-cart-global');

    return addToCartButtonEl.disabled;
}

/**
 * Return mini cart quantity
 * @param {Object} miniCartQuantitySelectorEl Mini cart quantity selector
 * @returns {Int} Quantity
 */
function getMiniCartQuantity(miniCartQuantitySelectorEl) {
    let quantity = null;

    if (miniCartQuantitySelectorEl) {
        quantity = parseInt(miniCartQuantitySelectorEl.textContent, 0);
    }

    return quantity;
}

/**
 * Check if basket is empty
 * @returns {boolean} "true" in case if basket is not empty
 */
function isBasketNotEmpty() {
    const miniCartQuantityElement = document.querySelector('.minicart-quantity');

    return getMiniCartQuantity(miniCartQuantityElement) !== 0;
}

/**
 * Handles PP button behavior on Product/Cart update
 * @returns {void}
 */
function handlePayPalButtonOnUpdate() {
    const paypalPDPButtonEl = document.querySelector('.paypal-pdp-button');

    const addToCartButtonDisabled = isAddToCartButtonDisabled();
    const zeroProductPrice = isZeroPdpProductPrice();
    const basketNotEmpty = isBasketNotEmpty();

    if (addToCartButtonDisabled || zeroProductPrice || basketNotEmpty) {
        helper.hideButton(paypalPDPButtonEl);
    } else {
        helper.showButton(paypalPDPButtonEl);
    }
}

/**
 * Handles Apple Pay button behavior on Product/Cart update
 * @returns {void}
 */
function handleApplePayButtonOnUpdate() {
    const applePayPDPButtonEl = document.querySelector('.applepay-pdp-button-wrap');

    const addToCartButtonDisabled = isAddToCartButtonDisabled();
    const zeroProductPrice = isZeroPdpProductPrice();
    const basketNotEmpty = isBasketNotEmpty();

    if (addToCartButtonDisabled || zeroProductPrice || basketNotEmpty) {
        helper.hideButton(applePayPDPButtonEl);
    } else {
        helper.showButton(applePayPDPButtonEl);
    }
}

/**
 * Handling PDP button behavior
 */
function initPaypalButtonBehaviorOnPdp() {
    const paypalPDPButtonEl = document.querySelector('.paypal-pdp-button');

    if (paypalPDPButtonEl) {
        const addToCartButtonDisabled = isAddToCartButtonDisabled();
        const zeroProductPrice = isZeroPdpProductPrice();
        const basketNotEmpty = isBasketNotEmpty();

        if (addToCartButtonDisabled || zeroProductPrice || basketNotEmpty) {
            helper.hideButton(paypalPDPButtonEl);
        }

        $('body').on('product:afterAddToCart', function() {
            helper.hideButton(paypalPDPButtonEl);
        });

        $('body').on('cart:update', handlePayPalButtonOnUpdate);
        $('body').on('product:statusUpdate', handlePayPalButtonOnUpdate);
    }
}

/**
 * Handling button behavior on PDP Product Set
 * @returns {void}
 */
function initPayPalBtnBehaviorOnPdpSet() {
    helper.initPayPalBtnBehaviorOnSet();

    $('body').on('cart:update', (event) => {
        const addToCartButtons = event.target.querySelectorAll('.add-to-cart, .add-to-cart-global');

        addToCartButtons.forEach((btn) => helper.handleSetPayPalButtonOnUpdate(btn));
    });

    $('body').on('product:afterAddToCart', function(event) {
        const paypalButtonsElements = event.target.querySelectorAll('.paypal-pdp-button, .paypal-pdp-button-global');

        paypalButtonsElements.forEach((button) => helper.hideButton(button));
    });
}

/**
 * Appends params to a url
 * @param {string} url - Original url
 * @param {Object} param - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, param) {
    let newUrl = url;

    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(param).map(function(key) {
        return [key, '=', encodeURIComponent(param[key])].join('');
    }).join('&');

    return newUrl;
}

/**
 * Inits Google Pay functionality on PDP
 * @param {string} pageType Page type
 */
async function initGooglePayFunctionalityForProductPage(pageType) {
    const googlePayContentElements = document.querySelectorAll('.js-googlepay-content');

    const PP_BTN_SELECTOR = `.js-googlepay-${pageType}-btn`;

    googlePayContentElements && googlePayContentElements.forEach((container, index) => {
        const gpButton = container.querySelector(PP_BTN_SELECTOR);

        if (gpButton) {
            gpButton.classList.add(`googlepay-button-on-product-page-${index}-${pageType}`);

            const selector = `.${Array.from(gpButton.classList).join('.')}`;
            const googlePayPdpModel = new GooglePayPdp();

            googlePayPdpModel.initGooglePay(selector);
        }
    });
}

module.exports = {
    appendToUrl,
    initPaypalButtonBehaviorOnPdp,
    initPayPalBtnBehaviorOnPdpSet,
    isZeroPdpProductPrice,
    isAddToCartButtonDisabled,
    isBasketNotEmpty,
    handleApplePayButtonOnUpdate,
    initGooglePayFunctionalityForProductPage
};
