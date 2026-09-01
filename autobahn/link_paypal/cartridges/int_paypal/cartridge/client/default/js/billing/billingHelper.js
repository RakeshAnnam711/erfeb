const helper = require('../helpers/helper');
const billingAddressHelpers = require('../helpers/billingAddressHelpers');

const TAB_CONTENT_ID = {
    CC_CONTENT_ID: '#credit-card-content',
    PP_CONTENT_ID: '#paypal-content',
    VENMO_CONTENT_ID: '#venmo-content'
};

/**
 * Checks whether a tab content id belongs to PayPal credit card content.
 * PayPal uses "#credit-card-content" (hyphen). Stripe saved-card uses "#CREDIT_CARD-content"
 * (underscore) — do not treat Stripe as PayPal CC.
 * @param {string} tabContentId - Payment tab content id.
 * @returns {boolean} True when tab content is PayPal credit card.
 */
function isCreditCardTabContent(tabContentId) {
    return /credit-card-content/i.test(tabContentId || '');
}

/**
 * Stripe Payment Element / Bank Transfer / Stripe CREDIT_CARD panes.
 * These must keep SFRA Review Order visible and must not stamp PayPal usedPaymentMethod.
 * @param {string} tabContentId - Payment tab content id.
 * @returns {boolean} True when tab is Stripe-owned.
 */
function isStripePaymentTabContent(tabContentId) {
    const tab = (tabContentId || '').toLowerCase();

    if (!tab) {
        return false;
    }

    return tab.indexOf('stripe_payment_element') > -1
        || tab.indexOf('bank_transfer') > -1
        || tab === '#credit_card-content'
        || /#credit_card-content/i.test(tabContentId || '');
}

/**
 * Checks whether a tab content id belongs to PayPal content.
 * @param {string} tabContentId - Payment tab content id.
 * @returns {boolean} True when tab content is PayPal.
 */
function isPayPalTabContent(tabContentId) {
    return /paypal-content/i.test(tabContentId || '');
}

/**
 * Checks whether a tab content id belongs to Venmo content.
 * @param {string} tabContentId - Payment tab content id.
 * @returns {boolean} True when tab content is Venmo.
 */
function isVenmoTabContent(tabContentId) {
    return /venmo-content/i.test(tabContentId || '');
}

/**
 * Checks whether a tab content id is managed by PayPal integrations.
 * @param {string} tabContentId - Payment tab content id.
 * @returns {boolean} True when billing should be PayPal-managed.
 */
function isPayPalManagedTabContent(tabContentId) {
    const tab = (tabContentId || '').toLowerCase();

    if (!tab) {
        return false;
    }

    return tab.indexOf('paypal-content') > -1
        || tab.indexOf('venmo-content') > -1
        || tab.indexOf('applepay-content') > -1
        || tab.indexOf('googlepay-content') > -1
        || tab.indexOf('paylater-content') > -1
        || tab.indexOf('lpm') > -1
        || tab.indexOf('ideal-content') > -1
        || tab.indexOf('bancontact-content') > -1
        || tab.indexOf('eps-content') > -1
        || tab.indexOf('mybank-content') > -1
        || tab.indexOf('p24-content') > -1
        || tab.indexOf('blik-content') > -1
        || tab.indexOf('trustly-content') > -1
        || tab.indexOf('multibanco-content') > -1
        || tab.indexOf('sepa-content') > -1;
}

const PP_BTN_SELECTOR = '.js-paypal-button-on-billing-form';
const OPTION_CHECKED_SELECTOR = 'option:checked';

const paypalButtonEl = document.querySelector(PP_BTN_SELECTOR);
const continueButtonEl = document.querySelector('button[value=submit-payment]');
const restPaypalAccountsListEl = document.getElementById('restPaypalAccountsList');
const usedPaymentMethodEl = document.querySelector('.js-used-payment-method');

const PayPalBase = require('../models/buttons/payPalBase');
const payPalBaseInstance = new PayPalBase(PP_BTN_SELECTOR);

const isDigitalGoodsFlow = paypalButtonEl !== null && payPalBaseInstance.isDigitalGoodsFlowEnabled;

/**
 * Shows continue button if it's not visible
 */
function showContinueButton() {
    if (continueButtonEl.style.display !== '') {
        continueButtonEl.style.display = '';
    }
}

/**
 * Hides continue button if it's not hidden
 */
function hideContinueButton() {
    if (continueButtonEl.style.display !== 'none') {
        continueButtonEl.style.display = 'none';
    }
}

/**
 * Shows PayPal div container if it's not visible and hides continue button
 */
function showPaypalBtn() {
    if (paypalButtonEl.style.display !== 'block') {
        paypalButtonEl.style.display = 'block';
    }

    hideContinueButton();
}

