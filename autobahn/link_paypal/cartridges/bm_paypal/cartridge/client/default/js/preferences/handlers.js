'use script';

const AlertHandlerModel = require('../components/alertHandler');

const doc = document;
const alertHandler = new AlertHandlerModel();

/**
 * Retrieves the value of an element by its name attribute.
 *
 * @param {string} name - The name attribute of the element to retrieve the value for.
 * @returns {string} The value of the element with the given name attribute, or an empty string if the element was not found.
 */
const getValueByName = (name) => {
    const element = doc.querySelector(`[name="${name}"]`);

    return element ? element.value : '';
};

/**
 * Retrieves the value of an element by attribute name.
 *
 * @param {string} name - The name attribute of the element to retrieve the value for.
 * @returns {string} The attribute value of the element with the given name attribute, or an empty string if the element was not found.
 */
const getValueByAttr = (name) => {
    const element = doc.querySelector(`[name="${name}"]`);

    return element ? element.getAttribute('data-old-value') : '';
};

/**
 * Handles data set attribute oldValue change
 * @param {HTMLElement} element an HTML element
 */
const handleOldValueAttrChange = (element) => {
    const prevSelectedOption = element.querySelector('[data-selected="true"]');

    if (prevSelectedOption) {
        element.dataset.oldValue = prevSelectedOption.value;
        delete prevSelectedOption.dataset.selected;
    }

    element.selectedOptions[0].dataset.selected = true;
};

/**
 * Handles the triggers for a relation.
 *
 * @param {Array<Object>} triggers - An array of trigger objects to handle.
 * @returns {void}
 */
const handlerTriggers = (triggers) => {
    for (let index = 0; index < triggers.length; index++) {
        const action = triggers[index];
        const element = doc.querySelector(`[name="${action.id}"`);

        if (action.type === 'alert') {
            alertHandler.showAlertMessage({
                type: 'primary',
                message: action.message
            });
        }

        if (action.type === 'change') {
            element.value = action.value;
            handleOldValueAttrChange(element);
        }

        if (action.type === 'disable') {
            element.disabled = action.value;
        }
    }
};

/**
 * Handles the conditions for a relation.
 *
 * @param {Array<Object>} conditions - An array of condition objects to handle.
 * @returns {boolean} Whether or not all conditions were met.
 */
const handlerConditions = (conditions) => {
    let conditionMatched = true;

    for (let index = 0; index < conditions.length; index++) {
        const condition = conditions[index];
        const { id: conditionId, value: conditionValue, operator } = condition;

        if (operator === 'and') {
            if (conditionValue !== getValueByName(conditionId)) {
                conditionMatched = false;

                break;
            }
        } else if (operator === 'or') {
            if (conditionValue === getValueByName(conditionId)) {
                conditionMatched = true;

                break;
            } else {
                conditionMatched = false;
            }
        }
    }

    return conditionMatched;
};

/**
 * Handles all relations in the document.
 * @param {string} prefId preference id
 * @returns {void}
 */
const handlerRelations = (prefId) => {
    alertHandler.fadeAlerts();

    const relations = JSON.parse(doc.querySelector('[data-relations]').getAttribute('data-relations'));

    relations
        .filter((relation) => {
            if (prefId) {
                return relation.id === prefId;
            }

            return relation;
        })
        .forEach((relation) => {
            const conditionMatched = handlerConditions(relation.conditions);
            const arrayOfOldValue = [].concat(relation.oldValue);
            const arrayOfNewValue = [].concat(relation.newValue);

            if (conditionMatched && arrayOfOldValue.includes(getValueByAttr(relation.id)) && arrayOfNewValue.includes(getValueByName(relation.id))) {
                handlerTriggers(relation.triggers);

                if (prefId) {
                    const prefFieldEl = doc.querySelector(`.js-dw-select[name="${prefId}"]`);

                    prefFieldEl.dataset.oldValue = prefFieldEl.value;
                }
            }
        });
};

/**
 * Data handler before form submission
 * @param {Object} event - ClickEvent
 */
const handlerBeforeSubmit = (event) => {
    const target = event.target;
    const site = target.form.querySelector('[name="site"]');

    site.value = target.name === 'apply-to-sites' ? 'multiple' : 'single';

    handlerRelations();
};

module.exports = {
    handlerRelations,
    handlerBeforeSubmit,
    handlerConditions,
    handleOldValueAttrChange
};
