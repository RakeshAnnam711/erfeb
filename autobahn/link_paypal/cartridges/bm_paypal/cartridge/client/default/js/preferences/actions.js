/* eslint-disable no-console */

'use strict';

const AlertHandlerModel = require('../components/alertHandler');

const alertHandler = new AlertHandlerModel();

const JS_DW_VALUES = '.js-dw-values';

const doc = document;
const csrfToken = doc.querySelector('[name="csrf_token"]');

const instanceTypesObj = {
    0: 'sandbox',
    1: 'staging',
    2: 'production'
};

/**
 * Gets the client ID from the DOM.
 * @returns {string} The client ID, or an empty string if not found.
 */
const getClientId = () => {
    const element = doc.querySelector('[name="client-id"]');

    return element ? element.value : '';
};

/**
 * Adds semi opaque background on form while instance is being changed
 * @param {string} formId form ID
 * @returns {Object} An object with two methods: show and hide
 */
const transitionAnimation = (formId) => {
    const form = doc.getElementById(formId);

    return {
        show: () => form.classList.add('semi-opaque'),
        hide: () => form.classList.remove('semi-opaque')
    };
};

/**
 * Handles the default value for a given field in a row. If a default value is found,
 * it sets the field value and old value to this default (in lowercase). If not, it clears the field.
 *
 * @param {HTMLElement} rowEl - The row element in which to find the field.
 * @param {HTMLElement} fieldEl - The field element whose default value should be handled.
 */
const handleDefaultValue = (rowEl, fieldEl) => {
    const element = rowEl.querySelector('.js-default-value');

    if (element) {
        const defaultValue = element.dataset.defaultVal.toLowerCase();

        fieldEl.value = defaultValue;
        fieldEl.dataset.oldValue = defaultValue;
    } else {
        fieldEl.value = '';
        fieldEl.dataset.oldValue = '';
    }
};

/**
 * Changes values for preferences of another instance
 * @param {Object} data OCAPI response data
 * @param {Array} prefsWithChangedValues preferences which values have been changed
 * @param {HTMLElement} rowEl row where the preference is located
 */
const handleValuesChange = (data, prefsWithChangedValues, rowEl) => {
    const changedPrefValue = prefsWithChangedValues.find((pref) => rowEl.classList.contains(pref.toLowerCase()));
    const fieldEl = rowEl.querySelector('.js-dw-collection-field').firstElementChild;
    const setOfStringsValueFieldEl = rowEl.querySelector('[data-value-type-code="23"]');
    const enumOfIntValueFieldEl = rowEl.querySelector('[data-value-type-code="31"]');
    const enumOfStringsValueFieldEl = rowEl.querySelector('[data-value-type-code="33"]');

    if (setOfStringsValueFieldEl) {
        const valuesContainerEl = rowEl.querySelector(JS_DW_VALUES);

        Array.from(valuesContainerEl.children).forEach((elem) => {
            if (!elem.classList.contains('d-none')) {
                elem.remove();
            }
        });

        setOfStringsValueFieldEl.value = '';
        fieldEl.dataset.oldValue = '';

        if (changedPrefValue) {
            data[`c_${changedPrefValue}`].forEach((prefValue) => {
                const valueContainerEl = valuesContainerEl.firstElementChild.cloneNode(true);
                const valueTextEl = valueContainerEl.firstElementChild;
                const value = setOfStringsValueFieldEl.value.concat(`${setOfStringsValueFieldEl.value.length ? ',' : ''}`, prefValue);

                setOfStringsValueFieldEl.value = value;
                fieldEl.dataset.oldValue = value;

                valueTextEl.append(prefValue);
                valueContainerEl.prepend(valueTextEl);
                valuesContainerEl.append(valueContainerEl);

                valueContainerEl.classList.remove('d-none');
            });
        }
    } else if (enumOfIntValueFieldEl && !changedPrefValue) {
        fieldEl.value = '-1';
        fieldEl.dataset.oldValue = '-1';
    } else if (changedPrefValue) {
        fieldEl.value = data[`c_${changedPrefValue}`];
        fieldEl.dataset.oldValue = data[`c_${changedPrefValue}`];
    } else {
        handleDefaultValue(rowEl, fieldEl);
    }

    if (enumOfStringsValueFieldEl) {
        const checkboxEls = rowEl.querySelectorAll('.js-input-checkbox');
        const checkedValues = fieldEl.value.split(',');

        checkboxEls.forEach((checkboxEl) => {
            checkboxEl.checked = checkedValues.includes(checkboxEl.value);
        });
    }
};

