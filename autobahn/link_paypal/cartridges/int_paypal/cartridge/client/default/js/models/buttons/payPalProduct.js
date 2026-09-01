'use strict';

const PayPalExpressModel = require('./payPalExpress');
const helper = require('../../helpers/helper');

/**
 * Initiates a PayPalButtonProduct model
 * @param {string} payPalBtnSelector A container class where PayPal button will be initiated
 */
function PayPalProductModel(payPalBtnSelector) {
    PayPalExpressModel.call(this, payPalBtnSelector);
}

PayPalProductModel.prototype = Object.create(PayPalExpressModel.prototype);

/**
 * Adds a product to the basket
 * Inherits functionality from base model
 *
 * @param {string} selector PayPal button container selector
 * @returns {Object} With purchase units, payer and application context
 */
PayPalProductModel.prototype.createOrder = function(selector) {
    helper.addProductToCart(selector);

    return PayPalExpressModel.prototype.createOrder.call();
};

/**
 * Removes a product from the basket and relocates to the Cart page
 * Inherits functionality from base model
 * @param {Object} error - An error object
 */
PayPalProductModel.prototype.onError = function(error) {
    helper.removeAllProductsFromCart();

    window.location.href = window.paypalUrls.cartPage;

    PayPalExpressModel.prototype.onError.call(this, error);
};

/**
 * Removes a product from the basket and relocates to the Cart page
 * Inherits functionality from base model
 */
PayPalProductModel.prototype.onCancel = function() {
    helper.removeAllProductsFromCart();

    PayPalExpressModel.prototype.onCancel.call();
};

module.exports = PayPalProductModel;
