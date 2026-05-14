/* eslint no-param-reassign: ["error", { "props": false }] */

'use strict';

var config = require('./it.config');

/**
 * Configures basic request properties
 *
 * @param  {Object} cookieJar - Request cookie jar
 * @return {Object} Object containing request parameters
 */
function createBaseRequest(cookieJar) {
    return {
        url: '',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
}

/**
 * Configures add to cart request properties
 *
 * @param {Object} myRequest - Object containing request parameters
 * @param {string} variantID - ID of variant to add to cart
 * @param {integer} quantity - Quantity of item to add to cart
 * @return {Object} Object containing request parameters
 */
function setAddToCartRequest(myRequest, variantID, quantity) {
    myRequest.method = 'POST';
    myRequest.url = config.baseUrl + '/Cart-AddProduct';
    myRequest.form = {
        pid: variantID,
        quantity: quantity
    };
    return myRequest;
}

/**
 * Configures request to submit shipping information
 *
 * @param {Object} myRequest - Object containing request parameters
 * @return {Object} Object containing request parameters
 */
function setShippingInformationRequest(myRequest) {
    myRequest.method = 'POST';
    myRequest.url = config.baseUrl + '/CheckoutShippingServices-UpdateShippingMethodsList';
    myRequest.form = {
        stateCode: 'UT',
        postalCode: '84651',
        countryCode: 'US',
        city: 'Payson',
        address1: '123 Test Street'
    };
    return myRequest;
}

/**
 * Configures request to sumbit shipping information with Colorado address
 *
 * @param {Object} myRequest - Object containing request parameters
 * @return {Object} Object containing request parameters
 */
function setColoradoShippingInformationRequest(myRequest) {
    myRequest.method = 'POST';
    myRequest.url = config.baseUrl + '/CheckoutShippingServices-UpdateShippingMethodsList';
    myRequest.form = {
        stateCode: 'CO',
        postalCode: '80111',
        countryCode: 'US',
        city: 'Greenwood Village',
        address1: '123 Test Street'
    };
    return myRequest;
}

/**
 * Configures request to add coupon to basket
 *
 * @param {Object} myRequest - Object containing request parameters
 * @param {string} couponCode - Coupon code to add to cart
 * @param {string} csrfTokenName - Name of the csrf token
 * @param {string} csrfToken - CSRF Token
 * @return {Object} Object containing request parameters
 */
function setAddCouponRequest(myRequest, couponCode, csrfTokenName, csrfToken) {
    myRequest.method = 'GET';
    myRequest.form = null;
    myRequest.url = config.baseUrl + '/Cart-AddCoupon?couponCode=' + couponCode + '&' + csrfTokenName + '=' + csrfToken;
    return myRequest;
}

/**
 * Configures request to get CSRF token
 *
 * @param {Object} myRequest - Object containing request parameters
 * @return {Object} Object containing request parameters
 */
function setCSRFRequest(myRequest) {
    myRequest.method = 'POST';
    myRequest.form = null;
    myRequest.url = config.baseUrl + '/CSRF-Generate';
    return myRequest;
}

/**
 * Configures request to set the shipping method
 *
 * @param {Object} myRequest - Object containing request parameters
 * @param {string} shippingMethodID - ID of shipping method to select
 * @return {Object} Object containing request parameters
 */
function setShippingMethodRequest(myRequest, shippingMethodID) {
    myRequest.method = 'POST';
    myRequest.form = null;
    myRequest.url = config.baseUrl + '/Cart-SelectShippingMethod?methodID=' + shippingMethodID;
    return myRequest;
}

module.exports = {
    createBaseRequest: createBaseRequest,
    setAddToCartRequest: setAddToCartRequest,
    setShippingInformationRequest: setShippingInformationRequest,
    setAddCouponRequest: setAddCouponRequest,
    setCSRFRequest: setCSRFRequest,
    setShippingMethodRequest: setShippingMethodRequest,
    setColoradoShippingInformationRequest: setColoradoShippingInformationRequest
};
