'use strict';

const AlertHandler = require('../models/alertHandler');

const helper = require('../helpers/helper');
const fastlaneHelper = require('./fastlaneHelper');
const addressHelper = require('./addressHelper');
const sessionCard = require('./sessionCard');

const ROLE_USER = 'user';
const ROLE_GUEST = 'guest';

const CSS_CLASS_D_NONE = 'd-none';
const SESSION_KEY_FASTLANE_USER_ROLE = 'fastlaneUserRole';
const SESSION_KEY_FASTLANE_EMAIL = 'fastlaneEmail';
const SESSION_KEY_FASTLANE_CARD = 'fastlaneCard';
const CSS_CLASS_SHIP_TO_PHONE = '.ship-to-phone';

const ERROR_THREE_DS_VERIFICATION_FAILED = window.i18nMessages.THREE_DS_VERIFICATION_FAILED;
const ERROR_INVALID_BILLING_ADDRESS = window.i18nMessages.INVALID_BILLING_ADDRESS;

class Fastlane {
    #isPhonePrefilled = false;

    constructor() {
        if (this.isSandbox()) {
            localStorage.setItem('axoEnv', 'SANDBOX');
            localStorage.setItem('fastlaneEnv', 'sandbox');
        }

        this.isUserFlowRunOnce = true;
        this.isGuestFlowRunOnce = true;
        this.isCheckoutFromBeginning = false;

        this.isPaymentUI = window.paypalPreferences.isFastlanePaymentUiEnabled;
        this.isCardholderNameEnabled = window.paypalPreferences.fastlaneCardholderName;
        this.loginWatermarkEl = document.getElementById('login-watermark');
        this.cardWatermarkEl = document.getElementById('card-watermark');
        this.walletContainerEl = document.getElementById('fastlane-wallet-container');
        this.hostedFieldsEl = document.getElementById('fastlane-fields-container');
        this.lookupCustomerButtonEl = document.getElementById('submit-fastlane-customer');
        this.cardContainerEl = document.getElementById('fastlane-card-container');
        this.cardWatermarkContainerEl = document.querySelector('.card-watermark-container');
        this.addressContainerAllEls = fastlaneHelper.getAllElements('.fastlane-address');
        this.firstAddressContainer = fastlaneHelper.getFirstElement(this.addressContainerAllEls);
        this.secondAddressContainer = fastlaneHelper.getSecondElement(this.addressContainerAllEls);

        this.checkoutMainEl = document.getElementById('checkout-main');
        this.cardListEl = document.getElementById('fastlaneCreditCardList');
        this.multishipCheckbox = document.getElementById('multiShipCheck');
        this.submitShippingButtonEl = document.querySelector('button.submit-shipping');
        this.submitPaymentButtonEl = document.querySelector('button.submit-payment');
        this.placeOrderButtonEl = document.querySelector('button.place-order');
        this.creditCardTab = document.querySelector('.js-fastlane-tab');
        this.billingAddressSelectorBlockEl = document.querySelector('.address-selector-block');
        this.allShippingAddressForms = fastlaneHelper.getAllElements('form[name=dwfrm_shipping]');
        this.firstShippingForm = fastlaneHelper.getFirstElement(this.allShippingAddressForms);
        this.secondShippingForm = fastlaneHelper.getSecondElement(this.allShippingAddressForms);
        this.allShipmentSelectorBlockEls = fastlaneHelper.getAllElements('.shipment-selector-block');
        this.secondShipmentSelectorBlockEl = fastlaneHelper.getSecondElement(this.allShipmentSelectorBlockEls);
        this.allBtnEnterMultiship = fastlaneHelper.getAllElements('.btn-enter-multi-ship');
        this.secondBtnEnterMultiship = fastlaneHelper.getSecondElement(this.allBtnEnterMultiship);
        this.billingForm = document.getElementById('dwfrm_billing');
        this.paymentOptionsEl = document.querySelector('.payment-options');
        this.phoneNumberEl = document.querySelector('.dwfrm_billing_contactInfoFields_phone');

        const { styles } = helper.tryParseJSON(this.lookupCustomerButtonEl.dataset.fastlaneConfig);

        this.styles = styles;
        this.addressOptions = { allowedLocations: this.getAllowedCountries() };

        this.alertHandler = new AlertHandler();
    }

    async init() {
        try {
            this.addEvents();

            await this.initCheckout();
            await this.initWatermarks();

            this.renderWatermarkWithTooltip(this.loginWatermarkEl);

            if (this.isNotCustomerStage()) {
                await this.determineFlow();
            }
        } catch (error) {
            this.alertHandler.showError(error.message);
        }
    }

    /**
     * Check that instance type to be a Sandbox
     * @returns {boolean} True if it is not a production, false otherwise.
     */
    isSandbox() {
        return window.paypalPreferences.instanceType === 'sandbox';
    }

    /**
     * Gets the current checkout stage from the dataset.
     * @returns {string|undefined} The current checkout stage, or undefined if not available.
     */
    getCheckoutStage() {
        return this.checkoutMainEl?.dataset.checkoutStage;
    }

    /**
     * Checks if the current checkout stage is the 'shipping' stage.
     * @returns {boolean} True if the current stage is 'shipping', false otherwise.
     */
    isShippingStage() {
        return this.getCheckoutStage() === 'shipping';
    }

    /**
     * Checks if the current checkout stage is the 'payment' stage.
     * @returns {boolean} True if the current stage is 'payment', false otherwise.
     */
    isPaymentStage() {
        return this.getCheckoutStage() === 'payment';
    }

