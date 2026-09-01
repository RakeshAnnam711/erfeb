'use strict';

const helper = require('../helpers/helper');
const fastlaneHelper = require('./fastlaneHelper');

const CARD_PLACEHOLDER = '************';
const CLASS_D_NONE = 'd-none';
const CLASS_USED_CREDITCARD_ACCOUNT = '.js-fastlane-used-creditcard-account';
const ATTRIBUTE_NUMBER = 'data-number';
const ATTRIBUTE_EXPIRATION = 'data-expiration';
const ATTRIBUTE_TYPE = 'data-type';
const ATTRIBUTE_OWNER = 'data-owner';
const ATTRIBUTE_PAYMENT_TOKEN = 'data-payment-token';
const ATTRIBUTE_SESSION_ACCOUNT = 'data-session-account';

/**
 * Gets Sessions card HTML element
 * @returns {HTMLElement|null} - Returns element
 */
function getSessionCardEl() {
    return fastlaneHelper.getElementById('fastlaneSessionCreditCard');
}

/**
 * Gets card list HTML element
 * @returns {HTMLElement|null} - Returns element
 */
function getCardListEl() {
    return fastlaneHelper.getElementById('fastlaneCreditCardList');
}

/**
 * Formats card expiration year and month
 * @param {Object} cardData - card data object
 * @returns {Object} - formatted object with expiration month and year
 */
function formatCardExpiration(cardData) {
    return {
        expirationMonth: cardData.expiry.substr(cardData.expiry.length - 2),
        expirationYear: cardData.expiry.slice(0, 4).substr(2)
    };
}

/**
 * Sets session card data attributes
 * @param {Object} cardDetails - card details data
 * @param {string} paymentToken - payment token
 */
function setSessionCardAttributes(cardDetails, paymentToken) {
    const sessionCreditCard = getSessionCardEl();
    const cardExpirationData = formatCardExpiration(cardDetails);

    sessionCreditCard.setAttribute(ATTRIBUTE_NUMBER, CARD_PLACEHOLDER + cardDetails.lastDigits);
    sessionCreditCard.setAttribute(ATTRIBUTE_EXPIRATION, `${cardExpirationData.expirationMonth}/${cardExpirationData.expirationYear}`);
    sessionCreditCard.setAttribute(ATTRIBUTE_TYPE, cardDetails.brand);
    sessionCreditCard.setAttribute('data-last-four', cardDetails.lastDigits);
    sessionCreditCard.setAttribute(ATTRIBUTE_OWNER, cardDetails.name || '');
    sessionCreditCard.setAttribute(ATTRIBUTE_PAYMENT_TOKEN, paymentToken);
    sessionCreditCard.setAttribute(ATTRIBUTE_SESSION_ACCOUNT, true);
    sessionCreditCard.setAttribute('data-save-card', false);
}

/**
 * Sets session card data and show session card in select
 */
function setSessionCardData() {
    const sessionCreditCard = getSessionCardEl();

    fastlaneHelper.removeClass(sessionCreditCard, CLASS_D_NONE);

    sessionCreditCard.selected = true;
    sessionCreditCard.textContent = `${sessionCreditCard.getAttribute(ATTRIBUTE_TYPE)}

    ${sessionCreditCard.getAttribute(ATTRIBUTE_NUMBER)}
    ${sessionCreditCard.getAttribute(ATTRIBUTE_EXPIRATION)}
    ${sessionCreditCard.getAttribute(ATTRIBUTE_OWNER)}`;
}

/**
 * Shows add new/session card selector block
 */
function showSessionCardBlock() {
    fastlaneHelper.removeClass(document.querySelector(CLASS_USED_CREDITCARD_ACCOUNT), CLASS_D_NONE);
    fastlaneHelper.addClass(fastlaneHelper.getElementById('fastlane-fields-container'), CLASS_D_NONE);
}

/**
 * Hide session card block if it is not hidden
 */
function hideSessionCardBlock() {
    if (!document.querySelector(CLASS_USED_CREDITCARD_ACCOUNT)?.classList.contains(CLASS_D_NONE)) {
        fastlaneHelper.addClass(document.querySelector(CLASS_USED_CREDITCARD_ACCOUNT), CLASS_D_NONE);
    }
}

/**
 * Checks authenticated customer, account list for session Account
 *
 * @param {Object} params querySelector + el.id
 * @returns {Object} session account object
 */
function getSessionAccountOption(params) {
    return Array.from(document.querySelector(params.querySelector).options).find(function(el) {
        return el.id === params.id && helper.tryParseJSON(el.getAttribute(ATTRIBUTE_SESSION_ACCOUNT));
    });
}

/**
 * Sets payment token to hidden input from passed value or from data attribute
 * @param {string} paymentToken - payment token
 */
function setPaymentToken(paymentToken) {
    fastlaneHelper.getElementById('fastlanePaymentToken').value = paymentToken || getSessionCardEl()?.getAttribute(ATTRIBUTE_PAYMENT_TOKEN);
}

/**
 * Remove session payment form basket
 */
function removeSessionPaymentFromBasket() {
    const url = helper.getUrlWithCsrfToken(window.paypalUrls.removeSessionPayment);

    fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            paymentToken: fastlaneHelper.getElementById('fastlanePaymentToken').value
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                window.location.href = data.redirectUrl;
            }
        });
}

/**
 * Remove active session payment
 */
function removeActiveSessionPayment() {
    const sessionOption = getSessionAccountOption({
        querySelector: '#fastlaneCreditCardList',
        id: 'fastlaneSessionCreditCard'
    });

    if (!sessionOption) {
        return;
    }

    hideSessionCardBlock();

    fastlaneHelper.getElementById('newCardAccount').selected = true;

    sessionOption.selected = false;
    sessionOption.textContent = '';
    sessionOption.setAttribute(ATTRIBUTE_SESSION_ACCOUNT, false);
    sessionOption.setAttribute(ATTRIBUTE_OWNER, false);
    sessionOption.setAttribute(ATTRIBUTE_EXPIRATION, false);
    sessionOption.setAttribute(ATTRIBUTE_NUMBER, false);
    sessionOption.setAttribute(ATTRIBUTE_PAYMENT_TOKEN, false);
    sessionOption.setAttribute(ATTRIBUTE_TYPE, false);

    fastlaneHelper.removeClass(sessionOption, CLASS_D_NONE);
    fastlaneHelper.removeClass(fastlaneHelper.getElementById('fastlane-fields-container'), CLASS_D_NONE);

    removeSessionPaymentFromBasket();
}

/**
 * Returns whether option from select is selected
 * @param {HTMLElement|null} selectList - current select list element
 * @param {string} value - value to check
 * @returns {boolean} - selected option
 */
function isCurrentValueSelected(selectList, value) {
    return Array.from(selectList?.options).find((option) => {
        return option?.value === value && option.selected;
    });
}

/**
 * Returns whether session card flow is used
 * @returns {boolean} - true/false value
 */
function isSessionCardFlow() {
    return isCurrentValueSelected(getCardListEl(), window.paypalConstants.SESSION_CARD);
}

/**
 * Returns whether new card flow is used
 * @returns {boolean} - true/false value
 */
function isNewCardFlow() {
    return isCurrentValueSelected(getCardListEl(), window.paypalConstants.NEW_CARD);
}

module.exports = {
    showSessionCardBlock,
    hideSessionCardBlock,
    removeActiveSessionPayment,
    isSessionCardFlow,
    isNewCardFlow,
    setSessionCardAttributes,
    setSessionCardData,
    setPaymentToken
};
