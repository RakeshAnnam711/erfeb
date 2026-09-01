'use strict';

const TEXT_SELECT_ALL = 'Select all';
const TEXT_UNSELECT_ALL = 'Unselect all';
const DW_ROW_SELECTOR = '.js-dw-row';
const DW_TBODY_SELECTOR = '.js-dw-tbody';
const DW_CHECKBOX_SELECTOR = '.js-dw-checkbox';
const DW_CHECKBOX_CLASS_NAME = 'js-dw-checkbox';
const SELECT_ALL_SELECTOR = '.js-select-all';

class ApplyToOtherSitesWizard {
    PREF_SELECTION = 'preferenceSelection';

    SITE_SELECTION = 'siteSelection';

    SUMMARY = 'summary';

    IS_DISABLED = 'is-disabled';

    IS_ACTIVE = 'is-active';

    D_NONE = 'd-none';

    INSTANCES = {
        0: 'Sandbox',
        1: 'Staging',
        2: 'Production'
    };

    constructor() {
        this.wizardEl = document.querySelector('.js-dw-wizard');
        this.btnNextEl = document.querySelector('.js-button-next');
        this.btnBackEl = document.querySelector('.js-button-back');
        this.btnApplyEl = document.querySelector('.js-button-apply');

        this.prefsNames = {};
        this.dataToSend = { prefs: {}, sites: {} };
        this.currentStage = null;
        this.currentSite = null;
        this.currentInstance = null;
    }

    /**
     * Handles click on a checkbox having it be checked/unchecked along with its siblings
     * @param {HTMLElement} checkboxEl Input
     * @param {boolean} condition Condition that triggers whether the checkbox should be checked or not
     */
    handleMultiCheckboxClick(checkboxEl, condition) {
        if (condition) {
            checkboxEl.checked = false;
            checkboxEl.click();
        } else {
            checkboxEl.checked = true;
            checkboxEl.click();
        }
    }

    /**
     * Prepares data
     * @param {HTMLElement} checkboxEl Input
     * @param {null} value If present, it means the checkbox was unchecked
     */
    prepDataToSend(checkboxEl, value) {
        const prefValue = checkboxEl.dataset.prefValue || checkboxEl.dataset.forInstance;

        if ((value === null || !checkboxEl.dataset.prefValue) && checkboxEl.dataset.prefId) {
            this.dataToSend.prefs[checkboxEl.dataset.prefId] = '';
        } else if (checkboxEl.dataset.prefId) {
            this.dataToSend.prefs[checkboxEl.dataset.prefId] = prefValue;
        }

        if (checkboxEl.closest(DW_ROW_SELECTOR)) {
            const siteId = checkboxEl.closest(DW_ROW_SELECTOR).dataset.siteId;
            const siteName = checkboxEl.closest(DW_ROW_SELECTOR).dataset.siteName;
            const siteData = this.dataToSend.sites[siteId];

            if (value === null) {
                const index = siteData.indexOf(checkboxEl.dataset.forInstance);

                siteData.splice(index, 1);
            } else if (siteData && !siteData.includes(prefValue)) {
                siteData.push(prefValue);
            } else if (!siteData) {
                const data = {};

                data[siteId] = [prefValue];
                data[siteId].siteName = siteName;

                Object.assign(this.dataToSend.sites, data);
            }
        }
    }

    handleCheckboxTextConditions(checkboxEl, selectAllBtnEl, isAnyNotCheckedStageWide) {
        if (!checkboxEl.checked && selectAllBtnEl && selectAllBtnEl.innerText === TEXT_UNSELECT_ALL) {
            selectAllBtnEl.innerText = TEXT_SELECT_ALL;
        }

        if (!isAnyNotCheckedStageWide && selectAllBtnEl && selectAllBtnEl.innerText === TEXT_SELECT_ALL) {
            selectAllBtnEl.innerText = TEXT_UNSELECT_ALL;
        }
    }

