'use strict';

const Loader = require('../../components/loader');
const AlertHandler = require('../../models/alertHandler');

const clientSideValidation = require('base/components/clientSideValidation');
const helper = require('../../helpers/helper');
const ThreeDSecure = require('../../components/ThreeDSecure');

/**
 * PayPal CreditCardAccount model
 */
class CreditCardAccount {
    constructor() {
        this.addNewCardFormEl = document.querySelector('.js-paypal-add-credit-card-form');

        if (this.addNewCardFormEl) {
            this.addNewCardButtonEl = document.querySelector('.js-paypal-add-new-card-btn');
            this.addNewCardContainerEl = document.querySelector('.js-paypal-add-new-card-container');
            this.cardLimitMessageContainer = document.querySelector('.js-paypal-card-limit-message-container');
            this.addNewCardBlockEl = document.querySelector('.js-paypal-add-new-card-block');
            this.cancelButtonEl = document.querySelector('.js-paypal-add-new-card-cancel-btn');
            this.saveButtonEl = document.querySelector('.js-paypal-add-new-card-save-btn');
            this.loaderContainerEl = document.querySelector('.js-paypal-loader');
            this.expirationDateInputEl = document.querySelector('.js-paypal-expiration-date-input');
            this.cardNumberInputEl = document.querySelector('.js-paypal-card-number-input');
            this.cardSecurityCodeInputEl = document.querySelector('.js-paypal-cvv-input');
            this.fieldStyles = helper.tryParseJSON(this.addNewCardFormEl.getAttribute('data-fields-styles'));
            this.creditCardLimit = this.addNewCardButtonEl.getAttribute('credit-card-limit');
            this.formLoader = Loader(this.loaderContainerEl);
            this.threeDSecure = new ThreeDSecure();

            ThreeDSecure.opener();
        }

        this.alertHandler = new AlertHandler();
        this.isError = false;

        this.CSS_CLASSES = {
            D_NONE: 'd-none',
            IS_DEFAULT: 'is-default',
            FONT_WEIGHT_BOLD: 'font-weight-bold',
            BORDER_DANGER: 'border-danger'
        };
    }

    /**
     * Shows the new card block on the Account Page
     * @returns {void}
     */
    showAddNewCardOptions() {
        this.addNewCardContainerEl.classList.add(this.CSS_CLASSES.D_NONE);
        this.addNewCardBlockEl.classList.remove(this.CSS_CLASSES.D_NONE);
    }

    /**
     * Hides the new card block on the Account Page
     * @returns {void}
     */
    hideAddNewCardOptions() {
        this.addNewCardContainerEl.classList.remove(this.CSS_CLASSES.D_NONE);
        this.addNewCardBlockEl.classList.add(this.CSS_CLASSES.D_NONE);

        clientSideValidation.functions.clearForm(this.addNewCardFormEl);
    }

    /**
     * Shows the add new card button on the Account Page
     * @returns {void}
     */
    showAddNewCardButton() {
        this.addNewCardContainerEl.classList.remove(this.CSS_CLASSES.D_NONE);
        this.cardLimitMessageContainer.classList.add(this.CSS_CLASSES.D_NONE);
    }

    /**
     * Hides the add new card button on the Account Page
     * @returns {void}
     */
    hideAddNewCardButton() {
        this.addNewCardContainerEl.classList.add(this.CSS_CLASSES.D_NONE);
        this.cardLimitMessageContainer.classList.remove(this.CSS_CLASSES.D_NONE);
    }

    /**
     * Handles exceeding the maximum number of credit cards
     * @returns {void}
     */
    handleCreditCardLimit() {
        const creditCardCount = document.querySelectorAll('.card-body-pp').length;
        const creditCardLimitValue = parseInt(this.creditCardLimit);

        if (creditCardLimitValue !== -1 && creditCardLimitValue <= creditCardCount) {
            this.hideAddNewCardButton();
        } else {
            this.showAddNewCardButton();
        }
    }

    /**
     * Handles server side validation errors
     * @param {Object} error - Error object from server side
     * @returns {void}
     */
    handleError(error) {
        this.isError = true;

        Object.values(error.fieldsErrors).forEach(field => {
            const errorContainerEl = document.querySelector(`.js-paypal-${field.fieldName}-error`);
            const elementContainerEl = document.querySelector(`.js-paypal-${field.fieldName}-input`);

            errorContainerEl.innerText = field.errorMessage;
            errorContainerEl.classList.remove(this.CSS_CLASSES.D_NONE);
            elementContainerEl.classList.add(this.CSS_CLASSES.BORDER_DANGER);
            elementContainerEl.style.color = this.fieldStyles.invalidColor;
        });
    }

    /**
     * Hides all form errors
     * @returns {void}
     */
    hideErrors() {
        this.isError = false;

        const errorContainerEls = document.querySelectorAll('.js-paypal-error');
        const inputContainerEls = document.querySelectorAll('.paypal-card-fields-container');

        errorContainerEls.forEach(element => {
            element.classList.add(this.CSS_CLASSES.D_NONE);
            element.innerText = '';
        });

        inputContainerEls.forEach(element => {
            element.classList.remove(this.CSS_CLASSES.BORDER_DANGER);
            element.style.color = this.fieldStyles.color;
        });
    }

