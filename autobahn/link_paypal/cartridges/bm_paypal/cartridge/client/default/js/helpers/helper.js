'use strict';

const AlertHandlerModel = require('../components/alertHandler');

/**
 * Get CSRF Token
 * @returns {string} - csrf token value
 */
function getCsrfToken() {
    let element = document.querySelector('[name="csrf_token"]');

    if (element && element.value !== '') {
        return element.value;
    }

    element = document.querySelector('[data-tokenname="csrf_token"]');

    if (element && element.getAttribute('data-token') !== '') {
        return element.getAttribute('data-token');
    }

    return '';
}

/**
 * Add csrf token param to url
 * @param {string} url - source url
 * @returns {string} - url with csrf_token param
 */
function getUrlWithCsrfToken(url) {
    const urlInstance = new URL(url, window.location.origin);

    urlInstance.searchParams.append('csrf_token', getCsrfToken());

    return urlInstance.toString();
}

/**
 * Returns string with params for url
 * @param {HTMLElement} formEl - form DOM Element
 * @returns {string} - params fo url
 */
function serializeForm(formEl) {
    const formData = new FormData(formEl);
    const serializedData = [];

    for (const pair of formData.entries()) {
        serializedData.push(`${encodeURIComponent(pair[0])}=${encodeURIComponent(pair[1])}`);
    }

    return serializedData.join('&');
}

/**
 * Handle and proceed with submit form event
 * @param {Event} event event reference
 * @param {HTMLElement} [loaderEl] loader element from form
 */
const handleSubmitForm = (event, loaderEl) => {
    const alertHandler = new AlertHandlerModel();

    event.preventDefault();

    loaderEl?.classList.remove('d-none');

    fetch(event.currentTarget.action, {
        method: 'POST',
        body: new FormData(event.currentTarget)
    })
        .then((response) => response.json())
        .then((response) => {
            if (response.error){
                throw new Error(response.message);
            }

            window.location.href = response.redirectUrl;
        })
        .catch((error) => {
            alertHandler.showAlertMessage({
                message: error.message,
                type: 'danger'
            });
        })
        .finally(() => {
            loaderEl?.classList.add('d-none');
        });
};

/**
 * @param {string} tabName - Tab name
 */
const replaceState = (tabName) => {
    window.history.replaceState(null, '', `${window.location.pathname}?tab=${tabName}`);
};

/**
 * @param {string} defaultLocation - Default location
 * @param {string} sectionName - Name of section in PayPal tab
 * @returns {string} - Location from URL or default
 */
const getLocationFromUrlBySection = (defaultLocation, sectionName) => {
    const tabName = 'paypal';
    const params = (new URLSearchParams(window.location.search));

    if (params.get('tab') === tabName  && params.get('section') === sectionName) {
        replaceState(tabName);

        if (params.get('location') !== 'all-locations') {
            return params.get('location');
        }
    }

    return defaultLocation;
};

module.exports = {
    getCsrfToken,
    getUrlWithCsrfToken,
    serializeForm,
    handleSubmitForm,
    getLocationFromUrlBySection
};