    /**
     * Checks if the current checkout stage is not 'customer'
     * @returns {boolean} Returns `true` if the current checkout stage is not 'customer', otherwise `false`.
     */
    isNotCustomerStage() {
        return this.getCheckoutStage() !== 'customer';
    }

    /**
     * Returns whether the multiship option is enabled by checking the checkbox state.
     * @returns {boolean} True if the multiship checkbox exists and is checked, otherwise false.
     */
    isMultishipEnabled() {
        return Boolean(this.multishipCheckbox?.checked);
    }

    /**
     * Initializes checkout
     */
    async initCheckout() {
        this.fastlane = await window.paypal.Fastlane({
            shippingAddressOptions: this.addressOptions,
            styles: this.styles
        });

        this.identity = this.fastlane.identity;
        this.profile = this.fastlane.profile;

        this.threeDSecureComponent = window.paypal.ThreeDomainSecureClient;
    }

    /**
     * Initialize watermarks
     */
    async initWatermarks() {
        this.watermark = await this.fastlane.FastlaneWatermarkComponent({ includeAdditionalInfo: false });
        this.watermarkWithTooltip = await this.fastlane.FastlaneWatermarkComponent({ includeAdditionalInfo: true });
    }

    /**
     * Render watermark with additional information (tooltip)
     * @param {HTMLElement} watermarkEl - watermark element
     */
    renderWatermarkWithTooltip(watermarkEl) {
        if (watermarkEl) {
            this.watermarkWithTooltip.render('#' + watermarkEl.id);
        }
    }

    /**
     * Render watermark without additional information
     * @param {HTMLElement} watermarkEl - watermark element
     */
    renderWatermark(watermarkEl) {
        if (watermarkEl) {
            this.watermark.render('#' + watermarkEl.id);
        }
    }

    /**
     * Render card component
     */
    async renderCardComponent() {
        let cardComponent;

        const fieldsParams = {
            fields: this.createFieldsParams()
        };

        if (!this.isPaymentUI) {
            cardComponent = await this.fastlane.FastlaneCardComponent(fieldsParams);
        } else {
            cardComponent = await this.fastlane.FastlanePaymentComponent(fieldsParams);

            const shippingAddress = addressHelper.formatShippingAddress();

            if (shippingAddress.address.countryCode) {
                await cardComponent.setShippingAddress(shippingAddress);
            }
        }

        this.cardComponent = cardComponent.render('#' + this.hostedFieldsEl.id);
    }

    /**
     * Render payment component
     */
    async renderPaymentComponent() {
        const paymentComponent = await this.fastlane.FastlanePaymentComponent();

        this.paymentComponent = paymentComponent.render('#' + this.walletContainerEl.id);
    }

    /**
     * Add event listeners
     */
    addEvents() {
        this.cardListEl.addEventListener('change', this.cardListChange.bind(this));
        this.submitPaymentButtonEl.addEventListener('click', this.handlePlaceOrderStep.bind(this));
        this.lookupCustomerButtonEl.addEventListener('click', this.handleLookupStep.bind(this));
        this.paymentOptionsEl?.addEventListener('click', this.handleBillingAddressBlock.bind(this));
        this.placeOrderButtonEl?.addEventListener('click', this.handleThreeDSecureFlow.bind(this));

        $(document).on('ajaxSuccess', this.handleAjaxSuccess.bind(this));
    }

    /**
     * Check is credit card tab is active or not
     * @returns {boolean} - true if active, otherwise false
     */
    isCreditCardTabActive() {
        return this.creditCardTab.classList.contains('active');
    }

    /**
     * Determines whether to abort handling of place order step or not
     * @param {Object} event - Event object
     * @returns {boolean} - true/false
     */
    abortPlaceOrderStepHandling(event) {
        return !event.isTrusted || !this.isCreditCardTabActive();
    }

    /**
     * Check if the user is a guest and the session card is in the new card flow.
     * @returns {boolean} - true/false
     */
    shouldHandleGuestNewCardFlow() {
        return (fastlaneHelper.isFastlaneRoleGuest() || fastlaneHelper.isNoSavedCardInWallet()) && sessionCard.isNewCardFlow();
    }

    /**
     * Check if the UI is for payments, the user has a fastlane role, and the session card feature is enabled.
     * @returns {boolean} - true/false
     */
    shouldHandleUserPaymentUI() {
        return this.isPaymentUI && fastlaneHelper.isFastlaneRoleUser() && fastlaneHelper.isCardInWallet();
    }

    /**
     * Handle billing address block (show/hide)
     * @param {Event} event - Event object
     * @returns {void}
     */
    handleBillingAddressBlock(event) {
        const target = event.target.closest('.nav-link');

        if (target.classList.contains('active')) {
            return;
        }

        const methodId = target.parentElement.dataset.methodId;
        const isCreditCard = methodId === window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;

        if (isCreditCard && (this.isPaymentUI || fastlaneHelper.isFastlaneRoleUser() && fastlaneHelper.isCardInWallet())) {
            fastlaneHelper.addClass(this.billingAddressSelectorBlockEl, CSS_CLASS_D_NONE);
        } else {
            fastlaneHelper.removeClass(this.billingAddressSelectorBlockEl, CSS_CLASS_D_NONE);
        }
    }