    /**
     * Handles checkbox click and how it influences other elements
     * @param {HTMLElement} checkboxEl Input
     */
    handleCheckboxChangeEvent(checkboxEl) {
        checkboxEl.addEventListener('change', () => {
            const parentEl = checkboxEl.closest('[data-wizard-stage]');
            const nextStageEl = parentEl.nextElementSibling;
            const stageAfterNextEl = nextStageEl.nextElementSibling;
            const nextProgressItemEl = this.wizardEl.querySelector(`[data-progress-id="${nextStageEl.dataset.wizardStage}"]`);
            const selectAllBtnEl = parentEl.querySelector(SELECT_ALL_SELECTOR);

            let checkAllBtnEl = parentEl.querySelector('.js-dw-check-all');
            let afterNextProgressItemEl;

            const isAnyCheckedInNextStage = nextStageEl.querySelector('.js-dw-checkbox:checked');
            const isAnyNotCheckedStageWide = parentEl.querySelector('.js-dw-checkbox:not(:checked)');
            const isAnyCheckedStageWide = parentEl.querySelector('.js-dw-checkbox:checked');

            let isAnyNotChecked = parentEl.querySelector('.js-dw-checkbox:not(:checked):not(.js-attr-selection-row.d-none .js-dw-checkbox)');

            if (checkboxEl.dataset.forInstance) {
                checkAllBtnEl = parentEl.querySelector(`.js-dw-check-all[data-for-instance="${checkboxEl.dataset.forInstance}"]`);
                isAnyNotChecked = parentEl.querySelector(`.js-dw-checkbox[data-for-instance="${checkboxEl.dataset.forInstance}"]:not(:checked)`);
            }

            if (stageAfterNextEl) {
                afterNextProgressItemEl = this.wizardEl.querySelector(`[data-progress-id="${stageAfterNextEl.dataset.wizardStage}"]`);
            }

            if (checkboxEl.checked) {
                nextProgressItemEl.classList.remove(this.IS_DISABLED);
                this.btnNextEl.disabled = false;

                this.prepDataToSend(checkboxEl);
            } else if (!checkboxEl.checked && !isAnyCheckedStageWide) {
                nextProgressItemEl.classList.add(this.IS_DISABLED);
                this.btnNextEl.disabled = true;
            }

            if (!checkboxEl.checked && !isAnyCheckedStageWide && stageAfterNextEl) {
                afterNextProgressItemEl.classList.add(this.IS_DISABLED);
            } else if (checkboxEl.checked && isAnyCheckedInNextStage && stageAfterNextEl) {
                afterNextProgressItemEl.classList.remove(this.IS_DISABLED);
            }

            if (checkboxEl.checked && !isAnyNotChecked && !checkAllBtnEl.checked) {
                checkAllBtnEl.checked = true;
            }

            if (!checkboxEl.checked) {
                this.prepDataToSend(checkboxEl, null);
            }

            if (!checkboxEl.checked && checkAllBtnEl.checked) {
                checkAllBtnEl.checked = false;
            }

            this.handleCheckboxTextConditions(checkboxEl, selectAllBtnEl, isAnyNotCheckedStageWide);
        });
    }

    /**
     * Handles click on checkbox which should select all other checkboxes
     * @param {HTMLElement} checkboxEl Input
     */
    handleApplyToAllCheckboxChangeEvent(checkboxEl) {
        checkboxEl.addEventListener('change', () => {
            const parentEl = checkboxEl.closest('[data-wizard-stage]');

            let checkboxEls = parentEl.querySelectorAll(DW_CHECKBOX_SELECTOR);

            if (checkboxEl.dataset.forInstance) {
                checkboxEls = parentEl.querySelectorAll(`.js-dw-checkbox[data-for-instance="${checkboxEl.dataset.forInstance}"]`);
            }

            checkboxEls.forEach((inputEl) => this.handleMultiCheckboxClick(inputEl, checkboxEl.checked));
        });
    }

    /**
     * Hides checkbox for the currently chosen site and instance
     */
    hideCurrentSiteAndInstanceCheckbox() {
        const stageSiteSelectionEl = this.wizardEl.querySelector(`#${this.SITE_SELECTION}`);
        const checkboxEls = stageSiteSelectionEl.querySelectorAll(DW_CHECKBOX_SELECTOR);

        checkboxEls.forEach((checkboxEl) => {
            if (checkboxEl.dataset.forInstance === this.currentInstance
                && checkboxEl.dataset.forSite === this.currentSite) {
                checkboxEl.classList.add(this.D_NONE);
                checkboxEl.classList.remove(DW_CHECKBOX_CLASS_NAME);
            }
        });
    }

