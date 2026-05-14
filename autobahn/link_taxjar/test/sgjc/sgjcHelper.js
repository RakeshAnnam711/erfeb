/* eslint-env es6 */
/* global $, browser */

'use strict';

var assert = require('chai').assert;
var wdioConfig = require('./webdriver/wdio.conf');

/**
 * Close tracking consent modal if it exists
 *
 * @return {undefined}
 */
function handleTrackingConsent() {
    return $('.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.no-close.ui-dialog-buttons.ui-draggable .ui-dialog-buttonpane button.ui-button:first-of-type')
    .then((selected) => selected.isExisting())
    .then((exists) => {
        if (exists) {
            return $('.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.no-close.ui-dialog-buttons.ui-draggable')
            .then((selected) => selected.waitForDisplayed(5000))
            .then(() => $('.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.no-close.ui-dialog-buttons.ui-draggable .ui-dialog-buttonpane button.ui-button:first-of-type span.ui-button-text'))
            .then((selected) => selected.click())
            .then(() => $('.ui-widget-overlay.ui-front'))
            .then((selected) => selected.waitForDisplayed(5000, true));
        }
        return false;
    });
}

/**
 * Navigate to page
 *
 * @param  {string} relativeUrl - relative URL to navigate to
 * @return {undefined}
 */
function navigateToPage(relativeUrl) {
    return browser.url(wdioConfig.config.baseUrl + relativeUrl)
    .then(() => handleTrackingConsent());
}

/**
 * Set quanity of product to add to cart
 *
 * @param {integer} quantity - quantity of product to add
 * @return {undefined}
 */
function setQuantity(quantity) {
    return $('input#Quantity')
    .then(() => $('input#Quantity'))
    .then((selected) => selected.clearValue())
    .then(() => {
        return browser.waitUntil(() => {
            return browser.isAlertOpen();
        }, 10000);
    })
    .then(() => browser.dismissAlert())
    .then(() => $('input#Quantity'))
    .then((selected) => selected.addValue(quantity));
}

/**
 * Click add to cart button on product page
 *
 * @return {undefined}
 */
function clickAddToCart() {
    return $('button#add-to-cart')
    .then((selected) => selected.click());
}

/**
 * Navigate to checkout page
 *
 * @return {undefined}
 */
function navigateToCheckout() {
    var checkoutButton;
    return browser.url(wdioConfig.config.baseUrl + '/checkout')
    .then(() => handleTrackingConsent())
    .then(() => $('button[name="dwfrm_login_unregistered"]'))
    .then((selected) => {
        checkoutButton = selected;
        return selected.waitForDisplayed(5000);
    })
    .then(() => checkoutButton.click())
    .then(() => $('form.checkout-shipping'))
    .then((selected) => selected.waitForDisplayed(5000));
}

/**
 * Inputs shipping address information into shipping form
 *
 * @param  {Object} address - Shipping address
 * @return {undefined}
 */
function inputShippingAddress(address) {
    var shippingAddress = {};
    if (address) {
        shippingAddress = address;
    } else {
        shippingAddress = {
            city: 'Payson',
            state: 'UT',
            postal: '84651'
        };
    }
    return $('input#dwfrm_singleshipping_shippingAddress_addressFields_firstName')
    .then((selected) => selected.setValue('First'))
    .then(() => $('input#dwfrm_singleshipping_shippingAddress_addressFields_lastName'))
    .then((selected) => selected.setValue('Last'))
    .then(() => $('input#dwfrm_singleshipping_shippingAddress_addressFields_address1'))
    .then((selected) => selected.setValue('123 Test Street'))
    .then(() => $('input#dwfrm_singleshipping_shippingAddress_addressFields_city'))
    .then((selected) => selected.setValue(shippingAddress.city))
    .then(() => $('input#dwfrm_singleshipping_shippingAddress_addressFields_postal'))
    .then((selected) => selected.setValue(shippingAddress.postal))
    .then(() => $('input#dwfrm_singleshipping_shippingAddress_addressFields_phone'))
    .then((selected) => selected.setValue('333-333-3333'))
    .then(() => $('select#dwfrm_singleshipping_shippingAddress_addressFields_states_state'))
    .then((selected) => selected.selectByAttribute('value', shippingAddress.state));
}

/**
 * Navigates through to billing section of checkout
 *
 * @return {undefined}
 */
function continueToBilling() {
    return $('button[name="dwfrm_singleshipping_shippingAddress_save"]')
    .then((selected) => selected.click());
}

/**
 * Scrapes basket data (totals) from cart page
 *
 * @return {Object} - Object containing totals from cart
 */
function getCartData() {
    var cartData = {};
    return $('tr.order-subtotal td:last-child')
    .then((selected) => selected.getText())
    .then((subtotal) => {
        cartData.subtotal = subtotal;
        return $('tr.order-shipping td:last-child');
    })
    .then((selected) => selected.getText())
    .then((shipping) => {
        cartData.shipping = shipping;
        return $('tr.order-sales-tax td:last-child');
    })
    .then((selected) => selected.getText())
    .then((tax) => {
        cartData.tax = tax;
        return $('tr.order-total td:last-child');
    })
    .then((selected) => selected.getText())
    .then((total) => {
        cartData.total = total;
        return cartData;
    });
}

/**
 * Adds specified product to basket
 *
 * @param {Object} product - Object containing product data to add to cart
 * @return {undefined}
 */
function addProductToCart(product) {
    var productURL = '/' + product.pid + '.html';
    return navigateToPage(productURL)
    .then(() => {
        if (product.quantity > 1) {
            return setQuantity(product.quantity);
        }
        return false;
    })
    .then(() => {
        if (product.options) {
            return $('.product-options ul li:first-child select')
            .then((selected) => selected.selectByIndex(product.options.index));
        }
        return false;
    })
    .then(() => clickAddToCart());
}

/**
 * Runs a test adding a product to the basket, and testing the calculated tax values
 *
 * @param  {Object} data - Object containing configuration for test
 * @return {undefined}
 */
function basicProductTaxTest(data) {
    return addProductToCart(data.product)
    .then(() => navigateToCheckout())
    .then(() => inputShippingAddress(data.address))
    .then(() => continueToBilling())
    .then(() => getCartData())
    .then((cartData) => {
        if (data.subtotal) {
            assert.equal(cartData.subtotal, data.subtotal);
        }
        if (data.shipping) {
            assert.equal(cartData.shipping, data.shipping);
        }
        if (data.total) {
            assert.equal(cartData.total, data.total);
        }
        if (data.tax) {
            assert.equal(cartData.tax, data.tax);
        }
    });
}


module.exports = {
    basicProductTaxTest: basicProductTaxTest
};