/**
 * Hides PayPal div container if it's not hidden and shows continue button
 */
function hidePaypalBtn() {
    if (paypalButtonEl.style.display !== 'none') {
        paypalButtonEl.style.display = 'none';
    }

    showContinueButton();
}

/**
 * Shows is new account selected
 * @param {Element} accountListEl - accountList element
 * @returns {boolean} value whether new account selected
 */
function isNewAccountSelected(accountListEl) {
    return accountListEl.querySelector(OPTION_CHECKED_SELECTOR).value === 'newaccount';
}

/**
 * Changes PayPal button visibility depending on checked option of element
 * @param {Element} accountListEl - accountListEl element
 */
function togglePaypalBtnVisibility(accountListEl) {
    isNewAccountSelected(accountListEl) ? showPaypalBtn() : hidePaypalBtn();
}

/**
 * Handles switching of the tab content
 * @param {string} tabContentId The payment method tab contend id
 */
const adjustTabContent = tabContentId => {
    // Stripe tabs: never hide Review Order; never set PayPal usedPaymentMethod.
    if (isStripePaymentTabContent(tabContentId)) {
        if (usedPaymentMethodEl) {
            usedPaymentMethodEl.value = '';
        }

        showContinueButton();

        return;
    }

    if (isCreditCardTabContent(tabContentId) || tabContentId === TAB_CONTENT_ID.CC_CONTENT_ID) {
        usedPaymentMethodEl.value = window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
        showContinueButton();

        return;
    }

    if (isPayPalTabContent(tabContentId) || tabContentId === TAB_CONTENT_ID.PP_CONTENT_ID) {
        usedPaymentMethodEl.value = window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
        togglePaypalBtnVisibility(restPaypalAccountsListEl);

        return;
    }

    if (isVenmoTabContent(tabContentId) || tabContentId === TAB_CONTENT_ID.VENMO_CONTENT_ID) {
        usedPaymentMethodEl.value = window.paypalConstants.PAYMENT_METHOD_ID_VENMO;
        hideContinueButton();

        return;
    }

    // LPM / other methods
    usedPaymentMethodEl.value = tabContentId.slice(1, tabContentId.indexOf('-'));
    hideContinueButton();
};

/**
 * Handles switching of the tab content
 * @param {Function} sessionStorageInstance instance of SessionStorageModel
 */
function handleTabCcChange(sessionStorageInstance) {
    billingAddressHelpers.enableBillingAddressFunctionality();

    if (isDigitalGoodsFlow && helper.isCardFieldsEligible()) {
        const creditCardListEl = document.getElementById('paypalCreditCardList');
        const initialSelectedOption = creditCardListEl?.options[creditCardListEl?.selectedIndex];
        const isInitialSelectedOption = initialSelectedOption && initialSelectedOption?.id !== 'new-card-account';
        const isSelectedBillingAddress = billingAddressHelpers.isSelectedBillingAddress();

        if (isInitialSelectedOption) {
            helper.selectBillingAddress(initialSelectedOption);
        }

        if (isSelectedBillingAddress || isInitialSelectedOption) {
            billingAddressHelpers.hideBillingAddressForm();

            const billingAddressBlockEl = document.querySelector('.billing-address-block');

            billingAddressBlockEl.querySelector('.btn-show-details').addEventListener('click', billingAddressHelpers.showBillingAddressForm);
            billingAddressBlockEl.querySelector('.btn-add-new').addEventListener('click', billingAddressHelpers.showBillingAddressForm);
        } else {
            billingAddressHelpers.showBillingAddressForm();
        }
    }

    sessionStorageInstance.setActiveBillingPmTab(window.paypalConstants.CREDIT_CARD_TAB);
}

/**
 * Handles tabs changing
 * @param {event} e - event
 * @param {Function} sessionStorageInstance - An instance of sessionStorageModel
 */