    /**
     * Handle actions for non Fastlane payment on checkout page
     */
    handleNonFastlaneFlow() {
        this.updateIsNonFastlaneValue(true);

        if (this.isPaymentUI) {
            sessionCard.removeActiveSessionPayment();
        }
    }

    /**
     * Place order step
     * @param {Event} event - Event object
     * @returns {void}
     */
    async handlePlaceOrderStep(event) {
        if (!this.isCreditCardTabActive()) {
            this.handleNonFastlaneFlow();

            return;
        }

        const shouldAbort = this.abortPlaceOrderStepHandling(event);

        if (shouldAbort) {
            return;
        }

        const isBillingFormValid = fastlaneHelper.validateForm(this.billingForm);

        fastlaneHelper.applyPreventEventMethods(event);

        if (this.shouldHandleGuestNewCardFlow()) {
            if (!isBillingFormValid) {
                this.alertHandler.showError(ERROR_INVALID_BILLING_ADDRESS);

                return;
            }

            await this.submitGuestPayment();
        } else if (this.shouldHandleUserPaymentUI()) {
            const profileName = this.profileData?.name;
            const phoneNumber = this.profileData?.shippingAddress?.phoneNumber ?? '';

            const { paymentSource, id } = await this.paymentComponent.getPaymentToken();

            if (paymentSource && id) {
                this.billingAddress = addressHelper.prepareAddressData(paymentSource.card?.billingAddress, profileName, phoneNumber);

                addressHelper.handleBillingAddressUpdate(this.billingAddress);
                fastlaneHelper.setPaymentData(paymentSource.card, id);

                if (!fastlaneHelper.validateForm(this.billingForm)) {
                    this.alertHandler.showError(ERROR_INVALID_BILLING_ADDRESS);

                    return;
                }
            }
        } else if (!isBillingFormValid) {
            this.alertHandler.showError(ERROR_INVALID_BILLING_ADDRESS);

            return;
        }

        this.updateIsNonFastlaneValue(false);

        event.target.click();
    }

    /**
     * Look up step
     * @param {Object} event Event
     * @returns {void}
     */
    async handleLookupStep(event) {
        if (!event.isTrusted) {
            return;
        }

        if (!this.checkEmailField()) {
            return;
        }

        fastlaneHelper.applyPreventEventMethods(event);

        this.isCheckoutFromBeginning = true;
        this.lookupCustomerButtonEl.disabled = true;

        await this.determineFlow();
    }

    /**
     * Handles ThreeDSecure (3DS) flow
     * @param {Event} event - Event object
     * @returns {void}
     */
    async handleThreeDSecureFlow(event) {
        const shouldAbort = this.abortPlaceOrderStepHandling(event);

        if (shouldAbort || fastlaneHelper.isNonFastlaneUsed()) {
            return;
        }

        fastlaneHelper.applyPreventEventMethods(event);

        try {
            const isThreeDSecureEligible = await this.isThreeDSecureEligible();

            if (isThreeDSecureEligible) {
                const {
                    liabilityShift,
                    authenticationState,
                    nonce
                } = await this.threeDSecureComponent.show();

                if (authenticationState === window.paypalConstants.STATE_SUCCEEDED
                    && [window.paypalConstants.THREE_DOMAIN_SECURE_LIABILITY_STATUS_YES,
                        window.paypalConstants.THREE_DOMAIN_SECURE_LIABILITY_STATUS_POSSIBLE
                    ].includes(liabilityShift)) {
                    const api = require('../helpers/api');

                    api.saveEnrichedNonce(nonce)
                        .then(() => event.target.click())
                        .catch(() => this.alertHandler.showError(ERROR_THREE_DS_VERIFICATION_FAILED));
                } else {
                    if (authenticationState === window.paypalConstants.STATE_ERRORED && this.isPaymentUI) {
                        sessionCard.removeActiveSessionPayment();
                    }

                    this.alertHandler.showError(ERROR_THREE_DS_VERIFICATION_FAILED);
                }
            } else {
                event.target.click();
            }
        } catch (error) {
            this.alertHandler.showError(ERROR_THREE_DS_VERIFICATION_FAILED);
        }
    }

    /**
     * Handle Ajax Success event
     * @param {Object} _event - The event object
     * @param {Object} _jqXHR - XMLHttpRequest object
     * @param {Object} _ajaxOptions - Ajax options object
     * @param {Object} response - Response
     */
    async handleAjaxSuccess(_event, _jqXHR, _ajaxOptions, response) { // eslint-disable-line max-params
        const isSubmitMultiShipEndpoint = response.action === 'CheckoutServices-Get';
        const isSubmitCustomerEndpoint = response.action === 'CheckoutServices-SubmitCustomer';
        const isSubmitShippingEndpoint = response.action === 'CheckoutShippingServices-SubmitShipping';

        const isOneClickPossible = this.isOneClickPossible(response);
        const isFastlaneShippingData = Boolean(this.profileData?.shippingAddress);
        const isFastlaneCardData = Boolean(this.profileData?.card?.paymentSource?.card);

        if (isSubmitCustomerEndpoint) {
            this.lookupCustomerButtonEl.disabled = false;
        }

        if (isSubmitShippingEndpoint && this.isPaymentStage() && this.isPaymentUI && fastlaneHelper.isFastlaneRoleGuest()) {
            await this.cardComponent.setShippingAddress(addressHelper.formatShippingAddress());
        }

        if (isSubmitCustomerEndpoint && this.isShippingStage() && isFastlaneShippingData && isOneClickPossible) {
            const allSaveMultishipBtns = fastlaneHelper.getAllElements('.btn-save-multi-ship.save-shipment');
            const secondBtnSaveMultiship = fastlaneHelper.getSecondElement(allSaveMultishipBtns);
            const isSaveMultishipClickRequired = !secondBtnSaveMultiship?.classList.contains('d-none');

            if (this.isMultishipEnabled() && isSaveMultishipClickRequired) {
                secondBtnSaveMultiship.click();
            }

            this.submitShippingButtonEl.click();
        }

        const isMultiShipFlow = isSubmitMultiShipEndpoint && this.isMultishipEnabled();
        const isPaymentClickPossible = this.isPaymentStage() && isFastlaneCardData && isOneClickPossible;

        if (isPaymentClickPossible && (isMultiShipFlow || isSubmitShippingEndpoint)) {
            this.submitPaymentButtonEl.click();
        }
    }

