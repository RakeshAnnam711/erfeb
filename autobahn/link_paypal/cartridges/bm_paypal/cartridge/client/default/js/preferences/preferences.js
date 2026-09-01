/* eslint-disable no-console */

'use strict';

const actions = require('./actions');
const handlers = require('./handlers');
const AlertHandlerModel = require('../components/alertHandler');
const ApplyToOtherSitesWizard = require('./applyToOtherSitesWizard');

/**
 * Makes fields inactive which should be inactive depending on pref value that influences their state
 * @param {Object} doc -
 * @returns {void}
 */
const makeFieldsInactive = (doc) => {
    const relations = JSON.parse(doc.querySelector('[data-relations]').getAttribute('data-relations'));

    relations
        .forEach((relation) => {
            const arrayOfOldValue = [].concat(relation.oldValue);
            const relationValue = doc.querySelector(`[name="${relation.id}"]`)?.value;
            const conditionMatched = handlers.handlerConditions(relation.conditions);

            if (!(arrayOfOldValue.includes(relationValue) && conditionMatched)) {
                return;
            }

            relation.triggers
                .filter((trigger) => {
                    return trigger.type === 'disable' && trigger.value && trigger.onLoad;
                })
                .forEach((trigger) => {
                    doc.querySelector(`[name="${trigger.id}"]`).disabled = true;
                });
        });
};

