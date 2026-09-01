'use strict';

const helper = require('../helpers/helper');

((win, doc) => {
    const EVENT_TYPE_CHANGE = 'change';

    const loaderEl = doc.querySelector('.js-google-pay-loader');
    const locationEl = doc.querySelector('.js-google-pay-location');
    const buttonColorEl = doc.querySelector('.js-google-pay-color');
    const buttonTypeEl = doc.querySelector('.js-google-pay-type');
    const cornerRadiusChangeEl = doc.querySelector('.js-google-pay-corner-radius-range');
    const cornerRadiusChangeNumberEl = doc.querySelector('.js-google-pay-corner-radius-range-number');
    const customSizeEl = doc.querySelector('.js-google-pay-type-mode');

    const formEl = doc.querySelector('.js-google-pay-config-form');
    const containerEl = doc.querySelector('.js-google-pay-container');

    if (!formEl) {
        return;
    }

    const currentButtonStyles = JSON.parse(formEl.getAttribute('data-button-styles'));

    const getButtonConfigs = () => {
        return {
            buttonColor: buttonColorEl.value,
            buttonType: buttonTypeEl.value,
            buttonRadius: cornerRadiusChangeEl.value,
            buttonSizeMode: customSizeEl.value
        };
    };

    const rebuildGooglePayButton = googlePayStyle => {
        const googlePayButtonEl = document.querySelector('.js-google-pay-button');
        const paymentsClient = new google.payments.api.PaymentsClient({
            environment: 'TEST'
        });

        googlePayStyle.onClick = () => {};

        googlePayButtonEl.innerHTML = '';
        googlePayButtonEl.appendChild(paymentsClient.createButton(googlePayStyle));
    };

    const updateButtonView = () => {
        rebuildGooglePayButton(getButtonConfigs());
    };

    const updateButtonOptions = buttonStyles => {
        buttonColorEl.value = buttonStyles.buttonColor;
        buttonTypeEl.value = buttonStyles.buttonType;
        cornerRadiusChangeEl.value = buttonStyles.buttonRadius;
        cornerRadiusChangeNumberEl.value = buttonStyles.buttonRadius;
        customSizeEl.value = buttonStyles.buttonSizeMode;
    };

    const handleLocation = () => {
        updateButtonOptions(currentButtonStyles[locationEl.value]);

        updateButtonView();
    };

    const googlePayInit = () => {
        if (containerEl) {
            const params = new URLSearchParams(win.location.search);

            let currentLocation = 'billing';

            if (params.get('tab') === 'google-pay' && params.has('location')) {
                if (params.get('location') !== 'all-locations') {
                    currentLocation = params.get('location');
                }

                window.history.replaceState(null, '', `${window.location.pathname}?tab=google-pay`);
            }

            const buttonStylesByLocation = currentButtonStyles[currentLocation.toLowerCase()];

            locationEl.value = currentLocation;

            updateButtonOptions(buttonStylesByLocation);
            rebuildGooglePayButton(buttonStylesByLocation);

            locationEl.addEventListener(EVENT_TYPE_CHANGE, handleLocation);
            buttonColorEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
            buttonTypeEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
            cornerRadiusChangeEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
            cornerRadiusChangeNumberEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
            customSizeEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);

            formEl.addEventListener('submit', (event) => helper.handleSubmitForm(event, loaderEl));
        }
    };

    cornerRadiusChangeEl.addEventListener(EVENT_TYPE_CHANGE, () => {
        cornerRadiusChangeNumberEl.value = cornerRadiusChangeEl.value;
    });

    cornerRadiusChangeNumberEl.addEventListener(EVENT_TYPE_CHANGE, () => {
        cornerRadiusChangeEl.value = cornerRadiusChangeNumberEl.value;
    });

    doc.addEventListener('DOMContentLoaded', googlePayInit);
})(window, document);
