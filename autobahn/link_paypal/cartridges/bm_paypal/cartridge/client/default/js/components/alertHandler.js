'use strict';

class AlertHandlerModel {
    constructor() {
        this.alertsContainerEl = document.querySelector('.js-flash-messages-container');
    }

    /**
     * Appends Alerts message
     * Available alerts types:
     * primary, secondary, success, danger, warning, info, alert, dark
     * @param {Object} alert Alerts and type messages
     */
    showAlertMessage(alert) {
        const alertTemplateEl = document.querySelector('.js-alert-template');
        const alertContainerEl = alertTemplateEl.cloneNode(true);

        alertContainerEl.insertAdjacentHTML('beforeend', alert.message);
        this.alertsContainerEl.append(alertContainerEl);

        alertContainerEl.classList.add(`alert-${alert.type}`, 'show');
        alertContainerEl.classList.remove('d-none');
    }

    /**
     * Fades Alerts message
     */
    fadeAlerts() {
        const alertContainerEls = document.querySelectorAll('.js-alert-template');

        alertContainerEls.forEach((alert) => alert.classList.add('d-none'));
    }

    /**
     * Closes an alert message
     */
    closeAlert() {
        this.alertsContainerEl.addEventListener('click', (e) => {
            if (e.target.parentElement.type === 'button') {
                const closeBtn = e.target.parentElement;

                closeBtn.parentElement.classList.remove('show');
                closeBtn.parentElement.classList.add('hide');

                setTimeout(() => {
                    closeBtn.parentElement.classList.add('d-none');
                    closeBtn.parentElement.remove();
                }, 1000);
            }
        });
    }
}

module.exports = AlertHandlerModel;