    /**
     * Determines which flow should be handled on checkout (Fastlane guest/user flow)
     */
    async determineFlow() {
        const customerEmail = this.getCustomerEmail();

        if (customerEmail && customerEmail !== 'null') {
            if (this.isCheckoutFromBeginning) {
                this.handleCustomerLogin(customerEmail);

                if (!this.isCreditCardTabActive()) {
                    this.creditCardTab.click();
                }
            } else if (fastlaneHelper.isNonFastlaneUsed()) {
                await this.lookupCustomerByEmail(customerEmail);

                this.handleGuestFlow();

                return;
            }

            const {
                customerContextId
            } = await this.lookupCustomerByEmail(customerEmail);

            if (customerContextId) {
                const {
                    authenticationState,
                    profileData
                } = await this.triggerAuthenticationFlow(customerContextId);

                this.triggerContinueAsGuestClick();

                if (authenticationState === 'succeeded') {
                    this.profileData = profileData;
                    this.handleUserFlow();
                } else {
                    this.handleGuestFlow();
                }
            } else {
                this.triggerContinueAsGuestClick();
                this.handleGuestFlow();
            }
        }
    }

    /**
     * Look up for customer by customer's email
     * @param {string} email email value from input
     * @returns {Promise} Promise
     */
    lookupCustomerByEmail(email) {
        return this.identity.lookupCustomerByEmail(email.trim());
    }

    /**
     * Triggers authentication flow
     * @param {string} customerId customer id value
     * @returns {Promise} Promise
     */
    triggerAuthenticationFlow(customerId) {
        return this.identity.triggerAuthenticationFlow(customerId);
    }

    /**
     * Handle guest flow
     */
    async handleGuestFlow() {
        sessionStorage.setItem(SESSION_KEY_FASTLANE_USER_ROLE, ROLE_GUEST);

        fastlaneHelper.showShippingAddressFormBlock();
        fastlaneHelper.hideFastlaneAddressBlock(this.addressContainerAllEls);
        fastlaneHelper.hideAddressWatermark();
        fastlaneHelper.clearElementContent(this.walletContainerEl);

        fastlaneHelper.addClass(this.cardContainerEl, CSS_CLASS_D_NONE);
        fastlaneHelper.addClass(this.walletContainerEl, CSS_CLASS_D_NONE);
        fastlaneHelper.addClass(this.cardWatermarkEl, CSS_CLASS_D_NONE);
        fastlaneHelper.addClass(this.cardWatermarkContainerEl, CSS_CLASS_D_NONE);

        fastlaneHelper.removeClass(this.phoneNumberEl, CSS_CLASS_D_NONE);

        if (this.isMultishipEnabled()) {
            this.showFormForMultishipFlow();
        }

        this.isPaymentUI && this.isCreditCardTabActive()
            ? fastlaneHelper.addClass(this.billingAddressSelectorBlockEl, CSS_CLASS_D_NONE)
            : fastlaneHelper.removeClass(this.billingAddressSelectorBlockEl, CSS_CLASS_D_NONE);

        if (this.isPaymentUI && sessionCard.isSessionCardFlow()) {
            sessionCard.setPaymentToken();
            sessionCard.showSessionCardBlock();
        } else {
            fastlaneHelper.removeClass(this.hostedFieldsEl, CSS_CLASS_D_NONE);
        }

        this.renderCardComponent();

        if (this.isGuestFlowRunOnce) {
            $('body').on('checkout:updateCheckoutView', this.handleUpdateCheckoutViewForGuest.bind(this));
            $('body').on('shipping:selectMultiShipping', this.showFormForMultishipFlow.bind(this));

            this.isGuestFlowRunOnce = false;
        }
    }

    /**
     * Handle phone number prefill
     * @param {Object} data - Response data
     */
    handlePhoneNumberPrefill(data) {
        const phone = data.order?.billing?.billingAddress?.address?.phone;

        if (phone && !this.#isPhonePrefilled) {
            this.renderCardComponent();
        }
    }

    /**
     * Handle user flow
     */
    handleUserFlow() {
        sessionStorage.setItem(SESSION_KEY_FASTLANE_USER_ROLE, ROLE_USER);

        fastlaneHelper.addClass(this.hostedFieldsEl, CSS_CLASS_D_NONE);

        this.shippingAddressHandler(this.profileData.shippingAddress);
        this.cardHandler();

        if (this.isUserFlowRunOnce) {
            $('body').on('checkout:updateCheckoutView', this.handleUpdateCheckoutViewForUser.bind(this));
            $('body').on('shipping:selectMultiShipping', this.handleMultishipSelect.bind(this));
            $('body').on('shipping:selectSingleShipping', this.handleSingleshipSelect.bind(this));
            $('body').on('shipping:updateShippingAddressSelector', this.createMultishipSummaryWatermark.bind(this));

            this.addEventToButtonForChange();
            this.handleShippingStepSkip();

            this.isUserFlowRunOnce = false;
        }
    }

