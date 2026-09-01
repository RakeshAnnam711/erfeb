'use strict';

const helper = require('./helpers/helper');

/**
 * Get Pay Later message elements
 * @returns {Array} Array of elements with data-pp-message attribute
 */
const getMessageEls = () => Array.from(document.querySelectorAll('[data-pp-message]'));

const ppMessageEls = getMessageEls();

/**
 * Set Pay Later message amount for given elements
 * @param {NodeList|Array} elements - Array of elements to update
 * @param {number} amount - Amount to set
 */
function setPayLaterMessageAmount(elements, amount) {
    elements.forEach(element => {
        element.dataset.ppAmount = amount;
    });
}

/**
 * Update Pay Later message amount for Product page (simple product, bundles, sets)
 */
function updatePayLaterMessageAmountForProduct() {
    const productMessageEls = getMessageEls().filter(el => el.dataset.ppPlacement.startsWith('product'));
    const isProductBundle = document.querySelectorAll('.bundle-items').length;

    if (isProductBundle && productMessageEls.length) {
        const priceEl = document.querySelector('.price .sales .value');
        const quantityEls = document.querySelectorAll('.quantity-select');

        quantityEls.forEach(quantityEl => {
            quantityEl.addEventListener('change', () => {
                const price = parseFloat(priceEl.getAttribute('content'));
                const quantity = parseFloat(quantityEl.value);
                const amount = price * quantity;

                setPayLaterMessageAmount(productMessageEls, amount);
            });
        });
    }

    $('body').on('product:afterAttributeSelect', (_, { data: { product }, container }) => {
        let section = container[0];

        const amount = helper.getProductPrice(product);
        const isQuickView = section.classList.contains('product-quickview') || !!section.closest('.product-quickview');
        const pageType = isQuickView ? 'product_preview' : 'product';

        if (isQuickView && !section.classList.contains('set-item')) {
            section = section.parentElement.nextElementSibling;
        }

        const payLaterMessageEls = section.querySelectorAll(`.js-${pageType}-message`);

        setPayLaterMessageAmount(payLaterMessageEls, amount);
    });
}

/**
 * Update Pay Later message amount for Cart, Category pages
 * @param {Object} _ - Event data
 * @param {Object} data - Data passed by trigger
 * @returns {void}
 */
const updatePayLaterMessageAmount = (_, data) => {
    if (data?.error || !ppMessageEls.length) {
        return;
    }

    if (ppMessageEls[0].dataset.ppPlacement === 'product') {
        return;
    }

    let total;
    let checkElementAgain = false;

    if ('cart' in data) {
        total = data.cart.totals.grandTotal;
    } else if ('cartModel' in data) {
        total = data.cartModel.totals.grandTotal;
    } else if ('basket' in data) {
        total = data.basket.totals.grandTotal;
        checkElementAgain = data.basket.items.length === 0;
    } else {
        total = data.totals.grandTotal;
    }

    if (checkElementAgain && !getMessageEls().length) {
        return;
    }

    total = helper.getFloatFromAmount(total);

    setPayLaterMessageAmount(ppMessageEls, total);
};

/**
 * Update Pay Later messaging amount for Checkout page
 * @param {Object} _ - Event data
 * @param {Object} data - Data passed by trigger
 */
const updateCheckoutPayLaterMessagingAmount = (_, data) => {
    const amount = helper.getFloatFromAmount(data.order.totals.grandTotal);

    setPayLaterMessageAmount(ppMessageEls, amount);
};

updatePayLaterMessageAmountForProduct();

$('body')
    .on('cart:update', updatePayLaterMessageAmount)
    .on('count:update', updatePayLaterMessageAmount)
    .on('cart:shippingMethodSelected', updatePayLaterMessageAmount)
    .on('promotion:success', updatePayLaterMessageAmount)
    .on('checkout:shippingMethodSelected', updateCheckoutPayLaterMessagingAmount)
    .on('quickview:ready', updatePayLaterMessageAmountForProduct);