/**
 * Stores the client ID in local storage and updates the client ID field in the DOM.
 */
const storeClientId = () => {
    const key = 'bm-client-id';
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const value = JSON.parse(localStorage.getItem(key));
    const element = doc.querySelector('[name="client-id"]');

    if (value && value.expires > Date.now()) {
        element.value = value.clientId;
    } else {
        const url = new URL('on/demandware.store/Sites-Site/default/ViewApplication-BM#/?preference#site_preference_groups', window.location.origin);

        fetch(url, {
            method: 'GET'
        })
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const htmlDocument = parser.parseFromString(html, 'text/html');
                const clientIdElement = htmlDocument.getElementById('dw-ocapi.client-id');
                const clientId = clientIdElement.getAttribute('content');

                localStorage.setItem(key, JSON.stringify({
                    clientId: clientId,
                    expires: Date.now() + oneDayInMilliseconds
                }));

                element.value = clientId;
            })
            .catch(error => {
                console.error('Error fetching HTML:', error);
            });
    }
};

/**
 * Get Access Token object
 * @returns {void}
 */
const getAccessToken = () => {
    const searchParams = new URLSearchParams();
    const url = new URL('dw/oauth2/access_token', window.location.origin);

    url.searchParams.append('csrf_token', csrfToken.value);

    searchParams.append('client_id', getClientId());
    searchParams.append('grant_type', 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken');

    return fetch(url.toString(), {
        method: 'POST',
        body: searchParams
    })
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => {
            alertHandler.showAlertMessage({
                type: 'danger',
                message: error.message
            });
        });
};

/**
 * Send POST request to save preferences
 * @param {Object} event - SubmitEvent
 * @param {Object} data - data sent from apply to other sites popup
 */
