'use strict';

const helper = require('../helpers/helper');
const AlertHandlerModel = require('../components/alertHandler');

const CLASS_NAME_D_NONE = 'd-none';
const CLASS_NAME_GRID_TWO_COLUMNS = 'grid-two-columns';
const DATA_SMART_STYLE_SELECTOR = 'data-smart-styles';
const PAYPAL_SMART_BUTTON_DEFAULT_CONFIG = {
    height: 35,
    color: 'gold',
    shape: 'rect',
    label: 'checkout'
};

const paypal = window.paypal;
const alertHandler = new AlertHandlerModel();

const options = {
    onInit: (_, actions) => actions.disable(),
    createOrder: () => {},
    onApprove: () => {},
    onCancel: () => {},
    onError: () => {}
};

const formEl = document.getElementById('js-smartbutton-form');

const config = JSON.parse(formEl?.dataset?.config ?? '{}');

const colorButtonEl = document.getElementById('js-color-button');
const shapeButtonEl = document.getElementById('js-shape-button');
const labelEl = document.getElementById('js-label');
const locationButtonEl = document.getElementById('js-location-button');

const heightFormControlNumberEl = document.getElementById('js-height-number');
const heightFormControlRangeEl = document.getElementById('js-height-range');

const venmoNote = document.querySelector('.js-venmo-eligibility');
const buttonsContainer = document.querySelector('.js-buttons-container');
const fundingSources = [paypal.FUNDING.PAYPAL, paypal.FUNDING.VENMO, paypal.FUNDING.PAYLATER, paypal.FUNDING.CARD];
const fundingContainers = fundingSources.map((fundingSource) => document.querySelector(`.js-${fundingSource}-button-container`));

/**
 * Clear the HTML content
 */
function clearContent() {
    fundingContainers.forEach((container) => {
        container.innerHTML = '';
    });
}

/**
 * Filter styles for Venmo button
 * @param {string} fundingSource - Funding source
 * @param {Object} style - Button style
 * @returns {Object} - Filtered styles for Venmo button
 */
function filterButtonStyle(fundingSource, style) {
    if (fundingSource === paypal.FUNDING.VENMO) {
        return {
            ...style,
            color: style.color === 'gold' ? 'blue' : style.color
        };
    }

    if (fundingSource === paypal.FUNDING.CARD) {
        return {
            ...style,
            color: ['black', 'white'].includes(style.color) ? style.color : 'black'
        };
    }

    return style;
}

/**
 * Return style configurations for PayPal smart button
 * Available values:
 *  height: (number) from 25 to 55,
 *  color: (string) gold, blue, silver, black, white,
 *  shape: (string) pill, rect,
 *
 * @returns {Object} object with height, color, shape, label configuration values in it
 */
function getSmartButtonStyleConfigs() {
    return {
        height: Math.floor(heightFormControlRangeEl.value),
        color: colorButtonEl.value,
        shape: shapeButtonEl.value,
        label: labelEl.value
    };
}

/**
 * Update html option's with saved PayPal smart button values from custom pref PP_Smart_Button_Styles
 * @param {Object} savedSmartStyles object with height, color, shape, label configs
 */
function updateValuesWithStyleConfigs(savedSmartStyles) {
    heightFormControlNumberEl.value = savedSmartStyles.height;
    heightFormControlRangeEl.value = savedSmartStyles.height;
    colorButtonEl.value = savedSmartStyles.color;
    shapeButtonEl.value = savedSmartStyles.shape;
    labelEl.value = savedSmartStyles.label;
    locationButtonEl.value = savedSmartStyles.location;
}

/**
 * Hide Venmo note block
 */
function hideVenmoNote() {
    venmoNote.classList.add(CLASS_NAME_D_NONE);
}

/**
 * Render buttons
 * @param {Object} style - Button styles
 */
function renderButtons(style) {
    const location = style.location ?? locationButtonEl.value;

    venmoNote.classList.remove(CLASS_NAME_D_NONE);
    buttonsContainer.classList.remove(CLASS_NAME_GRID_TWO_COLUMNS);
    fundingContainers.forEach(container => container.classList.remove(CLASS_NAME_D_NONE));

    fundingSources.forEach((fundingSource) => {
        const isVenmo = fundingSource === paypal.FUNDING.VENMO;

        if (!config[fundingSource].active) {
            if (isVenmo) {
                hideVenmoNote();
            }

            return;
        }

        if (config[fundingSource].locations?.[location] === false) {
            if (isVenmo) {
                hideVenmoNote();
            }

            return;
        }

        const button = paypal.Buttons({
            ...options,
            fundingSource: fundingSource,
            style: filterButtonStyle(fundingSource, style)
        });

        if (button.isEligible()) {
            button.render(`.js-${fundingSource}-button-container`);

            if (isVenmo) {
                hideVenmoNote();
            }
        }
    });
}

/**
 * Renders the PayPal smart button based on the received configuration object (styleConfiguration).
 * @param {Object} styleConfiguration object with color, height, label, location, shape, configs
 */
function renderPaypalButton(styleConfiguration) {
    if (!styleConfiguration) {
        styleConfiguration = getSmartButtonStyleConfigs();
        clearContent();
        alertHandler.fadeAlerts();
    }

    renderButtons(styleConfiguration);
}

document.addEventListener('DOMContentLoaded', function() {
    if (!formEl) {
        return;
    }

    alertHandler.closeAlert();

    const location = helper.getLocationFromUrlBySection('billing', 'button');

    let smartButtonConfig = JSON.parse(formEl.getAttribute(DATA_SMART_STYLE_SELECTOR))[location];

    if (!smartButtonConfig) {
        smartButtonConfig = PAYPAL_SMART_BUTTON_DEFAULT_CONFIG;
    }

    smartButtonConfig.location = location;

    updateValuesWithStyleConfigs(smartButtonConfig);
    renderPaypalButton(smartButtonConfig);

    colorButtonEl.addEventListener('change', () => renderPaypalButton());

    labelEl.addEventListener('change', () => renderPaypalButton());

    heightFormControlRangeEl.addEventListener('change', () => {
        const smartButtonStyleConfigs = getSmartButtonStyleConfigs();

        clearContent();
        alertHandler.fadeAlerts();

        heightFormControlNumberEl.value = heightFormControlRangeEl.value;
        renderPaypalButton(smartButtonStyleConfigs);
    });

    heightFormControlNumberEl.addEventListener('change', () => {
        alertHandler.fadeAlerts();
        heightFormControlRangeEl.value = heightFormControlNumberEl.value;

        const event = document.createEvent('Event');

        event.initEvent('change', true, true);

        // Dispatch the event
        heightFormControlRangeEl.dispatchEvent(event);
    });

    shapeButtonEl.addEventListener('change', () => renderPaypalButton());

    locationButtonEl.addEventListener('change', () => {
        const locationButton = locationButtonEl.value;
        const styles = JSON.parse(
            formEl.getAttribute(DATA_SMART_STYLE_SELECTOR)
        );

        clearContent();
        alertHandler.fadeAlerts();

        if (!styles[locationButton]) {
            styles[locationButton] = PAYPAL_SMART_BUTTON_DEFAULT_CONFIG;
        }

        styles[locationButton].location = locationButton;
        updateValuesWithStyleConfigs(styles[locationButton]);

        Promise.resolve()
            .then(() => {
                renderButtons(styles[locationButton]);
            })
            .then(() => {
                window.scrollTo(0, 0);
            });
    });

    formEl.addEventListener('submit', helper.handleSubmitForm);
});