function handleTabChange(e, sessionStorageInstance) {
    let contentId;

    if (typeof e === 'string') {
        contentId = e;
    } else {
        contentId = e.target.hash;
    }

    if (!contentId || contentId.indexOf('-content') === -1) {
        return;
    }

    let shipmentsDomInstance;

    if (paypalButtonEl) {
        const ShipmentsDomModel = require('../models/shipmentsDom');

        shipmentsDomInstance = new ShipmentsDomModel();
    }

    adjustTabContent(contentId);

    // Keep ACTIVE_TAB aligned with the actually selected payment family.
    // Do not force PAYPAL_TAB for non-PayPal methods (e.g. Stripe).
    if (isPayPalManagedTabContent(contentId)) {
        sessionStorageInstance.setActiveBillingPmTab(window.paypalConstants.PAYPAL_TAB);
    } else {
        sessionStorageInstance.removeItem(window.paypalConstants.ACTIVE_TAB);
    }

    // Applies shipment behavior for Digital Goods (Pay Now) flow
    if (isDigitalGoodsFlow) {
        shipmentsDomInstance.hideShippingSectionsOnBillingPage();
        shipmentsDomInstance.showShippingAddressInfoMsg();
    }

    // Stripe tabs keep billing editable; do not run PayPal Card Fields tab setup.
    if (isStripePaymentTabContent(contentId)) {
        billingAddressHelpers.enableBillingAddressFunctionality();

        return;
    }

    // Activates PayPal credit card functionality only
    if (isCreditCardTabContent(contentId) || contentId === TAB_CONTENT_ID.CC_CONTENT_ID) {
        handleTabCcChange(sessionStorageInstance);

        return;
    }

    // Only PayPal-managed methods should lock billing selector/buttons.
    // Keep billing editable for non-PayPal methods (e.g. Stripe tabs).
    if (isPayPalManagedTabContent(contentId)) {
        billingAddressHelpers.disableBillingAddressFunctionality();
    } else {
        billingAddressHelpers.enableBillingAddressFunctionality();
    }
}

/**
 * Updates paypal content to initial state on client side if payment method was changed from paypal to different one
 * @param {Object} data - customer data object
 */
function updateClientSide(data) {
    const selectedPaymentInstruments = data.order.billing.payment.selectedPaymentInstruments;
    const giftCertTabLink = document.querySelector('.nav-link.gift-cert-tab');

    if (!selectedPaymentInstruments) {
        return;
    }

    if (giftCertTabLink && selectedPaymentInstruments.some((paymentInstr) =>
        paymentInstr.paymentMethod === giftCertTabLink.parentElement.getAttribute('data-method-id')
    )) {
        giftCertTabLink.click();
    }
}

/**
 * Updates "Submit order" button text on billing page in case of Venmo checkout
 * Needed in case of checkout NOT through smart button (when Venmo account is chosen in dropdown)
 */
function updateSubmitOrderButton() {
    const placeOrderBtn = document.querySelector('button.place-order');

    if (placeOrderBtn && usedPaymentMethodEl && usedPaymentMethodEl.value === 'Venmo') {
        placeOrderBtn.innerText = 'Place Order with Venmo';
    }
}

/**
 * If the state and country fields exist and filled, return true, otherwise return false.
 * @returns {boolean} true/false
 */
function shippingAddressFormFillingVerifying() {
    const stateFieldEl = document.getElementById('shippingStatedefault');
    const countryFieldEl = document.getElementById('shippingCountrydefault');

    if (stateFieldEl && countryFieldEl) {
        return stateFieldEl.value !== '' && countryFieldEl.value !== '';
    }

    return false;
}

/**
 * If the three fields exist, then return true if all three fields are not empty. Otherwise, return
 * true.
 * @returns {boolean} a boolean value.
 */
function isShippingAddressFormEmptyChecking() {
    const fistNameFieldEl = document.getElementById('shippingFirstNamedefault');
    const secondNameFieldEl = document.getElementById('shippingLastNamedefault');
    const addressFieldEl = document.getElementById('shippingAddressOnedefault');

    if (fistNameFieldEl && secondNameFieldEl && addressFieldEl) {
        return fistNameFieldEl.value.trim() === '' && secondNameFieldEl.value.trim() === '' && addressFieldEl.value.trim() === '';
    }

    return false;
}

/**
 * Initialize a behavior on payment stage
 * @returns {void}
 */
function initPaymentStageBehavior() {
    const SessionStorageModel = require('../models/sessionStorage');

    const sessionStorageInstance = new SessionStorageModel();
    const checkoutStageElement = document.querySelector('.data-checkout-stage');

    const observer = new MutationObserver(() => {
        if (checkoutStageElement.getAttribute('data-checkout-stage') === 'payment') {
            document.dispatchEvent(new Event('payment-stage:update'));
        }
    });

    observer.observe(checkoutStageElement, { attributes: true });

    document.addEventListener('payment-stage:update', () => {
        const activePaymentTab = document.querySelector('.payment-options[role=tablist] .nav-link.active');

        if (!activePaymentTab || !activePaymentTab.hash) {
            return;
        }

        const tabHash = activePaymentTab.hash;

        handleTabChange(tabHash, sessionStorageInstance);
    });
}

module.exports = {
    showPaypalBtn,
    hidePaypalBtn,
    hideContinueButton,
    handleTabChange,
    togglePaypalBtnVisibility,
    isNewAccountSelected,
    updateClientSide,
    showContinueButton,
    updateSubmitOrderButton,
    shippingAddressFormFillingVerifying,
    isShippingAddressFormEmptyChecking,
    initPaymentStageBehavior
};
