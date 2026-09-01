'use strict';

/**
 * Toggles the disabled state of datepicker elements based on the selected tab.
 *
 * @param {Object} options - The configuration object.
 * @param {string} options.generalTabSelector - The CSS selector for the tabs.
 * @param {string} options.datepickerSelector - The CSS selector for the datepicker elements.
 * @param {string} options.dateShortcutSelector - he CSS selector for the date shortcut tab elements.
 * @param {string[]} options.tabTargets - The data target values that, when matched, disables the datepicker elements.
 */
function toggleDatepickerState({ generalTabSelector, datepickerSelector, dateShortcutSelector,  tabTargets }) {
    const tabs = document.querySelectorAll(generalTabSelector);
    const datePickers = document.querySelectorAll(datepickerSelector);
    const dateShortcuts = document.querySelectorAll(dateShortcutSelector);

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            if (!tabTargets.includes(tab.dataset.target) && tab.classList.contains('active')) {
                return;
            }

            datePickers.forEach(element => {
                element.disabled = tabTargets.includes(tab.dataset.target);
            });

            dateShortcuts.forEach(element => {
                element.disabled = tabTargets.includes(tab.dataset.target);
            });
        });
    });
}

module.exports = {
    toggleDatepickerState
};
