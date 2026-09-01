'use strict';

const Modal = require('../components/modal');
const paypalAdmin = require('../transactions/paypalAdmin');

/**
 * Dispute Details
 * @class
 */
class Dispute {
    /**
     * @constructor
     * @param {string} id - Dispute ID
     */
    constructor(id) {
        this.id = id;
        this.loader = new Ext.LoadMask(Ext.getBody(), {
            msg: window.paypalAdminConfig.resources.pleaseWait
        });
    }

    /**
     * Render modal window
     * @param {string} html - HTML markup
     */
    render(html) {
        this.modal = new Modal({
            title: `Dispute: ${this.id}`,
            width: 780,
            height: 200,
            html: html,
            modal: true,
            autoScroll: true,
            cls: 'paypalbm_window_content',
            listeners: {
                show: () => {
                    this.updateDispute();
                    paypalAdmin.init();
                    paypalAdmin.accordion();
                }
            }
        });

        this.loader.hide();
        this.modal.show();

        this.modal.center();

        window.addEventListener('resize', () => {
            this.modal.center();
        });

        window.addEventListener('orientationchange', () => {
            this.modal.center();
        });
    }

    /**
     * Updates dispute stats in Pie Chart
     * @returns {void}
     */
    updateDispute() {
        const element = document.querySelector('.js-dispute-for-update');

        if (!element) {
            return;
        }

        const disputeData = JSON.parse(element.dataset.dispute);

        if (!Object.keys(disputeData).length) {
            return;
        }

        const pieChartEl = document.querySelector('.js-dispute-pie-chart');

        if ('status' in disputeData && pieChartEl) {
            pieChartEl.setAttribute('data-stats', element.dataset.stats);
        }

        const dispute = document.querySelector(`tr[data-dispute-id="${element.dataset.disputeId}"]`);

        Object.keys(disputeData).forEach(name => {
            dispute.querySelector(`.dispute-${name}`).textContent = disputeData[name];
        });
    }

    /**
     * Show error message
     * @static
     * @param {string} msg - Message
     */
    static showErrorMessage(msg) {
        Ext.Msg.show({
            msg: msg,
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.ERROR,
            title: window.paypalAdminConfig.resources.errorMsgTitle
        });
    }
}

module.exports = Dispute;