    /**
     * Initializes the popup by generating rows with preferences and its values,
     * Calls methods related to checkboxes
     * @param {string} formId Form ID
     */
    initialize(formId) {
        const formEl = document.getElementById(formId);
        const instanceTypeEl = document.querySelector(`.js-instance-type[data-group-id=${formId}]`);

        this.currentInstance = instanceTypeEl.value;
        this.currentSite = instanceTypeEl.dataset.siteId;
        this.btnApplyEl.setAttribute('form', formId);

        formEl.querySelectorAll('.js-dw-attr-row .js-dw-attr-label').forEach((label) => {
            this.prefsNames[label.dataset.attrId] = label.innerText;
        });

        formEl.querySelectorAll('[data-old-value]').forEach((fieldEl) => {
            const rowEl = this.wizardEl.querySelector('.js-attr-selection-row').cloneNode(true);
            const fieldValue = fieldEl.dataset.oldValue;

            let value;

            if (fieldValue === 'true') {
                value = 'Yes';
            } else if (fieldValue === 'false') {
                value = 'No';
            } else if (fieldEl.dataset.valueTypeCode === '13') {
                value = fieldValue.replace(/./g, '*');

                rowEl.querySelector(DW_CHECKBOX_SELECTOR).classList.add(this.D_NONE);
                rowEl.querySelector(DW_CHECKBOX_SELECTOR).classList.remove(DW_CHECKBOX_CLASS_NAME);
            } else if (fieldEl.dataset.valueTypeCode === '31') {
                value = fieldEl.children[fieldEl.selectedIndex].dataset.displayValue;
            } else if (fieldEl.dataset.valueTypeCode === '33') {
                value = fieldValue.replaceAll(',', ', ');
            } else {
                value = `${fieldValue.charAt(0).toUpperCase()}${fieldValue.slice(1)}`;
            }

            rowEl.children[0].firstElementChild.dataset.prefId = fieldEl.name;
            rowEl.children[0].firstElementChild.dataset.prefValue = fieldValue;

            rowEl.children[1].firstElementChild.append(this.prefsNames[fieldEl.name]);
            rowEl.children[2].firstElementChild.append(value);

            rowEl.classList.remove(this.D_NONE);

            this.wizardEl.querySelector(DW_TBODY_SELECTOR).append(rowEl);
            this.currentStage = this.PREF_SELECTION;
        });

        this.wizardEl.classList.remove(this.D_NONE);
        this.hideCurrentSiteAndInstanceCheckbox();

        this.wizardEl.querySelectorAll('.js-dw-check-all').forEach((checkboxEl) => this.handleApplyToAllCheckboxChangeEvent(checkboxEl));
        this.wizardEl.querySelectorAll(DW_CHECKBOX_SELECTOR).forEach((checkboxEl) => this.handleCheckboxChangeEvent(checkboxEl));
    }

    /**
     * Creates a row with preference data for summary stage
     * @param {string} prefId Preference ID
     */
    createSummaryPrefRow(prefId) {
        const templateEl = this.wizardEl.querySelector('.js-summary-pref-row');
        const rowPrefEl = templateEl.cloneNode(true);

        rowPrefEl.children[0].firstElementChild.append(this.prefsNames[prefId]);
        rowPrefEl.children[1].firstElementChild.append(this.dataToSend.prefs[prefId]);

        rowPrefEl.dataset.prefId = prefId;
        rowPrefEl.classList.remove(this.D_NONE);

        templateEl.closest(DW_TBODY_SELECTOR).append(rowPrefEl);
    }

    /**
     * Creates a row with site data for summary stage
     * @param {string} siteId Site ID
     * @param {string} instanceCode Instance code
     */
    createSummarySiteRow(siteId, instanceCode) {
        const templateEl = this.wizardEl.querySelector('.js-summary-site-row');
        const rowSiteEl = templateEl.cloneNode(true);

        rowSiteEl.children[0].firstElementChild.append(`${this.dataToSend.sites[siteId].siteName} (${this.INSTANCES[instanceCode]})`);

        rowSiteEl.dataset.siteId = siteId;
        rowSiteEl.dataset.siteInstance = instanceCode;
        rowSiteEl.classList.remove(this.D_NONE);

        templateEl.closest(DW_TBODY_SELECTOR).append(rowSiteEl);
    }

