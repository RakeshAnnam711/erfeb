'use strict';

/**
 * Alert Handling model
 */
class AlertHandlerModel {
    constructor() {
        this.flashMessagesContainerEl = document.querySelector('.js-flash-messages-container');
        this.alertTemplateEl = document.querySelector('.js-alert-template');
    }

    /**
     * Creates an alert message
     * @param {string} alertMessage alert message
     * @param {string} alertType alert type, i.e. danger, info, warning etc
     */
    createAlertMessage(alertMessage, alertType) {
        const alertContainerEl = this.alertTemplateEl.cloneNode(true);

        alertContainerEl.classList.add(`alert-${alertType}`, 'show');
        alertContainerEl.classList.remove('d-none');

        alertContainerEl.append(alertMessage);
        this.flashMessagesContainerEl.append(alertContainerEl);
    }

    /**
     * Shows an error message
     * @param {string} errorMessage error message
     */
    showError(errorMessage) {
        this.createAlertMessage(errorMessage, window.paypalConstants.FLASH_MESSAGE_DANGER);
    }

    /**
     * Shows a warning message
     * @param {string} warningMessage warning message
     */
    showWarning(warningMessage) {
        this.createAlertMessage(warningMessage, window.paypalConstants.FLASH_MESSAGE_WARNING);
    }

    /**
     * Shows an info message
     * @param {string} infoMessage info message
     */
    showInfo(infoMessage) {
        this.createAlertMessage(infoMessage, window.paypalConstants.FLASH_MESSAGE_INFO);
    }

    /**
     * Shows a success message
     * @param {string} successMessage success message
     */
    showSuccess(successMessage) {
        this.createAlertMessage(successMessage, window.paypalConstants.FLASH_MESSAGE_SUCCESS);
    }

    /**
     * Hides alert messages that are created by AlertHandler model
     */
    hideAlerts() {
        const alertContainerEls = document.querySelectorAll('.js-alert-template');

        alertContainerEls.forEach((element) => element.classList.add('d-none'));
    }
}

module.exports = AlertHandlerModel;
