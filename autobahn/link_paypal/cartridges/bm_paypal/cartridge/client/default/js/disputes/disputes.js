'use strict';

/* eslint-disable no-console */

const Dispute = require('./dispute');
const PieChart = require('../components/pieChart');

((doc) => {
    /**
     * Init Pie Chart
     */
    const initPieChart = () => {
        const colors = {
            OPEN: { color: '#d46a6a' },
            WAITING_FOR_BUYER_RESPONSE: { color: '#ffa366' },
            WAITING_FOR_SELLER_RESPONSE: { color: '#ffeb85' },
            UNDER_REVIEW: { color: '#4f9fd1' },
            RESOLVED: { color: '#6ebd68' },
            OTHER: { color: '#a3a8b1' }
        };

        PieChart.init(doc.querySelector('.js-dispute-pie-chart'), colors);
    };

    /**
     * Init Dispute Details
     */
    const initDisputeDetails = () => {
        const buttons = doc.querySelectorAll('.js-dispute-details');

        buttons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();

                const url = new URL(button.href);

                url.searchParams.append('format', 'ajax');

                const dispute = new Dispute(url.searchParams.get('dispute_id'));

                dispute.loader.show();

                fetch(url.toString())
                    .then(response => response.text())
                    .then(html => {
                        dispute.render(html);
                    })
                    .catch(error => {
                        dispute.loader.hide();
                        Dispute.showErrorMessage(error.message);
                    });
            });
        });
    };

    /**
     * Handles tab switcher
     * @param {Event} e event in the Event object
     * @returns {boolean} returns false
     */
    const handleTabSwitcher = (e) => {
        const activeTabClass = 'paypalbm_active_link';

        const target = e.target;
        const targetBlockId = target.getAttribute('href');
        const switchBlockClass = '.js_paypalbm_switch_block.table-row';

        if (!target.classList.contains(activeTabClass)) {
            const activeBlock = doc.querySelector(switchBlockClass);
            const targetBlock = doc.querySelector(targetBlockId);

            doc.querySelector('.js_paypalbm_switch.paypalbm_active_link').classList.remove(activeTabClass);
            target.classList.add(activeTabClass);

            activeBlock.classList.remove('table-row');
            activeBlock.classList.add('none');

            targetBlock.classList.remove('none');
            targetBlock.classList.add('table-row');
        }

        return false;
    };

    /**
     * Init Tab Switcher
     */
    const initTabSwitcher = () => {
        const isDisputePage = !!doc.querySelector('.js_paypal_disputes_page');

        if (!isDisputePage){
            return;
        }

        const activeTab = doc.querySelector('.js_paypalbm_switch.paypalbm_active_link');

        if (!activeTab) {
            return;
        }

        doc.querySelectorAll('.js_paypalbm_switch').forEach((element) => {
            element.addEventListener('click', (event) => {
                handleTabSwitcher(event);
            });
        });

        activeTab.dispatchEvent(new Event('click'));
    };

    doc.addEventListener('DOMContentLoaded', () => {
        initPieChart();
        initDisputeDetails();
        initTabSwitcher();
    });
})(document);