    /**
     * Prepares rows for stage summary
     */
    prepStageSummary() {
        Object.keys(this.dataToSend.prefs).forEach((key) => this.createSummaryPrefRow(key));

        Object.keys(this.dataToSend.sites).forEach((key) => {
            this.dataToSend.sites[key].forEach((value) => this.createSummarySiteRow(key, value));
        });
    }

    /**
     * Updates rows for stage summary in case if user goes to previous stages to correct data
     */
    updateStageSummary() {
        const prefRowEls = this.wizardEl.querySelectorAll('.js-summary-pref-row:not(.d-none)');
        const siteRowEls = this.wizardEl.querySelectorAll('.js-summary-site-row:not(.d-none)');

        const prefsInWizard = Array.from(prefRowEls).map((rowEl) => rowEl.dataset.prefId);
        const sitesInWizard = Array.from(siteRowEls).map((rowEl) => [rowEl.dataset.siteId, rowEl.dataset.siteInstance]);
        const savedPrefs = Object.keys(this.dataToSend.prefs);
        const savedSites = Object.keys(this.dataToSend.sites);

        Array.from(prefRowEls)
            .filter((rowEl) => !savedPrefs.includes(rowEl.dataset.prefId))
            .forEach((rowEl) => rowEl.remove());

        Array.from(siteRowEls)
            .filter((rowEl) => !this.dataToSend.sites[rowEl.dataset.siteId].includes(rowEl.dataset.siteInstance))
            .forEach((rowEl) => rowEl.remove());

        savedPrefs
            .filter((prefId) => !prefsInWizard.includes(prefId))
            .forEach((prefId) => this.createSummaryPrefRow(prefId));

        savedSites.forEach((siteId) => {
            const instancesInWizard = [];

            sitesInWizard
                .filter((pair) => pair[0] === siteId)
                .forEach((pair) => instancesInWizard.push(pair[1]));

            this.dataToSend.sites[siteId].forEach((instanceCode) => {
                if (!instancesInWizard.includes(instanceCode)) {
                    this.createSummarySiteRow(siteId, instanceCode);
                }
            });
        });
    }

    /**
     * Handles stage switch when next/back buttons or progress items are clicked
     * @param {string} currentStage Current stage
     * @param {string} futureStage Future stage
     */
    handleStageSwitch(currentStage, futureStage) {
        const futureStageProgressItemEl = document.querySelector(`[data-progress-id="${futureStage}"]`);
        const currentStageProgressItemEl = document.querySelector(`[data-progress-id="${currentStage}"]`);
        const summaryStageEl = this.wizardEl.querySelector(`#${this.SUMMARY}`);

        document.getElementById(currentStage).classList.add(this.D_NONE);
        document.getElementById(futureStage).classList.remove(this.D_NONE);

        currentStageProgressItemEl.classList.remove(this.IS_ACTIVE);
        futureStageProgressItemEl.classList.add(this.IS_ACTIVE);

        if (futureStage === this.SUMMARY && !summaryStageEl.dataset.wizardStageStatus) {
            this.prepStageSummary();
            summaryStageEl.dataset.wizardStageStatus = 'generated';
        }

        if (summaryStageEl.dataset.wizardStageStatus) {
            this.updateStageSummary();
        }

        if (futureStage === this.PREF_SELECTION) {
            this.btnBackEl.disabled = true;
            this.btnNextEl.disabled = false;
        } else if (futureStage === this.SITE_SELECTION) {
            const isAnyCheckboxChecked = this.wizardEl.querySelector(`#${this.SITE_SELECTION} .js-dw-checkbox:checked`);

            if (!isAnyCheckboxChecked) {
                this.btnNextEl.disabled = true;
            }

            this.btnBackEl.disabled = false;
        } else if (futureStage === this.SUMMARY) {
            this.btnNextEl.classList.add('ng-hide');
            this.btnApplyEl.classList.remove('ng-hide');

            futureStageProgressItemEl.classList.remove(this.IS_DISABLED);
        }

        if ((futureStage === this.PREF_SELECTION || futureStage === this.SITE_SELECTION)
            && !this.btnApplyEl.classList.contains('ng-hide')) {
            this.btnApplyEl.classList.add('ng-hide');
            this.btnNextEl.classList.remove('ng-hide');
        }

        this.currentStage = futureStage;
    }

