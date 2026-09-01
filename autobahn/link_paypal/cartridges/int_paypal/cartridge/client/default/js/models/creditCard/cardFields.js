/* eslint-disable no-console */

'use strict';

const api = require('../../helpers/api');
const helper = require('../../helpers/helper');
const loaderInstance = require('../../components/loader');
const clientSideValidation = require('base/components/clientSideValidation');

const AlertHandlerModel = require('../alertHandler');
const CreditCardBaseModel = require('./creditCardBase');

/**
 * The class represents the card fields functionality
 */
class CardFields extends CreditCardBaseModel {
    constructor() {
        super();

        this.CSS_CLASSES = {
            ACTIVE: 'active',
            D_NONE: 'd-none',
            BORDER_DANGER: 'border-danger'
        };

        this.loader = loaderInstance(document.querySelector('.js-paypalLoader'));
        this.continueButtonEl = document.querySelector('button.submit-payment');
        this.creditFieldsContainerEl = document.querySelector('.js-paypal-cc-fields');

        this.cardFieldsConfig = helper.tryParseJSON(this.creditFieldsContainerEl.getAttribute('data-configs'));

        this.alertHandler = new AlertHandlerModel();

        const amount = helper.getFloatFromAmount(document.querySelector('.grand-total-sum').textContent);

        this.isOrderZeroAmount = !Number.isNaN(amount) && amount === 0;
        this.fieldsState = { cleared: false };
    }

    /**
     * Initiates and process the card fields
     */
    init() {
        const that = this;

        that.renderMark();

        const style = {
            body: {
                padding: 0
            },
            input: {
                'font-size': that.cardFieldsConfig.fieldsConfig.styles.fontSize + 'pt',
                color: that.cardFieldsConfig.fieldsConfig.styles.color,
                padding: '6px 12px'
            },
            '.valid': {
                color: that.cardFieldsConfig.fieldsConfig.styles.validColor
            },
            '.invalid': {
                color: that.cardFieldsConfig.fieldsConfig.styles.invalidColor
            }
        };

        const inputEvents = {
            onChange: (data) =>
                Object.keys(data.fields).forEach((fieldName) => {
                    if (that.fieldsState.cleared && data.fields[fieldName].isEmpty) {
                        that.fields[fieldName].removeClass('invalid');
                        that.fields[fieldName].removeAttribute('aria-invalid');
                    }
                })
        };

        that.cardFields = paypal.CardFields({
            createOrder: that.createOrder.bind(that),
            onApprove: that.onApprove.bind(that),
            onError: that.onError.bind(that),
            onCancel: that.onCancel.bind(that),
            style,
            inputEvents
        });

        if (that.cardFields.isEligible()) {
            const nameField = that.cardFields.NameField();
            const numberField = that.cardFields.NumberField();
            const cvvField = that.cardFields.CVVField();
            const expireField = that.cardFields.ExpiryField();

            nameField.render('#card-name-field-container');
            numberField.render('#card-number-field-container');
            cvvField.render('#card-cvv-field-container');
            expireField.render('#card-expire-field-container');

            that.fields = {
                cardNameField: nameField,
                cardNumberField: numberField,
                cardExpiryField: expireField,
                cardCvvField: cvvField
            };

            that.continueButtonEl.addEventListener('click', that.handleContinueButtonClick.bind(that));
        }
    }

    handleContinueButtonClick(event) {
        if (!event.isTrusted || !this.isActiveCreditCardTab()) {
            return;
        }

        this.alertHandler.hideAlerts();

        if (this.isOrderZeroAmount) {
            event.preventDefault();
            event.stopPropagation();

            this.alertHandler.showError(window.i18nMessages.ZERO_AMOUNT);

            return;
        }

        this.loader.show();

        if (this.isNewCreditCardFlow()) {
            event.preventDefault();
            event.stopPropagation();

            this.fieldsState.cleared = false;

            this.cardFields.getState()
                .then((data) => {
                    if (this.validateCardFields(data)) {
                        this.processNewCreditCard();
                    }
                });
        }
    }

    isNewCreditCardFlow() {
        return !this.paypalCreditCardListEl
        || (this.paypalCreditCardListEl && this.paypalCreditCardListEl.selectedOptions[0].id === 'new-card-account');
    }

