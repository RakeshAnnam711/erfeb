'use strict';

/**
 * Returns an object represented shipments data for Digital Goods (Pay Now) flow:
 * currentBasketShipmentUUID - UUID of current shipment of basket,
 * onlinePickupMethodID - an id if online pickup shipping method that use for Digital Goods (Pay Now) flow
 * @returns {Object} An object represented shipments data for Digital Goods (Pay Now) flow
 */
const getDigitalGoodsData = () => {
    const payPalBtnEl = document.querySelector('.js-paypal-button-on-billing-form') || document.querySelector('.js-paypal-button-on-cart-page');

    return JSON.parse(payPalBtnEl.getAttribute('data-digital-goods'));
};

/**
 * ShipmentsDomModel constructor
 */
function ShipmentsDomModel() {
    const SessionStorageModel = require('../models/sessionStorage');
    const AlertHandlerModel = require('./alertHandler');

    // Checkout page
    this.shippingSummaryEl = document.querySelector('.shipping-summary');
    this.shippingAddressInfoEl = document.querySelector('.js-checkout-shipping-address-info');
    this.shippingMethodListEl = document.querySelector('.shipping-method-list');
    this.shippingSectionEl = document.querySelector('.shipping-section');

    // Cart page
    this.shippingMethodsEl = document.getElementById('shippingMethods');

    // General variables
    this.digitalGoodsData = getDigitalGoodsData();
    this.sessionStorageInstance = new SessionStorageModel();
    this.alertHandler = new AlertHandlerModel();
}

/**
 * Shows the shipping sections on billing page
 */
ShipmentsDomModel.prototype.setLastUsedShippingMethodId = function() {
    const checkedShippingMethodEl = document.querySelector('.shipping-method-list .form-check input[checked=checked]');

    // Sets a last used shipping method id only when one is selected,
    // otherwise the Online pickup shipping method id is used
    if (checkedShippingMethodEl) {
        this.sessionStorageInstance.setItem('last_used_shippig_method_id', checkedShippingMethodEl.value);
    }
};

ShipmentsDomModel.prototype.getLastUsedShippingMethodId = function() {
    return this.sessionStorageInstance.getItem('last_used_shippig_method_id');
};

/**
 * Shows the shipping sections on billing page
 */
ShipmentsDomModel.prototype.showShippingSectionsOnBillingPage = function() {
    if (this.shippingSummaryEl) {
        this.shippingSummaryEl.classList.remove('d-none');
    }

    if (this.shippingSectionEl) {
        this.shippingSectionEl.classList.remove('d-none');
    }
};

/**
 * Hides the shipping sections on billing page
 */
ShipmentsDomModel.prototype.hideShippingSectionsOnBillingPage = function() {
    if (this.shippingSummaryEl) {
        this.shippingSummaryEl.classList.add('d-none');
    }

    if (this.shippingSectionEl) {
        this.shippingSectionEl.classList.add('d-none');
    }
};

/**
 * Show the shipping address info message
 */
ShipmentsDomModel.prototype.showShippingAddressInfoMsg = function() {
    if (this.shippingAddressInfoEl) {
        this.shippingAddressInfoEl.classList.remove('d-none');
    }
};

/**
 * Hides the shipping address info message
 */
ShipmentsDomModel.prototype.hideShippingAddressInfoMsg = function() {
    if (this.shippingAddressInfoEl) {
        this.shippingAddressInfoEl.classList.add('d-none');
    }
};

/**
 * Sets online pickup shipping method on Billing page during Digital Goods (Pay Now) flow
 */
ShipmentsDomModel.prototype.setOnlinePickUpShippingMethod = function() {
    const baseShipping = require('base/checkout/shipping').methods;
    const baseAddress = require('base/checkout/address').methods;

    if (!this.shippingMethodListEl) {
        return;
    }

    const shippingFormEl = this.shippingMethodListEl.closest('form');
    const urlParams = baseAddress.getAddressFieldsFromUI(shippingFormEl);

    // Does Ajax call to select shipping method
    baseShipping.selectShippingMethodAjax(this.shippingMethodListEl.getAttribute('data-select-shipping-method-url'),
        Object.assign({
            shipmentUUID: this.digitalGoodsData.currentBasketShipmentUUID,
            methodID: this.digitalGoodsData.onlinePickupMethodID
        }, urlParams),
        this.shippingMethodListEl);
};

module.exports = ShipmentsDomModel;