const savePreferencesHandler = async(event, data) => {
    event.preventDefault();

    const targetEl = data ? event.target.form : event.target;
    const disabledSelects = targetEl.querySelectorAll('select:disabled');
    const groupId = targetEl.id;
    const sectionName = targetEl.sectionName.value;

    const instanceTypeEl = doc.querySelector(`.js-instance-type[data-group-id="${groupId}"]`);

    const siteId = data ? data.siteId : instanceTypeEl.getAttribute('data-site-id');
    const instanceType = data ? data.instance : instanceTypesObj[instanceTypeEl.value];

    const url = new URL(`s/-/dw/data/v99_9/sites/${siteId}/site_preferences/preference_groups/${groupId}/${instanceType}`, window.location.origin);
    const searchParams = url.searchParams;

    searchParams.append('mask_passwords', 'true');
    searchParams.append('display_locale', 'default');
    searchParams.append('csrf_token', csrfToken.value);

    const token = await getAccessToken();

    const prefIdsWithMultiValueType = Array.from(targetEl.querySelectorAll('.js-multi-value')).map((input) => input.name);
    const prefIdsWithPasswordValueType = Array.from(targetEl.querySelectorAll('[data-value-type-code="13"]')).map((input) => input.name);
    const prefIdsWithStringValueType = Array
        .from(targetEl.querySelectorAll('[data-value-type-code="3"], [data-value-type-code="4"], [data-value-type-code="33"]'))
        .map((input) => input.name);

    disabledSelects.forEach((node) => {
        node.disabled = false;
    });

    const formData = data ? data.prefs : Object.fromEntries(new FormData(targetEl));
    const dataToSend = {};

    disabledSelects.forEach((node) => {
        node.disabled = true;
    });

    Object.keys(formData).forEach((key) => {
        if (key.includes('PP')) {
            if (prefIdsWithMultiValueType.includes(key)) {
                dataToSend[`c_${key}`] = formData[key].split(',');
            } else if (prefIdsWithStringValueType.includes(key) || prefIdsWithPasswordValueType.includes(key)) {
                dataToSend[`c_${key}`] = formData[key];
            } else if (!formData[key]) {
                dataToSend[`c_${key}`] = null;
            } else {
                dataToSend[`c_${key}`] = JSON.parse(formData[key]);
            }
        }
    });

    return fetch(url, {
        method: 'PATCH',
        headers: {
            Authorization: `${token.token_type} ${token.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    })
        .then((response) => response.json())
        .then((_data) => {
            _data.fault
                ? alertHandler.showAlertMessage({ type: 'danger', message: _data.fault.message })
                : alertHandler.showAlertMessage({
                    type: 'success',
                    message: `The custom preferences on the "${sectionName}" tab were saved for ${instanceType} instance of ${_data.site.id}.`
                });
        })
        .catch((error) => {
            alertHandler.showAlertMessage({
                type: 'danger',
                message: error.message
            });
        });
};

/**
 * Fetch Property Description
 * @param {Element} element - DOM element
 */
const fetchPropertyDescription = (element) => {
    const url = new URL('/on/demandware.store/Sites-Site/default/ViewApplication-GetTooltipJson', window.location.origin);
    const searchParams = url.searchParams;

    const attrId = element.getAttribute('data-dw-attr-id');

    searchParams.append('attrid', attrId);
    searchParams.append('tooltip', `c_${attrId}`);
    searchParams.append('attrtype', 'SitePreferences');
    searchParams.append('csrf_token', csrfToken.value);

    fetch(url.toString())
        .then(response => response.json())
        .then(response => {
            element.textContent = response.customText
                ? new DOMParser().parseFromString(response.customText, 'text/html').body.textContent
                : 'Not set';
        })
        .catch(error => {
            alertHandler.showAlertMessage({
                type: 'danger',
                message: error.message
            });
        });
};

/**
 * Changes preferences values for a specific instance
 * @param {Object} event - SubmitEvent
 * @returns {Promise} - OCAPI call to get preferences with their values for specific site and instance
 */
const handlerInstanceType = async(event) => {
    const target = event.target;

    const siteId = target.getAttribute('data-site-id');
    const groupId = target.getAttribute('data-group-id');
    const instanceType = instanceTypesObj[target.value];

    transitionAnimation(groupId).show();

    const url = new URL(`s/-/dw/data/v99_9/sites/${siteId}/site_preferences/preference_groups/${groupId}/${instanceType}`, window.location.origin);
    const searchParams = url.searchParams;

    searchParams.append('mask_passwords', 'true');
    searchParams.append('select', '(**)');
    searchParams.append('display_locale', 'default');
    searchParams.append('csrf_token', csrfToken.value);

    const token = await getAccessToken();

    return fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `${token.token_type} ${token.access_token}`
        }
    })
        .then((response) => response.json())
        .then((data) => {
            const prefsWithChangedValues = [];

            Object.keys(data).forEach((key) => {
                if (key.match(/c_/g)) {
                    prefsWithChangedValues.push(key.replace(/c_/g, ''));
                }
            });

            const attributeRowEls = doc.querySelectorAll(`#${groupId} .js-dw-attr-row`);

            attributeRowEls.forEach((rowEl) => handleValuesChange(data, prefsWithChangedValues, rowEl));
            transitionAnimation(groupId).hide();
        })
        .catch(error => {
            alertHandler.showAlertMessage({
                type: 'danger',
                message: error.message
            });
        });
};

module.exports = {
    storeClientId,
    handlerInstanceType,
    savePreferencesHandler,
    fetchPropertyDescription
};
