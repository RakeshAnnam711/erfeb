'use strict';

const helper = require('../helpers/helper');
const AlertHandlerModel = require('../components/alertHandler');

const PAYPAL_BUTTON_MESSAGE_DEFAULT_CONFIG = {
    align: 'center',
    color: 'black',
    position: 'bottom'
};

((win, doc) => {
    const BUTTON_MESSAGE_CONTAINER_SELECTOR = '.js-paypal-button-message';

    const buttonMessageConfigForm = doc.querySelector('.js-button-message-form');
    const buttonMessageContainer = doc.querySelector(BUTTON_MESSAGE_CONTAINER_SELECTOR);

    const alertHandler = new AlertHandlerModel();

    if (!buttonMessageConfigForm) {
        return;
    }

    const styleAlign = doc.querySelector('.js-style-align-button-message');
    const styleColor = doc.querySelector('.js-style-color-button-message');
    const stylePosition = doc.querySelector('.js-style-position-button-message');
    const locationEl = doc.querySelector('.js-button-message-location');

    /**
     * Clear the HTML content
     */
    function clearContent() {
        buttonMessageContainer.innerHTML = '';
    }

    /**
     * Return style configurations for PayPal button message
     * Available values:
     *  align: (string) center, left, right
     *  color: (string) black, white,
     *  position: (string) top, bottom
     *
     * @returns {Object} object with align, color, position
     */
    function getButtonMessageStyleConfigs() {
        return {
            align: styleAlign.value,
            color: styleColor.value,
            position: stylePosition.value
        };
    }

    /**
     * Update html option's with saved PayPal button message values from custom pref PP_Button_Message_Styles
     * @param {Object} savedMessageStyles with align, color, position, location
     */
    function updateValuesWithConfigs(savedMessageStyles) {
        styleAlign.value = savedMessageStyles.align;
        styleColor.value = savedMessageStyles.color;
        stylePosition.value = savedMessageStyles.position;
        locationEl.value = savedMessageStyles.location;
    }

    /**
     * Renders the PayPal button message based on the received configuration object (styleConfiguration).
     * @param {Object} styleConfiguration with align, color, position
     */
    function renderButtonMessage(styleConfiguration) {
        clearContent();

        if (!styleConfiguration) {
            styleConfiguration = getButtonMessageStyleConfigs();
            alertHandler.fadeAlerts();
        }

        paypal.Buttons({
            fundingSource: paypal.FUNDING.PAYPAL,
            onInit: (_, actions) => {
                return actions.disable();
            },
            message: {
                amount: 100,
                align: styleConfiguration.align,
                color: styleConfiguration.color,
                position: styleConfiguration.position
            }
        }).render(BUTTON_MESSAGE_CONTAINER_SELECTOR);
    }

    /**
     * Causes the button to be updated
     */
    function handleChangeValue() {
        alertHandler.fadeAlerts();
        renderButtonMessage();
    }

    doc.addEventListener('DOMContentLoaded', () => {
        if (!buttonMessageContainer) {
            return;
        }

        const location = helper.getLocationFromUrlBySection('billing', 'message');

        let buttonMessageConfig = JSON.parse(buttonMessageConfigForm.getAttribute('data-button-message-styles'))[location];

        if (!buttonMessageConfig) {
            buttonMessageConfig = PAYPAL_BUTTON_MESSAGE_DEFAULT_CONFIG;
        }

        buttonMessageConfig.location = location;

        styleAlign.addEventListener('change', handleChangeValue);
        styleColor.addEventListener('change', handleChangeValue);
        stylePosition.addEventListener('change', handleChangeValue);

        locationEl.addEventListener('change', () => {
            const pageButtonMessageConfig = JSON.parse(buttonMessageConfigForm.getAttribute('data-button-message-styles'))[locationEl.value];

            pageButtonMessageConfig.location = locationEl.value;

            updateValuesWithConfigs(pageButtonMessageConfig);
            renderButtonMessage(pageButtonMessageConfig);
        });

        buttonMessageConfigForm.addEventListener('submit', helper.handleSubmitForm);

        updateValuesWithConfigs(buttonMessageConfig);
        renderButtonMessage(buttonMessageConfig);
    });

})(window, document);
