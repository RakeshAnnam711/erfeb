'use strict';

class ProgressBar {
    constructor(modal, selector) {
        this.modal = modal;
        this.progressBar = document.querySelector(selector);

        this.IS_ACTIVE = 'is-active';
        this.IS_DISABLED = 'is-disabled';
    }

    /**
     * Handle Progress Bar Steps
     * @param {string} stepId - progress bar step id
     * @returns {void}
     */
    handleProgressBarNextStep(stepId) {
        const currentStep = document.querySelector(`[data-step-id='${stepId}'`);
        const nextStep = currentStep.nextElementSibling;

        currentStep.classList.remove(this.IS_ACTIVE);
        currentStep.classList.add(this.IS_DISABLED);

        if (nextStep) {
            nextStep.classList.add(this.IS_ACTIVE);
        }
    }

    /**
     * Shows the progress bar
     * @returns {void}
     */
    showProgressBar() {
        this.modal.modal.body.update(this.progressBar.innerHTML);
        this.modal.modal.buttons.forEach(btn => btn.hide());

        this.modal.center();
    }
}

module.exports = ProgressBar;
