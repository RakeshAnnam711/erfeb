'use strict';

var base = require('base/checkout/customer');

var formHelpers = require('./formErrors');
var scrollAnimate = require('core/components/scrollAnimate');
var createErrorNotification = require('base/components/errorNotification');
var ERROR_SECTION = '.customer-error';

/**
 * Handle response from the server for valid or invalid form fields.
 * @param {Object} defer - the deferred object which will resolve on success or reject.
 * @param {Object} data - the response data with the invalid form fields or
 *  valid model data.
 */
function customerFormResponse(defer, data) {
    var parentForm = base.methods.isGuestFormActive() ? base.vars.GUEST_FORM : base.vars.REGISTERED_FORM;
    var formSelector = '.customer-section ' + parentForm;

    // highlight fields with errors
    if (data.error) {
        if (data.fieldErrors.length) {
            data.fieldErrors.forEach(function (error) {
                if (Object.keys(error).length) {
                    formHelpers.loadFormErrors(formSelector, error);
                }
            });
        }

        if (data.customerErrorMessage) {
            createErrorNotification(ERROR_SECTION, data.customerErrorMessage);
            scrollAnimate($(ERROR_SECTION));
        }

        if (data.fieldErrors.length || data.customerErrorMessage || (data.serverErrors && data.serverErrors.length)) {
            defer.reject(data);
        }

        if (data.cartError) {
            window.location.href = data.redirectUrl;
            defer.reject();
        }
    } else {
        // Populate the Address Summary
        if (base.methods.isGuestFormActive()) {
            data.order.shipping = [];
            $('body').trigger('checkout:updateCheckoutView', {
                order: data.order,
                customer: data.customer,
                csrfToken: data.csrfToken
            });
        } else {
            $('body').trigger('checkout:updateCheckoutView', {
                order: data.order,
                customer: data.customer,
                csrfToken: data.csrfToken
            });
        }
        defer.resolve(data);
        scrollAnimate($('.shipping-section'));
    }
}

base.methods.customerFormResponse = customerFormResponse;

module.exports = base;