    /**
     * Renders the credit card tab
     */
    renderMark() {
        paypal.Marks({
            fundingSource: 'card'
        }).render('.js-credit-card-mark');

        document.querySelector('.js-nav-item-credit-card').classList.remove(this.CSS_CLASSES.D_NONE);
    }

    createOrder() {
        const saveCreditCardAccountEl = document.getElementById('saveCreditCardAccount');

        const paymentSourceData = {
            card: {
                billing_address: {
                    address_line_1: this.billingAddress.address1,
                    address_line_2: this.billingAddress.address2,
                    admin_area_2: this.billingAddress.city,
                    admin_area_1: this.billingAddress.stateCode,
                    postal_code: this.billingAddress.postalCode,
                    country_code: this.billingAddress.countryCode
                },
                attributes: {}
            }
        };

        if (window.paypalPreferences.isDigitalGoodsFlowEnabled) {
            const email = document.querySelector('.customer-summary-email').textContent.trim();

            paymentSourceData.billingAddressDigitalGoods = {
                name: `${this.billingAddress.firstName} ${this.billingAddress.lastName}`,
                phone: {
                    phone_number: {
                        national_number: this.billingAddress.phone
                    }
                },
                email_address: email,
                address: Object.assign({}, paymentSourceData.card.billing_address)
            };
        }

        if (saveCreditCardAccountEl?.checked) {
            paymentSourceData.card.attributes.vault = {
                store_in_vault: 'ON_SUCCESS'
            };
        }

        const orderIdData = api.getPaypalOrderId({ paymentSourceData });

        helper.throwIfError(orderIdData);

        return orderIdData.id;
    }

    onApprove() {} // required method

    onCancel() {
        this.handleCancelOrError();
    }

    onError(error) {
        this.handleCancelOrError(error);
    }

    validateCardFields(data) {
        if (data.isFormValid) {
            return true;
        }

        Object.entries(data.fields).forEach(([key, value]) => {
            if (!value.isValid) {
                this.fields[key].addClass('invalid');
            } else {
                this.fields[key].removeClass('invalid');
            }
        });

        this.alertHandler.showError('Validation failed!');

        this.loader.hide();

        return false;
    }

    /**
     * Clears fields
     */
    clearFields() {
        if (!this.fieldsState.cleared) {
            Object.values(this.fields).forEach((field) => field.clear());
            this.fieldsState.cleared = true;
        }
    }

    /**
     * Indicates whether the credit card tab is active
     * @returns {boolean} True/False
     */
    isActiveCreditCardTab() {
        return document.getElementById('credit-card-content').classList.contains(this.CSS_CLASSES.ACTIVE);
    }

    /**
     * Process a new Credit card on the checkout page
     */
    processNewCreditCard() {
        const billingFormEl = document.getElementById('dwfrm_billing');
        const getAddressFieldsFromUI = require('base/checkout/address').methods.getAddressFieldsFromUI;

        clientSideValidation.functions.clearForm(billingFormEl);

        const isValidForm = helper.validateForm(billingFormEl);

        if (!isValidForm.isValid) {
            this.loader.hide();

            return;
        }

        this.billingAddress = getAddressFieldsFromUI(billingFormEl);

        this.cardFields.submit()
            .then(() => {
                this.continueButtonEl.click();

                $('body').on('checkout:updateCheckoutView', this.clearFields.bind(this));

                this.loader.hide();
            })
            .catch((error) => {
                this.loader.hide();

                this.alertHandler.showError(this.cardFieldsConfig.errorMessages.threeDSVerificationFailed);

                console.error('There was an error with card fields: ', error);
            });
    }

    /**
     * Shows a card fields container
     */
    showCardFields() {
        this.creditFieldsContainerEl.classList.remove(this.CSS_CLASSES.D_NONE);

        this.loader.hide();
    }

    /**
     * Hides a card fields container
     */
    hideCardFields() {
        this.creditFieldsContainerEl.classList.add(this.CSS_CLASSES.D_NONE);
    }

    /**
     * Handles cancel or error flows
     * Shows appropriate message to user
     * @param {string|undefined} [error] error text if available
     */
    handleCancelOrError(error) {
        if (error) {
            console.error(error);
        }

        this.alertHandler.showError(
            helper.getErrorMessage(error, this.cardFieldsConfig.errorMessages.threeDSVerificationFailed)
        );

        this.loader.hide();
    }
}

module.exports = CardFields;