    /**
     * Checks if the shipping step can be skipped and the process can move to the payment section.
     * This function runs only if the checkout has not started from the beginning,
     * the user is at the shipping stage, and there is valid shipping information available.
     */
    handleShippingStepSkip() {
        const isPageReloaded = helper.getNavigationType() === 'reload';
        const hasShippingData = Boolean(this.profileData.shippingAddress);

        if (!isPageReloaded && !this.isCheckoutFromBeginning && this.isShippingStage() && hasShippingData) {
            this.submitShippingButtonEl.click();
        }
    }

    /**
     * Add event for change button
     */
    addEventToButtonForChange() {
        const changeAddressEl = document.querySelectorAll('.js-change-fastlane-address');
        const changeCardEl = document.getElementById('js-change-fastlane-card');

        changeAddressEl.forEach(el => {
            el.addEventListener('click', this.changeAddressHandler.bind(this));
        });

        changeCardEl?.addEventListener('click', this.changeCardHandler.bind(this));
    }

    /**
     * Handles change card event for Fastlane checkout
     * @param {event} event current event
     */
    async changeCardHandler(event) {
        fastlaneHelper.applyPreventEventMethods(event);

        const {
            selectionChanged,
            selectedCard
        } = await this.profile.showCardSelector();

        if (selectionChanged) {
            const profileName = this.profileData.name;
            const cardData = selectedCard.paymentSource.card;
            const phoneNumber = this.profileData.shippingAddress?.phoneNumber ?? addressHelper.getShippingPhone();

            cardData.name = profileName.fullName;

            addressHelper.handleBillingAddressUpdate(addressHelper.prepareAddressData(cardData.billingAddress, profileName, phoneNumber));
            fastlaneHelper.setPaymentData(cardData, selectedCard.id);
            fastlaneHelper.showCard(cardData);
        }
    }

    /**
     * Handles change address event for Fastlane checkout
     * @param {Object} event current event
     */
    async changeAddressHandler(event) {
        fastlaneHelper.applyPreventEventMethods(event);

        const {
            selectionChanged,
            selectedAddress
        } = await this.profile.showShippingAddressSelector();

        if (selectionChanged) {
            this.shippingAddress = addressHelper.prepareAddressData(selectedAddress);

            if (this.multishipCheckbox) {
                addressHelper.handleAddressUpdate(this.secondShippingForm, this.shippingAddress, this.secondAddressContainer);
            }

            addressHelper.handleAddressUpdate(this.firstShippingForm, this.shippingAddress, this.firstAddressContainer);
        }
    }

    /**
     * Get customer email value
     * @returns {string|undefined} - customer email
     */
    getCustomerEmail() {
        const guestEmailEl = document.getElementById('email-guest');
        const customerEmailEl = document.querySelector('.customer-summary-email');

        return guestEmailEl?.value || customerEmailEl?.textContent;
    }

    /**
     * Validates the email input field.
     * @returns {boolean} Returns true if the email field has a value and is valid, otherwise false.
     */
    checkEmailField() {
        const fieldEl = document.getElementById('email-guest');

        if (!fieldEl) {
            return false;
        }

        const pattern = fieldEl.getAttribute('pattern');

        return Boolean(pattern && new RegExp(pattern).test(fieldEl.value));
    }

    /**
     * Triggers click on 'Continue as guest' button on customer step
     */
    triggerContinueAsGuestClick() {
        if (this.isCheckoutFromBeginning) {
            this.lookupCustomerButtonEl.disabled = false;
            this.lookupCustomerButtonEl.click();
            this.lookupCustomerButtonEl.disabled = true;
        }
    }

    /**
     * Handles card list select change
     */
    cardListChange() {
        const selectedOption = fastlaneHelper.getSelectedOption(this.cardListEl);

        switch (selectedOption.id) {
            case 'newCardAccount':
                fastlaneHelper.removeClass(this.walletContainerEl, CSS_CLASS_D_NONE);
                fastlaneHelper.removeClass(this.hostedFieldsEl, CSS_CLASS_D_NONE);

                break;

            case 'fastlaneSessionCreditCard':
                fastlaneHelper.addClass(this.walletContainerEl, CSS_CLASS_D_NONE);
                fastlaneHelper.addClass(this.hostedFieldsEl, CSS_CLASS_D_NONE);

                break;
        }
    }

    /**
     * Creates params from fastlane hosted fields render
     * @returns {Object} - params object
     */
    createFieldsParams() {
        const billingData = addressHelper.getAddressFieldsFromUI(this.billingForm);
        const phoneNumber = billingData.phone || addressHelper.getShippingPhone();

        this.#isPhonePrefilled = !!phoneNumber;

        const fieldParams = {
            phoneNumber: {
                prefill: phoneNumber
            },
            cardholderName: {
                enabled: this.isCardholderNameEnabled
            }
        };

        if (this.isCardholderNameEnabled) {
            fieldParams.cardholderName.prefill = addressHelper.getCardholderName();
        }

        return fieldParams;
    }

