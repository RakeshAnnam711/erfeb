'use strict';

const PayPalBaseModel = require('./payPalBase');
const helper = require('../../helpers/helper');

let that;

const paypalButtonsRegistry = new Map();

/**
 * Subscribes to PayPal events once
 */
const subscribePaypalEventsOnce = (() => {
    let subscribed = false;

    return (updateAmount) => {
        if (subscribed) {
            return;
        }

        $('body')
            .on('cart:update', updateAmount)
            .on('count:update', updateAmount)
            .on('promotion:success', updateAmount)
            .on('product:afterAttributeSelect', updateAmount)
            .on('cart:shippingMethodSelected', updateAmount);

        subscribed = true;
    };
})();

/**
 * Updates the PayPal button message amount based on the cart amount
 * @param {Object} event The event object
 * @param {Object} params The parameters object
 */
const updateAmount = (event, params) => {
    const buttonUniqueIds = [];

    if (params.container?.length > 0) {
        let container = params.container[0];

        if (container.classList.contains('product-quickview')) {
            container = container.parentElement.nextElementSibling;
        }

        buttonUniqueIds.push(container.querySelector('[data-pp-uuid]').dataset.ppUuid);
    } else {
        document.querySelectorAll('.cart [data-pp-uuid]').forEach((button) => {
            buttonUniqueIds.push(button.dataset.ppUuid);
        });
    }

    buttonUniqueIds.forEach((ppUuid) => {
        const registry = paypalButtonsRegistry.get(ppUuid);

        if (!registry) {
            return;
        }

        registry.message.amount = event.type === 'product:afterAttributeSelect'
            ? helper.getProductPrice(params.data.product)
            : helper.getPageAmount(helper.getPageType());

        registry.button.updateProps({ message: registry.message });
    });
};

/**
 * Updates the PayPal button message amount based on the cart amount
 */
function updatePayPalButtonMessagesAmount() {
    if (!this.paypalBtnResult) {
        return;
    }

    const buttonMessageStyle = helper.getPaypalButtonMessageStyle(this.payPalBtnContainerEl);

    if (buttonMessageStyle) {
        const buttonMessage = buttonMessageStyle.product ?? buttonMessageStyle;

        paypalButtonsRegistry.set(this.payPalBtnContainerEl.dataset.ppUuid, {
            button: this.paypalBtnResult,
            message: buttonMessage
        });

        if (document.querySelectorAll('.bundle-items').length) {
            const RADIX = 10;
            const FRACTION_DIGITS = 2;

            const pageType = helper.getPageType();

            document.querySelectorAll('.quantity-select').forEach(quantityEl => {
                quantityEl.addEventListener('change', (event) => {
                    event.preventDefault();

                    const quantity = parseInt(event.target.value, RADIX);

                    buttonMessage.amount = (helper.getPageAmount(pageType) * quantity).toFixed(FRACTION_DIGITS);

                    this.paypalBtnResult.updateProps({ message: buttonMessage });
                });
            });
        }

        subscribePaypalEventsOnce(updateAmount);
    }
}

/**
 * Returns all eligible funding sources except Venmo and PayPal
 * @returns {array} Array of funding sources
 */
function getEligibleFundingSources() {
    const fundingSources = this.sdk.getFundingSources().filter(fs => this.sdk.Buttons({
        fundingSource: fs
    }).isEligible());

    const excludedSources = [this.sdk.FUNDING.PAYPAL, this.sdk.FUNDING.VENMO];

    return fundingSources.filter(fundingSource => !excludedSources.includes(fundingSource));
}

/**
 * Initiates a PayPalButtonExpress model (pvp, pdp, cart, mini-cart)
 * @param {string} payPalBtnSelector A container class where PayPal button will be initiated
 */
function PayPalExpressModel(payPalBtnSelector) {
    PayPalBaseModel.call(this, payPalBtnSelector);

    // This is used for handling shipping address and options
    this.shippingAddress = null;
    this.validationResponse = null;
    this.isCheckoutPage = false;
    this.buttonsToRender = helper.tryParseJSON(this.payPalBtnContainerEl.dataset.buttonsToRender);

    that = this;
}