    /**
     * Moves to next stage on next button click
     */
    toNextStage() {
        if (this.currentStage === this.PREF_SELECTION) {
            this.handleStageSwitch(this.currentStage, this.SITE_SELECTION);
        } else if (this.currentStage === this.SITE_SELECTION) {
            this.handleStageSwitch(this.currentStage, this.SUMMARY);
        }
    }

    /**
     * Moves to previous stage on back button click
     */
    toPrevStage() {
        if (this.currentStage === this.SITE_SELECTION) {
            this.handleStageSwitch(this.currentStage, this.PREF_SELECTION);
        } else if (this.currentStage === this.SUMMARY) {
            this.handleStageSwitch(this.currentStage, this.SITE_SELECTION);
        }
    }

    /**
     * Shows corresponding stage based on which progress item was clicked
     * @param {HTMLElement} itemEl Progress item
     */
    handleProgressBarClick(itemEl) {
        const progressBarContainerEl = document.querySelector('.js-progress-bar');
        const selectedEl = progressBarContainerEl.querySelector('.is-active');

        const currentStage = selectedEl.dataset.progressId;
        const futureStage = itemEl.dataset.progressId;

        this.handleStageSwitch(currentStage, futureStage);
    }

    /**
     * Restores next/back/apply buttons classes to their initial state
     */
    restoreButtonClasses() {
        if (this.btnNextEl.classList.contains('ng-hide')) {
            this.btnNextEl.classList.remove('ng-hide');
        }

        if (!this.btnNextEl.disabled) {
            this.btnNextEl.disabled = true;
        }

        if (!this.btnBackEl.disabled) {
            this.btnBackEl.disabled = true;
        }

        if (!this.btnApplyEl.classList.contains('ng-hide')) {
            this.btnApplyEl.classList.add('ng-hide');
        }
    }

    /**
     * Restores progress items classes to their initial state
     */
    restoreProgressBarClasses() {
        const progressPrefSelectionEl = document.querySelector(`[data-progress-id="${this.PREF_SELECTION}"]`);
        const progressSiteSelectionEl = document.querySelector(`[data-progress-id="${this.SITE_SELECTION}"]`);
        const progressSummaryEl = document.querySelector(`[data-progress-id="${this.SUMMARY}"]`);

        if (!progressPrefSelectionEl.classList.contains(this.IS_ACTIVE)) {
            progressPrefSelectionEl.classList.add(this.IS_ACTIVE);
        }

        if (progressSiteSelectionEl.classList.contains(this.IS_ACTIVE)) {
            progressSiteSelectionEl.classList.remove(this.IS_ACTIVE);
        }

        if (!progressSiteSelectionEl.classList.contains(this.IS_DISABLED)) {
            progressSiteSelectionEl.classList.add(this.IS_DISABLED);
        }

        if (progressSummaryEl.classList.contains(this.IS_ACTIVE)) {
            progressSummaryEl.classList.remove(this.IS_ACTIVE);
        }

        if (!progressSummaryEl.classList.contains(this.IS_DISABLED)) {
            progressSummaryEl.classList.add(this.IS_DISABLED);
        }
    }

    /**
     * Restores stages to there initial state
     */
    restoreStages() {
        const stagePrefSelectionEl = document.getElementById(this.PREF_SELECTION);
        const stageSiteSelectionEl = document.getElementById(this.SITE_SELECTION);
        const stageSummaryEl = document.getElementById(this.SUMMARY);

        if (stagePrefSelectionEl.classList.contains(this.D_NONE)) {
            stagePrefSelectionEl.classList.remove(this.D_NONE);
        }

        if (!stageSiteSelectionEl.classList.contains(this.D_NONE)) {
            stageSiteSelectionEl.classList.add(this.D_NONE);
        }

        if (!stageSummaryEl.classList.contains(this.D_NONE)) {
            stageSummaryEl.classList.add(this.D_NONE);
        }
    }

    /**
     * Cleans stage summary of its rows with data
     */
    cleanStageSummary() {
        const summaryStageEl = this.wizardEl.querySelector(`#${this.SUMMARY}`);
        const summaryStageDataEl = summaryStageEl.querySelectorAll('.js-summary-pref-row:not(.d-none), .js-summary-site-row:not(.d-none)');

        summaryStageDataEl.forEach((rowEl) => rowEl.remove());
        summaryStageEl.removeAttribute('data-wizard-stage-status');
    }

