'use strict';

const helper = require('./helper.js');

const HIDE_CLASS = 'none';

const submitPaymentEl = document.querySelector('.submit-payment');
const billingAddressSelectorEl = document.getElementById('billingAddressSelector');
const addNewAddressButtonEl = document.querySelector('.address-selector-block .btn-add-new');
const billingAddressFormEl = document.querySelector('.billing-address-block .billing-address');
const showAddressDetailsEl = document.querySelector('.address-selector-block .btn-show-details');
const contactInfoFieldPhoneEl = document.querySelector('.dwfrm_billing_contactInfoFields_phone');

/**
 * Returns Billing address selected option
 * @returns {HTMLOptionElement} - Billing address selected option
 */
const getBillingAddressSelectedOption = () => {
    return helper.getSelectedOption(billingAddressSelectorEl);
};

/** @returns {void} */
function hideBillingAddressManipulationButtons() {
    showAddressDetailsEl && showAddressDetailsEl.classList.add(HIDE_CLASS);
    addNewAddressButtonEl && addNewAddressButtonEl.classList.add(HIDE_CLASS);
}

/** @returns {void} */
function showBillingAddressManipulationButtons() {
    showAddressDetailsEl && showAddressDetailsEl.classList.remove(HIDE_CLASS);
    addNewAddressButtonEl && addNewAddressButtonEl.classList.remove(HIDE_CLASS);
}

/** @returns {void} */
function disableBillingAddressList() {
    billingAddressSelectorEl && billingAddressSelectorEl.setAttribute('disabled', 'disabled');
}

/** @returns {void} */
function enableBillingAddressList() {
    billingAddressSelectorEl && billingAddressSelectorEl.removeAttribute('disabled');
}

/** @returns {void} */
function hideSubmitPaymentButton() {
    submitPaymentEl && submitPaymentEl.classList.add(HIDE_CLASS);
}

/** @returns {void} */
function showSubmitPaymentButton() {
    submitPaymentEl && submitPaymentEl.classList.remove(HIDE_CLASS);
}

/**
 * Hides billing address form on the Billing Page for appropriate tabs.
 * Case when customer clicked 'Updated address' or 'Add New' button and flipped through the payment method tabs
 * @returns {void}
 */
function hideBillingAddressForm() {
    billingAddressFormEl && billingAddressFormEl.classList.add(HIDE_CLASS);
}

/**
 * Shows billing address form on the Billing Page for appropriate tabs.
 * Case when customer clicked 'Updated address' or 'Add New' button and flipped through the payment method tabs
 * @returns {void}
 */
function showBillingAddressForm() {
    billingAddressFormEl && billingAddressFormEl.classList.remove(HIDE_CLASS);
}

/**
 * Hides phone field on the Billing Page for appropriate tabs
 * @returns {void}
 */
function hidePhoneField() {
    contactInfoFieldPhoneEl && contactInfoFieldPhoneEl.classList.add(HIDE_CLASS);
}

/**
 * Shows phone field on the Billing Page for appropriate tabs
 * @returns {void}
 */
function showPhoneField() {
    contactInfoFieldPhoneEl && contactInfoFieldPhoneEl.classList.remove(HIDE_CLASS);
}

/**
 * Disabled billing address functionality on the Billing Page
 * @returns {void}
 */
function disableBillingAddressFunctionality() {
    disableBillingAddressList();
    hideBillingAddressManipulationButtons();
    hideBillingAddressForm();
    hidePhoneField();

    let billingAddressMsg = billingAddressSelectorEl?.getAttribute('data-billing-address-msg');

    billingAddressMsg = (billingAddressMsg || '').trim();
    if (billingAddressMsg.toLowerCase() === 'undefined' || billingAddressMsg.toLowerCase() === 'null') {
        billingAddressMsg = '';
    }

    if (billingAddressMsg) {
        helper.setTextContent(getBillingAddressSelectedOption(),
            billingAddressMsg);
    }
}

/**
 * Enabled billing address functionality on the Billing Page
 * @returns {void}
 */
function enableBillingAddressFunctionality() {
    showBillingAddressManipulationButtons();
    enableBillingAddressList();
    showBillingAddressForm();
    showPhoneField();

    if (billingAddressSelectorEl) {
        const selectedOption = getBillingAddressSelectedOption();

        if (selectedOption && (selectedOption.value !== window.paypalConstants.BILLING_ADDRESS_SElECTOR_OPTION_NEW)) {
            helper.setTextContent(selectedOption,
                helper.getBillingAddressAsString(helper.getBillingAddressFromDataAttr(selectedOption)));
        }
    }
}

/**
 * Whether the billingAddressSelector element has selected billing address
 * @returns {boolean} True/False
 */
const isSelectedBillingAddress = () => {
    const selectedBillingAddressOption = helper.getSelectedOption(billingAddressSelectorEl);

    if (!selectedBillingAddressOption) {
        return false;
    }

    const notAddressRelatedSelectors = [
        window.paypalConstants.BILLING_ADDRESS_SElECTOR_OPTION_NEW,
        window.paypalConstants.BILLING_ADDRESS_SElECTOR_OPTION_EXISTING_SHIPMENTS,
        window.paypalConstants.BILLING_ADDRESS_SElECTOR_OPTION_MANUAL_ENTRY
    ];

    return !notAddressRelatedSelectors.includes(selectedBillingAddressOption.value);
};

/**
 * Is used only for Digital Goods flow
 * Removes unnecessary shipping related options from the billing address selector
 * @param {array} mutationsList List of mutations
 */
const billingAddressSelectorChange = (mutationsList) => {
    mutationsList.forEach(mutationRecord => {
        const primaryBillingAddressFields = ['address1', 'countryCode', 'stateCode', 'firstName', 'lastName'];
        const option = mutationRecord.addedNodes[0];
        const isExistingShipmentsOption = Boolean(option
            && option.value === window.paypalConstants.BILLING_ADDRESS_SElECTOR_OPTION_EXISTING_SHIPMENTS);

        const newAddressOption = option
        && ![window.paypalConstants.BILLING_ADDRESS_SElECTOR_OPTION_NEW,
            window.paypalConstants.BILLING_ADDRESS_SElECTOR_OPTION_MANUAL_ENTRY].includes(option.value);

        const isEmptyShippingOption = Boolean(newAddressOption
            && primaryBillingAddressFields.some(field => !option.dataset[field]));

        if (isExistingShipmentsOption || isEmptyShippingOption) {
            billingAddressSelectorEl.removeChild(option);
        }
    });
};

module.exports = {
    disableBillingAddressFunctionality,
    enableBillingAddressFunctionality,
    hideBillingAddressManipulationButtons,
    showBillingAddressManipulationButtons,
    disableBillingAddressList,
    enableBillingAddressList,
    hideBillingAddressForm,
    showBillingAddressForm,
    hideSubmitPaymentButton,
    showSubmitPaymentButton,
    hidePhoneField,
    showPhoneField,
    isSelectedBillingAddress,
    getBillingAddressSelectedOption,
    billingAddressSelectorChange
};
