'use strict';

const helper = require('../helpers/helper');

((win, doc, paypal) => {
    const formEl = doc.getElementById('js-cwpp-config-form');

    if (!formEl) {
        return;
    }

    const buttonOptions = {
        theme: 'blue',
        buttonType: 'LWP',
        buttonSize: 'lg',
        buttonShape: 'rect'
    };

    const loaderEl = doc.getElementById('js-cwpp-loader');
    const locationEl = doc.getElementById('js-cwpp-location');
    const containerEl = doc.getElementById('js-cwpp-button');

    const themeEl = doc.getElementById('js-cwpp-theme-button');
    const buttonTypeEl = doc.getElementById('js-cwpp-label');
    const buttonSizeEl = doc.getElementById('js-cwpp-size');
    const buttonShapeEl = doc.getElementById('js-cwpp-shape-button');

    const updateButtonStyle = (key, value) => {
        containerEl.innerHTML = '';

        if (key !== undefined) {
            buttonOptions[key] = value;
        }

        const payPalApiConfig = JSON.parse(formEl.getAttribute('data-paypal-api-config'));

        // https://developer.paypal.com/docs/log-in-with-paypal/integrate/generate-button
        paypal.use(['login'], function(login) {
            login.render({
                appid: payPalApiConfig.appid,
                scopes: 'openid profile email address',
                authend: payPalApiConfig.authend,
                containerid: 'js-cwpp-button',
                responseType: 'code',
                locale: payPalApiConfig.locale,
                theme: buttonOptions.theme,
                labelType: buttonOptions.buttonType,
                buttonType: buttonOptions.buttonType,
                buttonShape: buttonOptions.buttonShape,
                buttonSize: buttonOptions.buttonSize,
                fullPage: 'true',
                returnurl: payPalApiConfig.returnurl
            });
        });
    };

    const handleSize = () => {
        updateButtonStyle('buttonSize', buttonSizeEl.value);
    };

    const handleTheme = () => updateButtonStyle('theme', themeEl.value);
    const handleType = () => updateButtonStyle('buttonType', buttonTypeEl.value);
    const handleShape = () => updateButtonStyle('buttonShape', buttonShapeEl.value);

    const updateButtonOptionsByLocation = (locationKey) => {
        const data = JSON.parse(formEl.getAttribute('data-button-styles'))[locationKey];

        buttonOptions.theme = data.theme;
        buttonOptions.buttonType = data.buttonType;
        buttonOptions.buttonSize = data.buttonSize;
        buttonOptions.buttonShape = data.buttonShape;

        themeEl.value = data.theme;
        buttonTypeEl.value = data.buttonType;
        buttonSizeEl.value = data.buttonSize;
        buttonShapeEl.value = data.buttonShape;

        updateButtonStyle();
    };

    const handleLocation = () => {
        updateButtonOptionsByLocation(locationEl.value);
    };

    const cwppInit = () => {
        let location = 'login';

        const params = new URLSearchParams(win.location.search);

        if (params.get('tab') === 'cwpp' && params.has('location')) {
            if (params.get('location') !== 'all-locations') {
                location = params.get('location');
            }

            win.history.replaceState(null, '', `${win.location.pathname}?tab=cwpp`);
        }

        locationEl.value = location;

        updateButtonOptionsByLocation(location);

        themeEl.addEventListener('change', handleTheme);
        buttonTypeEl.addEventListener('change', handleType);
        buttonShapeEl.addEventListener('change', handleShape);
        buttonSizeEl.addEventListener('change', handleSize);

        formEl.addEventListener('submit', (event) => helper.handleSubmitForm(event, loaderEl));
        locationEl.addEventListener('change', handleLocation);
    };

    doc.addEventListener('DOMContentLoaded', () => {
        if (!containerEl) {
            return;
        }

        const script = doc.createElement('script');

        script.id = 'paypal-api';
        script.src = containerEl.getAttribute('data-cwpp-sdk');

        script.onload = cwppInit;

        doc.body.appendChild(script);
    });
})(window, document, window.paypal);