    /**
     * Send request to create setup token
     * @param {Object} data - Request data
     * @returns {Promise} - Promise
     */
    createSetupToken(data) {
        return fetch(helper.getUrlWithCsrfToken(window.paypalUrls.createSetupToken), {
            method: 'POST',
            body: data
        }).then(response => response.json());
    }

    handleAddCreditCard(encodedFormData) {
        const addCreditCardFormUrl = this.addNewCardFormEl.getAttribute('action');

        return fetch(helper.getUrlWithCsrfToken(addCreditCardFormUrl), {
            method: 'POST',
            body: encodedFormData
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    this.alertHandler.showError(data.message);
                } else {
                    fetch(data.renderAccountsUrl)
                        .then((template) => template.text())
                        .then((templateHtml) => {
                            this.addNewCardFormEl.reset();
                            this.alertHandler.hideAlerts();
                            this.hideAddNewCardOptions();

                            document.querySelector('.js-credit-card-accounts').innerHTML = templateHtml;

                            this.initRemoveCreditCardEvent();
                            this.initMakeCreditCardDefaultEvent();
                            this.handleCreditCardLimit();
                        });
                }

                this.formLoader.hide();
            });
    }

    /**
     * Handles 3D Secure verification (if required), and adds the credit card.
     * @param {Object} data - Server response with verification details.
     * @param {string} encodedFormData - Encrypted form data to submit.
     */
    verifyAndAddCreditCard(data, encodedFormData) {
        const self = this;

        if (data.verificationRequired) {
            this.threeDSecure.setOptions({
                onApprove() {
                    self.handleAddCreditCard(encodedFormData);
                },
                onCancel() {
                    self.formLoader.hide();
                    self.alertHandler.showError(data.cancelMessage);
                },
                onClose(eventData) {
                    if (!eventData) {
                        self.formLoader.hide();
                        self.alertHandler.showError(data.closeMessage);
                    }
                }
            }).open(data.approveUrl);
        } else {
            this.handleAddCreditCard(encodedFormData);
        }
    }

    /**
     * This function handles the saving of a credit card
     * @param {Event} event - The event parameter for triggered action
     * @returns {void}
     */
    handleSaveCreditCardButton(event) {
        const self = this;
        const formData = new FormData(self.addNewCardFormEl);
        const encodedFormData = btoa(JSON.stringify(Object.fromEntries(formData)));

        self.hideErrors();

        const isValidForm = helper.validateForm(self.addNewCardFormEl);

        if (isValidForm.isValid) {
            self.formLoader.show();

            self.createSetupToken(encodedFormData)
                .then((data) => {
                    if (data.error) {
                        if (data.fieldsErrors) {
                            self.handleError(data);
                        } else {
                            self.alertHandler.showError(data.message);
                        }

                        self.formLoader.hide();

                        return;
                    }

                    self.verifyAndAddCreditCard(data, encodedFormData);
                })
                .catch((error) => {
                    self.formLoader.hide();
                    self.alertHandler.showError(error.message);
                });

            event.preventDefault();
            event.stopPropagation();
        } else {
            isValidForm.invalidFields.forEach((element) => {
                element.style.color = self.fieldStyles.invalidColor;
            });
        }
    }

    /**
     * This function handles the removing of a credit card
     * @param {Event} event - The event parameter for triggered action
     * @returns {void}
     */
    handleRemoveCreditCardButton(event) {
        const target = event.target;
        const targetId = target.getAttribute('data-id');

        this.alertHandler.hideAlerts();
        this.creditCardsLoader.show();

        fetch(helper.getUrlWithCsrfToken(`${window.paypalUrls.deleteCreditCardUrl}?uuid=${targetId}`))
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    this.alertHandler.showError(data.message);
                } else {
                    this.alertHandler.showInfo(data.alertMessage);
                    document.getElementById(`uuid-${targetId}`).remove();

                    if (data.newDefaultCreditCardId) {
                        document.querySelector(`.uuid-${data.newDefaultCreditCardId}`).classList.add(this.CSS_CLASSES.IS_DEFAULT);
                    }
                }

                this.handleCreditCardLimit();
                this.creditCardsLoader.hide();
            })
            .catch(() => {
                window.location.reload();
            });
    }

    /**
     * Inits Credit Card remove functionality on the Account Page
     * @returns {void}
     */
    initRemoveCreditCardEvent() {
        this.removeButtonEls = document.querySelectorAll('.js-remove-pp-payment');
        this.creditCardsLoaderContainerEl = document.querySelector('.js-paypal-cc-loader');

        this.creditCardsLoader = Loader(this.creditCardsLoaderContainerEl);

        if (this.removeButtonEls.length) {
            this.removeButtonEls.forEach((button) => {
                button.addEventListener('click', this.handleRemoveCreditCardButton.bind(this));
            });
        }
    }

    /**
     * This function handles the default credit card
     * @param {Event} event - The event parameter for triggered action
     * @returns {void}
     */
    handleMakeCreditCardDefault(event) {
        const target = event.target;
        const targetId = target.getAttribute('data-id');

        this.alertHandler.hideAlerts();
        this.creditCardsLoader.show();

        fetch(helper.getUrlWithCsrfToken(`${window.paypalUrls.makeCreditCardDefaultUrl}?uuid=${targetId}`), {
            method: 'POST'
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    this.alertHandler.showError(data.message);
                } else {
                    if (data.oldDefaultCreditCardId) {
                        document.querySelector(`.uuid-${data.oldDefaultCreditCardId}`).classList.remove(this.CSS_CLASSES.IS_DEFAULT);
                    }

                    document.querySelector(`.uuid-${data.newDefaultCreditCardId}`).classList.add(this.CSS_CLASSES.IS_DEFAULT);

                    this.alertHandler.showSuccess(data.message);
                }

                this.creditCardsLoader.hide();
            })
            .catch((error) => {
                this.creditCardsLoader.hide();
                this.alertHandler.showError(error.message);
            });
    }

    /**
     * Init default credit card functionality on the Account Page
     * @returns {void}
     */
    initMakeCreditCardDefaultEvent() {
        const buttonEls = document.querySelectorAll('.js-make-card-default');

        if (buttonEls.length) {
            this.creditCardsLoaderContainerEl = document.querySelector('.js-paypal-cc-loader');
            this.creditCardsLoader = Loader(this.creditCardsLoaderContainerEl);

            buttonEls.forEach((buttonEl) => {
                buttonEl.addEventListener('click', this.handleMakeCreditCardDefault.bind(this));
            });
        }
    }

    /**
     * Handles input event for expiration date field
     * @param {Event} event - The event parameter for triggered action
     * @returns {void}
     */
    handleExpirationDateInput(event) {
        const expDateField = event.target;
        const expDateValue = expDateField.value.replace(/\D/g, '');

        expDateField.style.color = this.fieldStyles.color;

        let formattedValue = '';

        for (let i = 0; i < expDateValue.length; i++) {
            if (i === 2) {
                formattedValue += ' / ';
            }

            formattedValue += expDateValue.charAt(i);
        }

        expDateField.value = formattedValue;
    }

    /**
     * Handles input event for card number field
     * @param {Event} event - The event parameter for triggered action
     * @returns {void}
     */
    handleCardNumberInput(event) {
        const cardField = event.target;
        const cardNumber = cardField.value.replace(/\D/g, '');

        cardField.style.color = this.fieldStyles.color;

        let formattedNumber = cardNumber;

        if (cardNumber.length >= 4 && cardNumber.length <= 16) {
            if (/^3([47068])/.test(cardNumber)) {
                if (cardNumber.length <= 10) {
                    formattedNumber = cardNumber.replace(/^(\d{4})(\d{1,6})$/, '$1 $2');
                } else {
                    formattedNumber = cardNumber.replace(/^(\d{4})(\d{6})(\d+)$/, '$1 $2 $3');
                }
            } else {
                formattedNumber = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
            }
        } else if (cardNumber.length > 16) {
            formattedNumber = cardNumber.replace(/^(\d{4})(\d{4})(\d{4})(\d+)$/, '$1 $2 $3 $4');
        }

        cardField.value = formattedNumber;
    }

    /**
     * Handles input event for card security code field
     * @param {Event} event - The event parameter for triggered action
     * @returns {void}
     */
    handleCardSecurityCodeInput(event) {
        event.target.style.color = this.fieldStyles.color;

        event.target.value = event.target.value.replace(/\D/g, '');
    }

    /**
     * Applies styles for form fields
     * @returns {void}
     */
    applyFieldStyles() {
        const formFields = this.addNewCardFormEl.querySelectorAll('.form-control');

        formFields.forEach(field => {
            field.style.fontSize = this.fieldStyles.fontSize + 'pt';
            field.style.color = this.fieldStyles.color;
        });
    }

    /**
     * Inits Credit Card specific events on the Account Page
     * @returns {void}
     */
    initEvents() {
        if (this.addNewCardFormEl) {
            this.addNewCardButtonEl.addEventListener('click', this.showAddNewCardOptions.bind(this));
            this.cancelButtonEl.addEventListener('click', this.hideAddNewCardOptions.bind(this));
            this.saveButtonEl.addEventListener('click', this.handleSaveCreditCardButton.bind(this));
            this.expirationDateInputEl.addEventListener('input', this.handleExpirationDateInput.bind(this));
            this.cardNumberInputEl.addEventListener('input', this.handleCardNumberInput.bind(this));
            this.cardSecurityCodeInputEl.addEventListener('input', this.handleCardSecurityCodeInput.bind(this));

            this.applyFieldStyles();
            this.handleCreditCardLimit();
        }

        this.initRemoveCreditCardEvent();
        this.initMakeCreditCardDefaultEvent();
    }
}

module.exports = CreditCardAccount;
