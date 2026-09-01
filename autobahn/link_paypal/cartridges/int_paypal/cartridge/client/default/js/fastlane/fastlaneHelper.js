'use strict';

const CARD_PLACEHOLDER = '************';
const CLASS_D_NONE = 'd-none';
const SESSION_KEY_FASTLANE_CARD = 'fastlaneCard';
const SESSION_KEY_FASTLANE_USER_ROLE = 'fastlaneUserRole';
const ROLE_USER = 'user';
const ROLE_GUEST = 'guest';
const CLASS_INVALID = 'is-invalid';

/**
 * Get HTML element by ID value
 * @param {string} elementId - Specifies the ID value.
 * @returns {HTMLElement|null} - Returns a reference to the first object with the specified value of the ID attribute.
 */
function getElementById(elementId) {
    return document.getElementById(elementId);
}

/**
 * Get array with all HTML elements by identifier value.
 * @param {string} selector - Specifies the selector identifier value.
 * @returns {Array} - Returns array with all elements with the specified value.
 */
function getAllElements(selector) {
    return Array.from(document.querySelectorAll(selector));
}

/**
 * Adds class to element
 * @param {Element} element - current element
 * @param {string} className - current className to add
 */
function addClass(element, className) {
    element?.classList.add(className);
}

/**
 * Removes class from element
 * @param {Element} element - current element
 * @param {string} className - current className to remove
 */
function removeClass(element, className) {
    element?.classList.remove(className);
}

/**
 * Sets card number into SFCC card number input
 * @param {string|undefined} cardNumberLastDigits - last digits of credit card number
 */
function setCardNumber(cardNumberLastDigits) {
    const creditCardNumberEl = getElementById('cardNumber');

    if (creditCardNumberEl && cardNumberLastDigits) {
        creditCardNumberEl.value = CARD_PLACEHOLDER + cardNumberLastDigits;
    }
}

/**
 * Shows card info on payment block
 * @param {Object} cardData - card data object
 */
function showCard(cardData) {
    if (!cardData) {
        return;
    }

    const cardTypeEl = getElementById('fastlane-card-type');
    const brand = cardData.brand || 'Unknown';

    cardTypeEl.textContent = brand;
    cardTypeEl.dataset.cardBrand = brand;

    getElementById('fastlane-last4').textContent = cardData.lastDigits;
}

/**
 * Splits a full name into a separate first as well as a second name
 * We assume that first name is first part of full name and the rest is last name
 * @param {string} fullName A full name
 * @returns {Object} An object with first and last name
 */
function splitFullName(fullName) {
    const fullNameArray = fullName.split(/\s+/);

    return {
        firstName: fullNameArray.shift(),
        lastName: fullNameArray.join(' ')
    };
}

/**
 * Applies prevent event methods
 * @param {event} event - current event
 */
function applyPreventEventMethods(event) {
    event.preventDefault();
    event.stopPropagation();
}

/**
 * Returns selected option from select
 * @param {HTMLElement|null} selectElement - nonce
 * @returns {HTMLElement|null} - selected option
 */
function getSelectedOption(selectElement) {
    return selectElement ? selectElement.options[selectElement.selectedIndex] : null;
}

/**
 * Returns whether non Fastlane method was used or not
 * @returns {boolean} - true/false value
 */
function isNonFastlaneUsed() {
    return getElementById('isNonFastlaneUsed').value === 'true';
}

/**
 * Shows shipping address form block
 * @param {number} exception - exception element position
 */
function showShippingAddressFormBlock(exception) {
    const allShippingAddressFormBlockEls = getAllElements('.shipping-address-block');
    const specificBlocks = exception && allShippingAddressFormBlockEls.splice(exception) || null;

    (specificBlocks || allShippingAddressFormBlockEls).forEach((block) => {
        removeClass(block, CLASS_D_NONE);
    });
}

/**
 * Hides shipping address form block
 */
function hideShippingAddressFormBlock() {
    const shippingAddressBlock = getAllElements('.shipping-address-block');

    shippingAddressBlock.forEach((block) => {
        addClass(block, CLASS_D_NONE);
    });
}

/**
 * Shows fastlane address block
 * @param {Array} addressBlocks - address block selectors list
 */
function showFastlaneAddressBlock(addressBlocks) {
    if (!addressBlocks) {
        return;
    }

    addressBlocks.forEach((block) => {
        removeClass(block, CLASS_D_NONE);
    });
}

/**
 * Hides fastlane address block
 * @param {Array} fastlaneAddressBlocks - fastlane address block selectors list
 * @param {number} exception - exception element position
 */
