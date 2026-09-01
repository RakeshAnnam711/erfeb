'use strict';

const helper = require('../../helpers/helper');

/**
 * PayPal CreditCardBase model
 */
class CreditCardBase {
    constructor() {
        this.saveCreditCardAccountContainerEl = document.getElementById('saveCreditCardAccountContainer');
        this.saveCreditCardAccountEl = document.getElementById('saveCreditCardAccount');
        this.paypalCreditCardListEl = document.getElementById('paypalCreditCardList');
    }

    /**
     * Process the save checkbox behavior on the billing page
     */
    processSaveCheckbox() {
        this.saveCreditCardAccountEl.addEventListener('change', e => {
            document.getElementById('credit-card-saveAccount').value = e.target.checked;
        });
    }

    /**
     * Process the credit card account list on the billing page
     */
    processCcAccountList() {
        const initialSelectedOption = this.paypalCreditCardListEl.options[this.paypalCreditCardListEl.selectedIndex];

        if (initialSelectedOption.id !== 'new-card-account') {
            this.hideCardFields();

            helper.selectBillingAddress(initialSelectedOption);
        }

        this.paypalCreditCardListEl.addEventListener('change', e => {
            const selectedOptionEl = e.target.selectedOptions[0];

            if (selectedOptionEl.id === 'new-card-account') {
                this.showCardFields();
            } else {
                this.hideCardFields();

                helper.selectBillingAddress(selectedOptionEl);
            }
        });
    }

    /**
     * Process the billing address list on the billing page
     */
    processBilligAddressList() {
        const that = this;
        const checkoutStageEl = document.querySelector('.data-checkout-stage');
        const handleStageChange = () => {
            const currentStage = checkoutStageEl.getAttribute('data-checkout-stage');

            if (currentStage === 'payment') {
                helper.selectBillingAddress(that.paypalCreditCardListEl.selectedOptions[0]);
            }
        };

        const observer = new MutationObserver(handleStageChange);

        observer.observe(checkoutStageEl, { attributes: true });

        // Handles the case when the billing page was loaded directly on the payment stage
        handleStageChange();
    }
}

module.exports = CreditCardBase;