PayPalExpressModel.prototype = Object.create(PayPalBaseModel.prototype);

/**
 * Process the generic (not Ba) Paypal button flow (cart, pdp, mini-cart)
 */
PayPalExpressModel.prototype.processGenericBtnFlow = function() {
    helper.streamlinedCheckout.call(that, {})
        .catch((error) => {
            this.loader.hide();

            const isCartPage = this.payPalBtnSelector === '.js-paypal-button-on-cart-page';
            const isProductPage = this.payPalBtnSelector.includes('.js-paypal-button-on-product-page');

            if (helper.handleValidationAddressResult(error)) {
                if (isProductPage) {
                    helper.removeAllProductsFromCart();
                }
            } else if (isProductPage) {
                helper.removeAllProductsFromCart();

                PayPalExpressModel.prototype.onError.call(this, error);
            } else if (isCartPage) {
                this.onError(error);
            }
        });
};

/**
 * Hides loader on PayPal widget closing without errors
 * Is used with adjacent instances (cart, pdp)
 */
PayPalExpressModel.prototype.onCancel = () => {
    that.loader.hide();
};

/**
 * Initializes a button for a specific funding source
 * @param {string} fundingSource - PayPal funding source
 * @param {boolean} [isButtonMessageRendered=false] - Whether button message was already rendered
 * @returns {Object} Button initialization result
 */
PayPalExpressModel.prototype.initButtonByFunding = function(fundingSource, isButtonMessageRendered = false) {
    if (!this.sdk.isFundingEligible(fundingSource)) {
        return null;
    }

    const isPayPal = fundingSource === this.sdk.FUNDING.PAYPAL;
    const buttonProperties = isPayPal ? this.createBtnGeneralOption() : this.savedButtonProperties;

    this.setPayPalButtonColor(buttonProperties, fundingSource);

    if (isPayPal) {
        this.savedButtonProperties = buttonProperties;
    } else if (isButtonMessageRendered) {
        buttonProperties.message = null;
    }

    const btnInitResult = this.sdk.Buttons(Object.assign(buttonProperties, { fundingSource }));

    this.defineAction(btnInitResult, isPayPal);

    return btnInitResult.isEligible() ? btnInitResult : null;
};

/**
 * Initiates all eligible buttons in the correct order: PayPal -> Venmo -> Other buttons
 */
PayPalExpressModel.prototype.initEligibleButtons = function() {
    if (!this.buttonsToRender.paypal) {
        return;
    }

    let isButtonMessageRendered = false;

    // 1. Initialize PayPal button first
    const paypalBtnResult = this.initButtonByFunding(this.sdk.FUNDING.PAYPAL, isButtonMessageRendered);

    if (paypalBtnResult) {
        this.paypalBtnResult = paypalBtnResult;
        isButtonMessageRendered = true;
    }

    // 2. Initialize Venmo button second
    if (this.sdk.isFundingEligible(this.sdk.FUNDING.VENMO) && this.buttonsToRender.venmo) {
        this.payPalBtnContainerEl.dataset.funding = this.sdk.FUNDING.VENMO;

        const venmoButtonProperties = this.createBtnGeneralOption();

        this.initBtnByFundingSource(this.sdk.FUNDING.VENMO, venmoButtonProperties);
    }

    // 3. Initialize other eligible buttons
    const eligibleFundingSources = getEligibleFundingSources.call(this);

    if (eligibleFundingSources.length && this.savedButtonProperties) {
        eligibleFundingSources.forEach(fundingSource => {
            const btnResult = this.initButtonByFunding(fundingSource, isButtonMessageRendered);

            if (btnResult) {
                isButtonMessageRendered = true;
            }
        });
    }
};

/**
 * Initiates a Paypal button on express checkout page (Cart, mini-cart, pdp)
 * Is used with adjacent instances (cart, pdp, pvp)
 */
PayPalExpressModel.prototype.initPayPalButton = function() {
    if (!this.buttonsToRender) {
        return;
    }

    this.loader.show();

    this.sdk = window.paypalSdkMiniCart || window.paypal;

    this.initEligibleButtons();

    updatePayPalButtonMessagesAmount.call(this);

    this.loader.hide();
};

module.exports = PayPalExpressModel;
