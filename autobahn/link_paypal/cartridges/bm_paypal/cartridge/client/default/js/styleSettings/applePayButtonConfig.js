'use strict';

const helper = require('../helpers/helper');

((win, doc) => {
    const loaderEl = doc.getElementById('js-ap-loader');
    const locationEl = doc.getElementById('js-ap-location');
    const buttonStyleEl = doc.getElementById('js-ap-button-style');
    const buttonTypeEl = doc.getElementById('js-ap-type');

    const formEl = doc.getElementById('js-apple-pay-config-form');
    const containerEl = doc.getElementById('js-apple-pay-container');

    if (!formEl) {
        return;
    }

    const currentButtonStyles = JSON.parse(formEl.getAttribute('data-button-styles'));

    const getButtonConfigs = () => {
        return {
            buttonStyle: buttonStyleEl.value,
            type: buttonTypeEl.value
        };
    };

    const rebuildApplePayButton = buttonStyles => {
        const applePayButtonEl = document.getElementById('js-apple-pay-btn');

        applePayButtonEl.setAttribute('type', buttonStyles.type);
        applePayButtonEl.setAttribute('buttonstyle', buttonStyles.buttonStyle);
    };

    const updateButtonView = () => {
        rebuildApplePayButton(getButtonConfigs());
    };

    const updateButtonOptions = buttonStyles => {
        buttonStyleEl.value = buttonStyles.buttonStyle;
        buttonTypeEl.value = buttonStyles.type;
    };

    const handleLocation = () => {
        updateButtonOptions(currentButtonStyles[locationEl.value]);

        updateButtonView();
    };

    const applePayInit = () => {
        const change = 'change';

        if (containerEl) {
            const params = new URLSearchParams(win.location.search);

            let currentLocation = 'billing';

            if (params.get('tab') === 'apple-pay' && params.has('location')) {
                if (params.get('location') !== 'all-locations') {
                    currentLocation = params.get('location');
                }

                window.history.replaceState(null, '', `${window.location.pathname}?tab=apple-pay`);
            }

            const buttonStylesByLocation = currentButtonStyles[currentLocation];

            locationEl.value = currentLocation;

            updateButtonOptions(buttonStylesByLocation);

            rebuildApplePayButton(buttonStylesByLocation);

            locationEl.addEventListener(change, handleLocation);
            buttonStyleEl.addEventListener(change, updateButtonView);
            buttonTypeEl.addEventListener(change, updateButtonView);

            formEl.addEventListener('submit',  (event) => helper.handleSubmitForm(event, loaderEl));
        }
    };

    doc.addEventListener('DOMContentLoaded', applePayInit);
})(window, document);