function hideFastlaneAddressBlock(fastlaneAddressBlocks, exception) {
    if (!fastlaneAddressBlocks.length) {
        return;
    }

    const specificBlocks = exception && fastlaneAddressBlocks.splice(exception) || null;

    (specificBlocks || fastlaneAddressBlocks).forEach((block) => {
        addClass(block, CLASS_D_NONE);
    });
}

/**
 * Returns true/false value whether fastlane role is user
 * @returns {boolean} - true/false
 */
function isFastlaneRoleUser() {
    return sessionStorage.getItem(SESSION_KEY_FASTLANE_USER_ROLE) === ROLE_USER;
}

/**
 * Returns true/false value whether fastlane role is guest
 * @returns {boolean} - true/false
 */
function isFastlaneRoleGuest() {
    return sessionStorage.getItem(SESSION_KEY_FASTLANE_USER_ROLE) === ROLE_GUEST;
}

/**
 * Checks if a card is available in wallet.
 * @returns {boolean} Returns true if the card is available, otherwise false.
 */
function isCardInWallet() {
    return sessionStorage.getItem(SESSION_KEY_FASTLANE_CARD) === 'true';
}

/**
 * Checks if a card is not available in wallet (new card flow).
 * @returns {boolean} Returns true if the card is not available, otherwise false.
 */
function isNoSavedCardInWallet() {
    return sessionStorage.getItem(SESSION_KEY_FASTLANE_CARD) === 'false';
}

/**
 * Returns first element from passed elements list
 * @param {Array} elementList - all query selector elements list
 * @returns {HTMLElement|undefined} - first element
 */
function getFirstElement(elementList) {
    return elementList[0];
}

/**
 * Returns second element from passed elements list
 * @param {Array} elementList - all query selector elements list
 * @returns {HTMLElement|undefined} - second element
 */
function getSecondElement(elementList) {
    return elementList[1];
}

/**
 * Hides address watermarks if any
 */
function hideAddressWatermark() {
    const watermarkList = document.querySelectorAll('.watermark-container');

    watermarkList.forEach((watermark) => {
        addClass(watermark, CLASS_D_NONE);
    });
}

/**
 * Clears content from passed element
 * @param {HTMLElement} elem - element
 */
function clearElementContent(elem) {
    if (elem) {
        elem.innerHTML = '';
    }
}

/**
 * Validate whole form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} - true if valid otherwise false
 */
function validateForm(form) {
    if (form.checkValidity && !form.checkValidity()) {
        form.querySelectorAll('input, select').forEach((element) => {
            if (!element.validity.valid) {
                element.classList.add(CLASS_INVALID);
            }
        });

        return false;
    }

    return true;
}

/**
 * Fills Credit Card form hidden inputs with payload data for Fastlane checkout
 * @param {Object} cardData - Object contains the data of new payment method
 * @param {string} paymentToken - payment token
 */
function setPaymentData(cardData, paymentToken) {
    if (!cardData) {
        return;
    }

    getElementById('fastlanePaymentToken').value = paymentToken;
    getElementById('fastlaneCardType').value = cardData.brand === 'MASTER_CARD' ? 'MASTERCARD' : cardData.brand;
    getElementById('fastlaneCardLastDigits').value = cardData.lastDigits;
    getElementById('fastlaneExpiry').value = cardData.expiry;
    getElementById('fastlaneCardHolderName').value = cardData.name || '';

    setCardNumber(cardData.lastDigits);
}

/**
 * Generates the parameters required to initiate a 3D Secure (3DS) payment verification request.
 * Calls the API helper responsible for creating the 3D Secure parameters
 * needed to perform authentication during the checkout process.
 * @returns {Promise<Object>} A promise that resolves to an object containing
 * the generated 3D Secure parameters used for the payment request.
 */
function createThreeDSecureParameters() {
    const api = require('../helpers/api');

    return api.createThreeDSecureParameters();
}

module.exports = {
    setCardNumber,
    showCard,
    splitFullName,
    applyPreventEventMethods,
    getAllElements,
    addClass,
    removeClass,
    getElementById,
    isNonFastlaneUsed,
    getSelectedOption,
    showShippingAddressFormBlock,
    hideShippingAddressFormBlock,
    showFastlaneAddressBlock,
    hideFastlaneAddressBlock,
    isFastlaneRoleUser,
    isFastlaneRoleGuest,
    getFirstElement,
    getSecondElement,
    hideAddressWatermark,
    clearElementContent,
    validateForm,
    setPaymentData,
    isCardInWallet,
    isNoSavedCardInWallet,
    createThreeDSecureParameters
};