    /**
     * Gets array with allowed for shipping countries/states
     * @returns {Array} - allowed countries/states array
     */
    getAllowedCountries() {
        const allowedCountryOptions = Array.from(document.querySelector('.shippingCountry')?.options);
        const allowedStateOptions = Array.from(document.querySelector('.shippingState')?.options);

        if (!allowedCountryOptions) {
            return [];
        }

        return allowedCountryOptions.reduce((allowedLocations, country) => {
            if (country.id) {
                const isUSCountry = country.id === 'US';

                if (isUSCountry && allowedStateOptions) {
                    allowedStateOptions.forEach((state) => {
                        if (state.id && state.id.toLowerCase() !== 'other') {
                            allowedLocations.push(`${country.id}:${state.id}`);
                        }
                    });
                } else {
                    allowedLocations.push(country.id);
                }
            }

            return allowedLocations;
        }, []);
    }

    /**
     * Handles multiship flow for Fastlane user
     * @param {Object} shippingAddress - shipping address used for update
     */
    handleMultiship(shippingAddress) {
        const elementException = 2;

        fastlaneHelper.addClass(this.secondShipmentSelectorBlockEl, CSS_CLASS_D_NONE);

        this.secondBtnEnterMultiship.click();

        fastlaneHelper.hideFastlaneAddressBlock(this.addressContainerAllEls, elementException);

        const secondFastlanePhoneNumberEl = fastlaneHelper.getSecondElement(fastlaneHelper.getAllElements('.fastlane-phone-number'));

        this.addAddressWatermark(secondFastlanePhoneNumberEl);

        fastlaneHelper.showShippingAddressFormBlock(elementException);
        addressHelper.handleAddressUpdate(this.secondShippingForm, shippingAddress, this.secondAddressContainer);
        fastlaneHelper.removeClass(this.secondAddressContainer, CSS_CLASS_D_NONE);
    }

    /**
     * Shows shipping form when multiship flow for Fastlane guest user
     */
    showFormForMultishipFlow() {
        if (fastlaneHelper.isFastlaneRoleGuest()) {
            const elementException = 1;

            fastlaneHelper.showShippingAddressFormBlock(elementException);
        }
    }

    /**
     * Handles multiship select event flow
     */
    handleMultishipSelect() {
        if (fastlaneHelper.isFastlaneRoleUser() && this.shippingAddress) {
            this.handleMultiship(this.shippingAddress);
        } else {
            this.showFormForMultishipFlow();
        }
    }

    /**
     * Handles singleship select event flow
     */
    handleSingleshipSelect() {
        if (fastlaneHelper.isFastlaneRoleUser()) {
            addressHelper.handleAddressUpdate(this.firstShippingForm, this.shippingAddress, this.firstAddressContainer);
        }
    }

    /**
     * Handles update checkout view event for Fastlane user
     */
    handleUpdateCheckoutViewForUser() {
        if (fastlaneHelper.isFastlaneRoleUser()) {
            if (this.profileData?.card) {
                fastlaneHelper.setCardNumber(this.profileData.card.paymentSource?.card?.lastDigits);

                this.addCardSummaryWatermark();
            }

            addressHelper.handleAddressUpdate(
                this.firstShippingForm, this.shippingAddress, this.firstAddressContainer);

            if (this.multishipCheckbox) {
                addressHelper.handleAddressUpdate(
                    this.secondShippingForm, this.shippingAddress, this.secondAddressContainer);
            }

            if (this.billingAddress) {
                addressHelper.handleBillingAddressUpdate(this.billingAddress);
            }

            this.createMultishipSummaryWatermark();
            this.createMultishipGeneralSummaryWatermark();
        }
    }

    /**
     * Handles update checkout view event for Fastlane guest
     * @param {Object} _ - Event object
     * @param {Object} data - Response data
     */
    handleUpdateCheckoutViewForGuest(_, data) {
        if (fastlaneHelper.isFastlaneRoleGuest()) {
            this.handlePhoneNumberPrefill(data);
        }
    }

    /**
     * Saves customer email into session
     * @param {string} customerEmail - customer's email
     */
    saveCustomerEmail(customerEmail) {
        sessionStorage.setItem(SESSION_KEY_FASTLANE_EMAIL, customerEmail);
    }

    /**
     * Handles customer login step: compares used for login email address and clears session payment if needed
     * @param {string} customerEmail - customer's email
     */
    handleCustomerLogin(customerEmail) {
        const usedCustomerEmail = sessionStorage.getItem(SESSION_KEY_FASTLANE_EMAIL);

        if (!usedCustomerEmail) {
            this.saveCustomerEmail(customerEmail);
        } else if (usedCustomerEmail !== customerEmail) {
            if (this.isPaymentUI) {
                sessionCard.removeActiveSessionPayment();
            }

            this.saveCustomerEmail(customerEmail);
        }
    }

    /**
     * Creates multiship summary watermark
     */
    createMultishipSummaryWatermark() {
        const multishipShipBlockEls = fastlaneHelper.getAllElements('.shipping-section div.multi-shipping .card');
        const firstMultishipShipBlockEl = fastlaneHelper.getFirstElement(multishipShipBlockEls);

        if (firstMultishipShipBlockEl) {
            this.dataShipmentUUID = firstMultishipShipBlockEl.getAttribute('data-shipment-uuid');
            this.productLineItemUUID = firstMultishipShipBlockEl.querySelector('input[name=productLineItemUUID]')?.value;

            this.addAddressWatermark(firstMultishipShipBlockEl.querySelector(CSS_CLASS_SHIP_TO_PHONE));
        }
    }

