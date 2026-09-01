'use strict';

const helper = require('../helpers/helper');

((win, doc) => {
    const cardNumberFieldEl = doc.getElementById('card-number');
    const expDataFieldEl = doc.getElementById('exp-date');
    const cvvFieldEl = doc.getElementById('cvv');

    const formEl = doc.getElementById('js-pphf-config-form');
    const colorEl = doc.getElementById('js-pphf-input-color');
    const invalidColorEl = doc.getElementById('js-pphf-invalid-color');
    const validColorEl = doc.getElementById('js-pphf-valid-color');

    const fontSizeFormControlNumberEl = doc.getElementById('js-font-size-number');
    const fontSizeFormControlRangeEl = doc.getElementById('js-font-size-range');

    const allExampleInputEls = doc.getElementsByClassName('js-card-fields-form-input');

    /**
    * Validates inputs based on field values
    */
    function validate() {
        if (cardNumberFieldEl.value === '1111 1111 1111 1111') {
            cardNumberFieldEl.style.color = invalidColorEl.value;
        } else if (cardNumberFieldEl.value.length === 19) {
            cardNumberFieldEl.style.color = validColorEl.value;
        } else {
            cardNumberFieldEl.style.color = colorEl.value;
        }

        if (expDataFieldEl.value === '11 / 11') {
            expDataFieldEl.style.color = invalidColorEl.value;
        } else if (expDataFieldEl.value.length === 7) {
            expDataFieldEl.style.color = validColorEl.value;
        } else {
            expDataFieldEl.style.color = colorEl.value;
        }

        if (cvvFieldEl.value.length === 3) {
            cvvFieldEl.style.color = validColorEl.value;
        } else {
            cvvFieldEl.style.color = colorEl.value;
        }
    }

    /**
     * Updates the credit card view based on selected styles
     */
    function updateView() {
        Array.prototype.forEach.call(allExampleInputEls, (element) => {
            element.style.color = colorEl.value;
            element.style.fontSize = `${fontSizeFormControlRangeEl.value}pt`;
        });

        validate();
    }

    fontSizeFormControlRangeEl.addEventListener('change', () => {
        fontSizeFormControlNumberEl.value = fontSizeFormControlRangeEl.value;

        Array.prototype.forEach.call(allExampleInputEls, (element) => {
            element.style.fontSize = `${fontSizeFormControlRangeEl.value}pt`;
        });
    });

    fontSizeFormControlNumberEl.addEventListener('change', () => {
        fontSizeFormControlRangeEl.value = fontSizeFormControlNumberEl.value;
    });

    formEl.addEventListener('change', () => updateView());

    cvvFieldEl.addEventListener('input', () => updateView());

    cardNumberFieldEl.addEventListener('input', (event) => {
        const cardField = event.target;
        const cardValue = cardField.value.replace(/\D/g, '').substring(0, 16);

        let formattedValue = '';

        for (let i = 0; i < cardValue.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }

            formattedValue += cardValue.charAt(i);
        }

        cardField.value = formattedValue;

        validate();
    });

    expDataFieldEl.addEventListener('input', (event) => {
        const expDateField = event.target;
        const expDateValue = expDateField.value.replace(/\D/g, '').substring(0, 4);

        let formattedValue = '';

        for (let i = 0; i < expDateValue.length; i++) {
            if (i === 2) {
                formattedValue += ' / ';
            }

            formattedValue += expDateValue.charAt(i);
        }

        expDateField.value = formattedValue;

        validate();
    });

    formEl.addEventListener('submit',  helper.handleSubmitForm);

    doc.addEventListener('DOMContentLoaded', () => {
        const cardFieldsStyles = JSON.parse(formEl.getAttribute('data-card-fields-styles'));

        colorEl.value = cardFieldsStyles.color;
        invalidColorEl.value = cardFieldsStyles.invalidColor;
        validColorEl.value = cardFieldsStyles.validColor;

        fontSizeFormControlNumberEl.value = cardFieldsStyles.fontSize;
        fontSizeFormControlRangeEl.value = cardFieldsStyles.fontSize;

        const params = new URLSearchParams(win.location.search);

        if (params.get('tab') === 'card-fields' && params.has('location')) {
            win.history.replaceState(null, '', `${win.location.pathname}?tab=card-fields`);
        }

        updateView();
    });
})(window, document);
