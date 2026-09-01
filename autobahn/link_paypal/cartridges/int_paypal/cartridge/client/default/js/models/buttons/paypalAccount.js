'use strict';

const api = require('../../helpers/api');
const helper = require('../../helpers/helper');
const loaderInstance = require('../../components/loader');

const addNewAccountBtn = document.querySelector('.add-paypal-account');
const paypalAccountLimit = addNewAccountBtn && parseInt(addNewAccountBtn.getAttribute('data-paypal-account-limit'));
const loaderContainerEl = document.querySelector('.paypalLoader');
const paypalButtonContainer = document.querySelector('.save-paypal-account-buttons');
const limitMsgBlock = document.querySelector('.limit-msg');

/**
 * Initiates Save PayPal button
 */
class PayPalAccountModel {
    constructor(selector) {
        const AlertHandlerModel = require('../alertHandler');

        this.selector = selector;
        this.payPalInstance = null;
        this.loader = loaderInstance(loaderContainerEl);
        this.alertHandler = new AlertHandlerModel();
        this.payPalButton = document.querySelector(this.selector);
    }

    /**
     * Hide or show limit message and PayPal button after adding removing PayPal account
     */
    limitMsgHandler() {
        // No need to hide/show limit message if vault mode is not enabled
        if (!paypalAccountLimit) {
            return;
        }

        const savedPayPalAccountCount = document.querySelectorAll('.saved-paypal-account-item').length;

        if (paypalAccountLimit === -1 || paypalAccountLimit > savedPayPalAccountCount){
            limitMsgBlock.classList.add('d-none');
            paypalButtonContainer?.classList.remove('d-none');
        } else {
            limitMsgBlock.classList.remove('d-none');
            paypalButtonContainer?.classList.add('d-none');
        }
    }

    /**
     * Shows the add new card button on the Account Page
     * @returns {void}
     */
    showAddNewCardButton() {
        const addNewCardContainer = document.querySelector('.add-paypal-account');

        addNewCardContainer?.classList.remove('d-none');
    }

    /**
     * Add PayPal accounts html template to the DOM
     * @param {string} accountListTemplate html template with PayPal account list
     */
    addPayPalAccountsToTheTemplate(accountListTemplate) {
        const payPalAccountsContainer = document.querySelector('.js-saved-paypal-account-group');

        // when removing last saved PayPal account without the ability to add a new
        if (accountListTemplate.trim().length === 0 && !addNewAccountBtn) {
            payPalAccountsContainer.parentElement.remove();

            return;
        }

        payPalAccountsContainer.innerHTML = accountListTemplate;
    }

    /**
     * Hide PayPal account button
     */
    hidePaypalAccountBtn() {
        const paypalAccountButton = document.querySelector('.paypal-account-button');

        paypalAccountButton?.classList.add('d-none');
    }

    /**
     * Init PayPal button after adding new account
     */
    initPayPalButtonAfterAddAccount() {
        const paypalAccountBtn = document.querySelector('.paypal-account-button');

        addNewAccountBtn?.addEventListener('click', function() {
            this.classList.add('d-none');
            paypalAccountBtn.classList.remove('d-none');
        });
    }

    /**
     * Get PayPal accounts list from the server
     * @param {string} fetchUrl url to fetch the PayPal accounts list
     */
    getPayPalAccountsList(fetchUrl) {
        fetch(helper.getUrlWithCsrfToken(fetchUrl))
            .then((template) => template.text())
            .then((templateHtml) => {
                this.hidePaypalAccountBtn();
                this.addPayPalAccountsToTheTemplate(templateHtml);
                this.initPayPalButtonAfterAddAccount();
                this.showAddNewCardButton();
                this.limitMsgHandler();
            });
    }

    /**
     * Creates vault setup token
     * @returns {string} setupToken
     */
    async createVaultSetupToken() {
        const result = await api.createSetupToken();

        return result.setupToken;
    }

    /**
     * Makes call to create payment token and save paypal account
     */
    async onApprove() {
        const result = await api.addPaypalAccount();

        if (result.error) {
            this.alertHandler.showError(result.message);

            return;
        }

        this.getPayPalAccountsList(window.paypalUrls.renderPayPalAccountsUrl);
    }

    /**
     * Hides loader on paypal widget closing without errors
     */
    onCancel() {
        this.loader.hide();
    }

    /**
     * Shows errors if paypal widget was closed with errors
     */
    onError() {
        this.loader.hide();
    }

    /**
     * Hides loader on paypal widget and re-initiates the PP button
     */
    onClose() {
        this.loader.hide();

        if (document.querySelector(this.selector)) {
            this.initPayPalButton();
        }
    }

    /**
     * Inits save Paypal button
     */
    initPayPalButton() {
        const that = this;

        that.loader.show();

        that.payPalInstance = window.paypal.Buttons({
            createVaultSetupToken: that.createVaultSetupToken.bind(that),
            onApprove: that.onApprove.bind(that),
            onCancel: that.onCancel.bind(that),
            onError: that.onError.bind(that),
            onClose: that.onClose.bind(that),
            style: helper.getPaypalButtonStyle(that.payPalButton)
        });

        this.payPalInstance.render(this.selector)
            .then(() => {
                that.loader.hide();
            });
    }
}

module.exports = PayPalAccountModel;