    /**
     * Creates multiship general summary watermark
     */
    createMultishipGeneralSummaryWatermark() {
        const summaryMultishipBlockEls = document.querySelectorAll('.order-product-summary .multi-shipping');
        const orderProductSummaryEls = document.querySelectorAll('.order-product-summary');

        if (summaryMultishipBlockEls.length && this.dataShipmentUUID) {
            summaryMultishipBlockEls.forEach(block => {
                if (block.getAttribute('data-shipment-summary') === this.dataShipmentUUID) {
                    this.addAddressWatermark(block.querySelector(CSS_CLASS_SHIP_TO_PHONE));
                }
            });
        } else if (orderProductSummaryEls.length && this.productLineItemUUID) {
            orderProductSummaryEls.forEach(el => {
                el.querySelectorAll('.product-line-item').forEach(item => {
                    if (item.getAttribute('data-product-line-item') === this.productLineItemUUID) {
                        this.addAddressWatermark(el.querySelector(CSS_CLASS_SHIP_TO_PHONE));
                    }
                });
            });
        }
    }

    /**
     * Adds watermark after specific address element, creates watermark if is not created already
     * @param {HTMLElement} insertAfterEl - element after which watermark must be inserted
     */
    addAddressWatermark(insertAfterEl) {
        if (!insertAfterEl) {
            return;
        }

        const watermarkName = 'fastlane-watermark';
        const watermarkEl = document.getElementById(watermarkName);

        if (!watermarkEl) {
            const createdDiv = document.createElement('div');

            createdDiv.id = watermarkName;
            createdDiv.className = 'watermark-container';

            insertAfterEl.parentNode.insertBefore(createdDiv, createdDiv.nextSibling);

            this.renderWatermark(document.getElementById(watermarkName));
        } else {
            const nextElementSibling = insertAfterEl.nextElementSibling;

            if (nextElementSibling?.id === watermarkName) {
                if (nextElementSibling.classList.contains(CSS_CLASS_D_NONE)) {
                    fastlaneHelper.removeClass(nextElementSibling, CSS_CLASS_D_NONE);
                }

                return;
            }

            const clonedDiv = watermarkEl.cloneNode(true);

            insertAfterEl.parentNode.insertBefore(clonedDiv, clonedDiv.nextSibling);
        }
    }

    /**
     * Adds watermark after specific element on payment summary block
     */
    addCardSummaryWatermark() {
        if (this.cardWatermarkEl) {
            const creditCardTypeEL = document.querySelector('.credit-card-type');
            const paymentDetailsEl = document.querySelector('.js-paypal-payment-details');
            const paymentSummaryChildEls = paymentDetailsEl?.children;

            let insertAfterEl = creditCardTypeEL;

            if (this.isCreditCardTabActive() && paymentSummaryChildEls?.length > 1) {
                insertAfterEl = paymentSummaryChildEls[paymentSummaryChildEls.length - 2];
            }

            if (!insertAfterEl || insertAfterEl.nextElementSibling?.classList.contains('card-watermark')) {
                return;
            }

            const clonedDiv = this.cardWatermarkEl.cloneNode(true);

            insertAfterEl.insertBefore(clonedDiv, clonedDiv.nextSibling);
        }
    }

    /**
     * Handles shipping address behavior, cases with and without address from Fastlane side
     * @param {Object} shippingAddress - shipping address from Fastlane side
     */
    shippingAddressHandler(shippingAddress) {
        if (shippingAddress) {
            this.addAddressWatermark(document.querySelector('.single-shipping .fastlane-phone-number'));
            this.addAddressWatermark(document.querySelector('.single-shipping .shipping-phone'));

            fastlaneHelper.showFastlaneAddressBlock(this.addressContainerAllEls);
            fastlaneHelper.hideShippingAddressFormBlock();

            this.shippingAddress = addressHelper.prepareAddressData(shippingAddress);

            addressHelper.handleAddressUpdate(this.firstShippingForm, this.shippingAddress, this.firstAddressContainer);

            if (this.isMultishipEnabled()) {
                this.handleMultiship(this.shippingAddress);
            }
        } else {
            fastlaneHelper.showShippingAddressFormBlock();
            fastlaneHelper.hideFastlaneAddressBlock(this.addressContainerAllEls);
            fastlaneHelper.hideAddressWatermark();

            if (this.isMultishipEnabled()) {
                this.showFormForMultishipFlow();
            }
        }
    }

    /**
     * Handle hosted fields or session card block
     */
    handleHostedFieldsOrSessionCardBlock() {
        if (this.isPaymentUI) {
            fastlaneHelper.addClass(this.billingAddressSelectorBlockEl, CSS_CLASS_D_NONE);

            if (sessionCard.isSessionCardFlow()) {
                sessionCard.setPaymentToken();
                sessionCard.showSessionCardBlock();
            } else {
                fastlaneHelper.removeClass(this.hostedFieldsEl, CSS_CLASS_D_NONE);
            }
        } else {
            fastlaneHelper.removeClass(this.hostedFieldsEl, CSS_CLASS_D_NONE);
        }
    }

    /**
     * Checks whether the ThreeDSecure (3DS) component is eligible
     * @returns {Promise<boolean>} - Resolves to `true` if the 3DS component is eligible, otherwise `false`.
     */
    async isThreeDSecureEligible() {
        if (!this.threeDSecureComponent) {
            return false;
        }

        const threeDSecureParameters = await fastlaneHelper.createThreeDSecureParameters();

        return this.threeDSecureComponent.isEligible(
            threeDSecureParameters
        );
    }

