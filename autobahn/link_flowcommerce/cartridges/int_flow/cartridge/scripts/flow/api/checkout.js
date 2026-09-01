'use strict';

var actions = require('*/cartridge/scripts/flow/api/actions');

/**
 * Default Resolver of a Flow API call
 * @param {Object} result - The result object of the service call.
 * @returns {Object} Mirrors back the incoming Object
 */
function defaultResolver(result) {
    return result || null;
}

/**
 * Class that handles the Payment Api Requests
 * @param {Function} makeRequest - function that performs a Flow Api request
 * @constructor
 */
function CheckoutApi(makeRequest) {
    this.makeRequest = makeRequest;
}

/**
 * Creates the Flow Checkout Object
 * @param {OrderFormModel} orderFormModel - Flow Order Form Model
 * @param {string} organization - Flow Organization Id
 * @param {Object} experience - Flow Experience
 * @param {string} confirmationUrl - Url to redirect to after order is placed
 * @returns {string} Id of the checkout object created
 */
CheckoutApi.prototype.createCheckout = function (orderFormModel, organization, experience, confirmationUrl) {
    var URLUtils = require('dw/web/URLUtils');

    var checkout;

    var body = {
        organization: organization,
        order: orderFormModel,
        urls: {
            continue_shopping: URLUtils.https('Cart-Show').toString(),
            confirmation: confirmationUrl,
            invalid_checkout: URLUtils.https('Flow-InvalidCheckout').toString()
        },
        order_parameters: {
            experience: experience.id
        }
    };

    checkout = this.makeRequest(actions.createCheckout, null, body, defaultResolver);

    return checkout ? checkout.id : null;
};

module.exports = CheckoutApi;