    /**
     * Shows hidden checkbox responsible for current site and instance
     */
    showCurrentSiteAndInstanceCheckbox() {
        const stageSiteSelectionEl = this.wizardEl.querySelector(`#${this.SITE_SELECTION}`);
        const checkboxEl = stageSiteSelectionEl.querySelector('.d-none[data-for-instance]');

        checkboxEl.classList.remove(this.D_NONE);
        checkboxEl.classList.add(DW_CHECKBOX_CLASS_NAME);
    }

    /**
     * Closes popup on close button
     */
    close() {
        this.wizardEl.classList.add(this.D_NONE);

        this.wizardEl.querySelectorAll('.js-attr-selection-row:not(.d-none)').forEach((elem) => elem.remove());

        this.wizardEl.querySelectorAll('.js-dw-check-all:checked, .js-dw-checkbox:checked').forEach((checkboxEl) => {
            checkboxEl.checked = false;
        });

        this.wizardEl.querySelector(SELECT_ALL_SELECTOR).innerText = TEXT_SELECT_ALL;

        this.restoreButtonClasses();
        this.restoreProgressBarClasses();
        this.restoreStages();
        this.cleanStageSummary();
        this.showCurrentSiteAndInstanceCheckbox();

        this.dataToSend = { prefs: {}, sites: {} };
    }

    /**
     * Check checkboxes for all instances and sites
     */
    selectAllSites() {
        const buttonEl = this.wizardEl.querySelector(SELECT_ALL_SELECTOR);
        const checkboxEls = this.wizardEl.querySelectorAll(`#${this.SITE_SELECTION} .js-dw-check-all`);

        if (buttonEl.innerText === TEXT_SELECT_ALL) {
            buttonEl.innerText = TEXT_UNSELECT_ALL;
        } else {
            buttonEl.innerText = TEXT_SELECT_ALL;
        }

        checkboxEls.forEach((checkboxEl) => this.handleMultiCheckboxClick(checkboxEl, buttonEl.innerText !== TEXT_SELECT_ALL));
    }

    /**
     * Calls savePreferencesHandler method with given data
     * @param {Object} event Event
     * @param {Function} callback savePreferencesHandler method
     */
    apply(event, callback) {
        Object.keys(this.dataToSend.sites)
            .filter((siteId) => this.dataToSend.sites[siteId].length !== 0)
            .forEach((siteId) => {
                this.dataToSend.sites[siteId].forEach((instance) => callback(event, {
                    prefs: this.dataToSend.prefs,
                    siteId: siteId,
                    instance: this.INSTANCES[instance].toLowerCase()
                }));
            });

        this.close();
    }

    /**
     * Shows popup/alert on Apply to other sites button click
     * @param {string} formId Form ID
     */
    show(formId) {
        const formEl = document.getElementById(formId);
        const formFieldEls = formEl.querySelectorAll('[data-old-value]');
        const unsavedFieldEl = Array.from(formFieldEls).some((fieldEl) => {
            if (fieldEl.dataset.oldValue.includes('.0') && !fieldEl.value.includes('.0')) {
                return fieldEl.dataset.oldValue.replace('.0', '') !== fieldEl.value;
            }

            return fieldEl.dataset.oldValue !== fieldEl.value;
        });

        if (unsavedFieldEl) {
            this.showAlert(formId);
        } else {
            this.initialize(formId);
        }
    }

    /**
     * Shows alert if the form contains unsaved data
     * @param {string} formId Form ID
     */
    showAlert(formId) {
        const wizardAlertEl = document.querySelector('.js-wizard-alert');
        const okBtnEl = wizardAlertEl.querySelector('.js-wizard-alert-ok');
        const cancelBtnEl = wizardAlertEl.querySelector('.js-wizard-alert-cancel');

        wizardAlertEl.classList.remove(this.D_NONE);
        okBtnEl.setAttribute('form', formId);
        cancelBtnEl.addEventListener('click', () => wizardAlertEl.classList.add(this.D_NONE));
    }

    /**
     * Resets unsaved form data and initializes the wizard popup
     * @param {string} formId Form ID
     */
    proceedToWizard(formId) {
        const wizardAlertEl = document.querySelector('.js-wizard-alert');

        wizardAlertEl.classList.add(this.D_NONE);
        this.initialize(formId);
    }
}

module.exports = ApplyToOtherSitesWizard;