    /**
     * Handles credit card behavior, cases for flexible/component with and without card data from Fastlane side
     */
    async cardHandler() {
        let cardData;
        let cardToken;

        const shippingAddress = this.profileData.shippingAddress;
        const profileName = this.profileData.name;
        const phoneNumber = shippingAddress?.phoneNumber ?? '';

        if (this.profileData?.card) {
            sessionStorage.setItem(SESSION_KEY_FASTLANE_CARD, true);

            fastlaneHelper.addClass(this.phoneNumberEl, CSS_CLASS_D_NONE);
            fastlaneHelper.addClass(this.billingAddressSelectorBlockEl, CSS_CLASS_D_NONE);
            sessionCard.hideSessionCardBlock();

            if (!this.isPaymentUI) {
                cardData = this.profileData.card?.paymentSource?.card;
                cardData.name = profileName.fullName;
                cardToken = this.profileData.card.id;

                fastlaneHelper.setPaymentData(cardData, cardToken);

                fastlaneHelper.removeClass(this.cardContainerEl, CSS_CLASS_D_NONE);
                fastlaneHelper.removeClass(this.cardWatermarkEl, CSS_CLASS_D_NONE);
                fastlaneHelper.removeClass(this.cardWatermarkContainerEl, CSS_CLASS_D_NONE);

                this.billingAddress = addressHelper.prepareAddressData(cardData?.billingAddress, profileName, phoneNumber);

                addressHelper.handleBillingAddressUpdate(this.billingAddress);
                fastlaneHelper.showCard(cardData);
            } else {
                fastlaneHelper.removeClass(this.walletContainerEl, CSS_CLASS_D_NONE);

                await this.renderPaymentComponent();

                if (this.paymentComponent) {
                    const tokenizationObject = {};
                    const paymentData = await this.paymentComponent.getPaymentToken(tokenizationObject);

                    cardData = paymentData.paymentSource.card;

                    fastlaneHelper.setPaymentData(cardData, paymentData.id);
                }
            }

            this.renderWatermark(this.cardWatermarkEl);
            this.addCardSummaryWatermark();

            this.createMultishipSummaryWatermark();
            this.createMultishipGeneralSummaryWatermark();

            fastlaneHelper.removeClass(this.cardWatermarkEl, CSS_CLASS_D_NONE);

            this.billingAddress = addressHelper.prepareAddressData(cardData?.billingAddress, profileName, phoneNumber);

            addressHelper.handleBillingAddressUpdate(this.billingAddress);
        } else {
            sessionStorage.setItem(SESSION_KEY_FASTLANE_CARD, false);
            fastlaneHelper.removeClass(this.phoneNumberEl, CSS_CLASS_D_NONE);
            fastlaneHelper.removeClass(this.billingAddressSelectorBlockEl, CSS_CLASS_D_NONE);
            fastlaneHelper.clearElementContent(this.walletContainerEl);

            await this.renderCardComponent();

            this.handleHostedFieldsOrSessionCardBlock();

            fastlaneHelper.addClass(this.cardContainerEl, CSS_CLASS_D_NONE);
            fastlaneHelper.addClass(this.walletContainerEl, CSS_CLASS_D_NONE);
            fastlaneHelper.addClass(this.cardWatermarkEl, CSS_CLASS_D_NONE);
            fastlaneHelper.addClass(this.cardWatermarkContainerEl, CSS_CLASS_D_NONE);
        }
    }

    /**
     * Handles payment data submit, updates necessary fields and data to submit payment
     */
    async submitGuestPayment() {
        const tokenizationObject = addressHelper.formatBillingAddress();

        if (!this.isPaymentUI && !this.isCardholderNameEnabled) {
            tokenizationObject.cardholderName = addressHelper.getCardholderName();
        }

        const { paymentSource, id } = await this.cardComponent.getPaymentToken(tokenizationObject);
        const cardData = paymentSource.card;

        fastlaneHelper.setPaymentData(cardData, id);

        if (this.isPaymentUI) {
            sessionCard.setSessionCardAttributes(cardData, id);
            sessionCard.setSessionCardData();
            sessionCard.showSessionCardBlock();

            addressHelper.handleBillingAddressUpdate(addressHelper.prepareAddressData(cardData?.billingAddress,
                cardData?.name,
                addressHelper.getBillingPhone()));
        }

        this.renderCardComponent();
    }

    /**
     * Updates value for element isNonFastlaneUsed to recognize Fastlane flow or not
     * @param {boolean} value - true/false value
     */
    updateIsNonFastlaneValue(value) {
        document.getElementById('isNonFastlaneUsed').value = value;
    }

    /**
     * Determines whether the one-click checkout flow is possible.
     * @param {Object} response - response object
     * @returns {boolean} - Whether one-click checkout is available:
     *  - 'true': one-click checkout is possible
     *  - 'false': one-click checkout is not possible
     */
    isOneClickPossible(response) {
        const isNonFastlaneUsed = fastlaneHelper.isNonFastlaneUsed();
        const isEmailChangeFlow = isNonFastlaneUsed && this.isCheckoutFromBeginning;

        return !response.error && fastlaneHelper.isFastlaneRoleUser() && (!isNonFastlaneUsed || isEmailChangeFlow);
    }
}

module.exports = Fastlane;