((doc) => {
    const alertHandler = new AlertHandlerModel();
    const applyToOtherSitesWizard = new ApplyToOtherSitesWizard();

    const JS_DW_VALUES = '.js-dw-values';

    const savedMultiValues = {};

    alertHandler.closeAlert();

    /**
     * Filters an array of rows based on whether their class name includes the given value.
     * @param {Array<HTMLElement>} rows - An array of row elements to filter.
     * @param {Array<HTMLElement>} messages - An array of messages elements.
     * @param {string} value - The value to filter the rows by.
     * @returns {void}
     */
    const filterRowsByValue = (rows, messages, value) => {
        let count = 0;

        rows.forEach(row => {
            if (row.className.includes(value)) {
                row.classList.remove('d-none');
            } else {
                row.classList.add('d-none');
                count++;
            }
        });

        messages.forEach(element => {
            element.classList[rows.length === count ? 'remove' : 'add']('ng-hide');
        });
    };

    /**
     * Handles filtering of preference attribute grids.
     * @returns {void}
     */
    const handlerFilterPreferences = () => {
        const inputs = doc.querySelectorAll('.js-search-field');
        const buttons = doc.querySelectorAll('.js-button-search');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const parent = button.closest('.dw-PreferenceAttributegrid');
                const input = parent.querySelector('.js-search-field');
                const rows = parent.querySelectorAll('.dw-row');
                const messages = parent.querySelectorAll('.grid-message');

                filterRowsByValue(rows, messages, input.value.toLowerCase().trim());
            });
        });

        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const parent = input.closest('.dw-PreferenceAttributegrid');
                const rows = parent.querySelectorAll('.dw-row');
                const messages = parent.querySelectorAll('.grid-message');

                filterRowsByValue(rows, messages, input.value.toLowerCase().trim());
            });
        });
    };

    /**
     * Stores saved multi values as serialized HTML fragment
     */
    const storeSavedMultiValues = () => {
        doc.querySelectorAll(JS_DW_VALUES).forEach((elem) => {
            savedMultiValues[elem.dataset.attrName] = elem.outerHTML;
        });
    };

    /**
     * Updates fields data attr old-value
     * And stores saved multi values as serialized HTML fragment
     * @returns {void}
     */
    const updateDataAttrOldValue = function() {
        const formId = this.form.id;

        doc.querySelectorAll(`#${formId} .js-dw-collection-field`).forEach((elem) => {
            const fieldOldValue = elem.firstElementChild.dataset.oldValue;
            const fieldCurrentValue = elem.firstElementChild.value;

            if (fieldOldValue !== fieldCurrentValue) {
                const multiValuesContainerEl = elem.querySelector(JS_DW_VALUES);

                if (multiValuesContainerEl) {
                    savedMultiValues[multiValuesContainerEl.dataset.attrName] = multiValuesContainerEl.outerHTML;
                }

                elem.firstElementChild.dataset.oldValue = fieldCurrentValue;
            }
        });
    };

    /**
     * Restores Set of String newly added entries on cancel button click
     * @param {string} formId - Form ID
     * @returns {void}
     */
    const restoreMultiValues = function(formId) {
        doc.querySelectorAll(`#${formId} .js-multi-value`).forEach((inputEl) => {
            const oldValue = inputEl.dataset.oldValue;
            const currentValue = inputEl.value;

            if (oldValue !== currentValue) {
                const valuesContainerEl = inputEl.parentElement.querySelector(JS_DW_VALUES);

                valuesContainerEl.outerHTML = savedMultiValues[valuesContainerEl.dataset.attrName];
                inputEl.value = oldValue;
            }
        });
    };

    /**
     * Adds Set of Strings value as a separate value below the input
     * And stores it in hidden input to further submit it in the form
     * @returns {void}
     */
    const addMultiValue = function() {
        const storedValuesInputEl = this.parentElement.previousElementSibling;
        const valuesContainerEl = this.parentElement.nextElementSibling;
        const valueContainerEl = valuesContainerEl.firstElementChild.cloneNode(true);
        const valueTextEl = valueContainerEl.firstElementChild;
        const value = this.previousElementSibling.value.replace(/\s/g, '');

        valueTextEl.append(value);
        valueContainerEl.prepend(valueTextEl);
        valuesContainerEl.append(valueContainerEl);

        storedValuesInputEl.value = storedValuesInputEl.value.concat(`${storedValuesInputEl.value.length ? ',' : ''}`, value);
        this.previousElementSibling.value = '';
        this.disabled = true;

        valueContainerEl.classList.remove('d-none');
    };

    /**
     * The function adds value from the checkbox to the hidden multi-select input field
     * @returns {void}
     */
    const addValueFromCheckbox = function() {
        const checkboxContainerEl = this.parentElement;
        const inputFieldEl = checkboxContainerEl.parentElement.querySelector('.js-multi-value');
        const inputValue = inputFieldEl.value.length ? inputFieldEl.value.split(',') : [];

        if (this.checked) {
            inputValue.push(this.value);
        } else {
            inputValue.splice(inputValue.indexOf(this.value), 1);
        }

        inputFieldEl.value = inputValue.join(',');
    };

    /**
     * Removes Set of String value
     * @returns {void}
     */
    const removeMultiValue = function() {
        const storedValuesInputEl = doc.querySelector(`input[name="${this.dataset.attrName}"]`);
        const value = this.previousElementSibling.innerText;

        storedValuesInputEl.value = storedValuesInputEl.value.split(',').filter((val) => val !== value).join(',');
        this.parentElement.remove();
    };

    /**
     * Disables the button on input submit
     * @returns {void}
     */
    const enableAddButton = function() {
        this.nextElementSibling.disabled = false;
    };

    /**
     * Submits input value on enter
     * @param {Event} event keydown event
     * @returns {void}
     */
    const submitOnEnter = function(event) {
        const KEY_ENTER = 13;

        if (event.keyCode === KEY_ENTER) {
            event.preventDefault();
            this.nextElementSibling.click();
        }
    };

    doc.addEventListener('DOMContentLoaded', () => {
        const forms = doc.querySelectorAll('.js-form-preferences');
        const attributes = doc.querySelectorAll('[data-dw-attr-id]');
        const instanceTypes = doc.querySelectorAll('.js-instance-type');
        const multiValueInputs = doc.querySelectorAll('.js-text-field');
        const checkboxInputs = doc.querySelectorAll('.js-input-checkbox');
        const dropdowns = doc.querySelectorAll('.js-dw-select');
        const actionSave = doc.querySelectorAll('.js-action-save');
        const actionAdd = doc.querySelectorAll('.js-action-add');
        const actionCancel = doc.querySelectorAll('.js-action-cancel');
        const actionApplyToSites = doc.querySelectorAll('.js-action-apply-to-sites');
        const wizardActionClose = doc.querySelector('.js-dw-wizard-close');
        const wizardToNextStage = doc.querySelector('.js-button-next');
        const wizardToPrevStage = doc.querySelector('.js-button-back');
        const wizardProgressItems = doc.querySelectorAll('[data-progress-id]');
        const wizardSelectAllSites = doc.querySelector('.js-select-all');
        const wizardActionApply = doc.querySelector('.js-button-apply');
        const wizardAlertActionProceed = doc.querySelector('.js-wizard-alert-ok');

        actions.storeClientId();
        handlerFilterPreferences();
        storeSavedMultiValues();
        makeFieldsInactive(doc);

        forms.forEach(form => {
            form.addEventListener('submit', actions.savePreferencesHandler);
        });

        attributes.forEach(element => {
            actions.fetchPropertyDescription(element);
        });

        instanceTypes.forEach(element => {
            element.addEventListener('change', actions.handlerInstanceType);
        });

        actionSave.forEach(button => {
            button.addEventListener('click', handlers.handlerBeforeSubmit);
            button.addEventListener('click', updateDataAttrOldValue);
        });

        actionAdd.forEach(button => {
            button.addEventListener('click', addMultiValue);
        });

        actionCancel.forEach(button => {
            button.addEventListener('click', function() {
                restoreMultiValues(this.form.id);
            });
        });

        multiValueInputs.forEach(input => {
            input.addEventListener('input', enableAddButton);
            input.addEventListener('keydown', submitOnEnter);
        });

        checkboxInputs.forEach(checkbox => {
            checkbox.addEventListener('click', addValueFromCheckbox);
        });

        actionApplyToSites.forEach(button => {
            button.addEventListener('click', handlers.handlerBeforeSubmit);
            button.addEventListener('click', function() {
                applyToOtherSitesWizard.show(this.form.id);
            });
        });

        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', function() {
                handlers.handleOldValueAttrChange(this);
                handlers.handlerRelations(this.name);
            });
        });

        wizardProgressItems.forEach(itemEl => {
            itemEl.addEventListener('click', () => applyToOtherSitesWizard.handleProgressBarClick(itemEl));
        });

        wizardAlertActionProceed.addEventListener('click', function() {
            applyToOtherSitesWizard.proceedToWizard(this.form.id);
            restoreMultiValues(this.form.id);
        });

        wizardActionClose.addEventListener('click', () => applyToOtherSitesWizard.close());
        wizardToNextStage.addEventListener('click', () => applyToOtherSitesWizard.toNextStage());
        wizardToPrevStage.addEventListener('click', () => applyToOtherSitesWizard.toPrevStage());
        wizardSelectAllSites.addEventListener('click', () => applyToOtherSitesWizard.selectAllSites());
        wizardActionApply.addEventListener('click', (event) => applyToOtherSitesWizard.apply(event, actions.savePreferencesHandler));

        doc.body.addEventListener('click', (event) => {
            if (event.target.classList.contains('js-action-remove')) {
                removeMultiValue.call(event.target);
            }
        });
    });
})(document);
