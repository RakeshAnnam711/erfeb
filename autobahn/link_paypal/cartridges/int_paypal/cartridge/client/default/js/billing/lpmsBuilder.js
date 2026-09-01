'use strict';

module.exports = {
    /**
     * Initiates LPMs buttons on billing page
     * @param {NodeList} lpmBtnEls A list of Lpms buttons based on payment methods
     */
    initLpms: lpmBtnEls => {
        Array.from(lpmBtnEls).forEach(btn => {
            const PayPalBase = require('../models/buttons/payPalBase');
            const fundingSource = btn.getAttribute('data-lpm-id');
            const payPalBaseInstance = new PayPalBase(`.js-${fundingSource}-btn`);

            payPalBaseInstance.initPayPalButton(fundingSource);

            if (payPalBaseInstance.isBtnEligible) {
                payPalBaseInstance.renderPaymentFields();
            } else {
                // Hides LPM tab on billing page
                document.querySelector(`.js-nav-item-${fundingSource}`).classList.add('d-none');
            }
        });
    }
};
