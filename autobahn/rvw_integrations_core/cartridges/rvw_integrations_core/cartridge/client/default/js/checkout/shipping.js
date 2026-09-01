'use strict';

var baseShipping = require('core/checkout/shipping');

var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var bopisShipping = require('../integrations/bopis/checkout/shipping');
var cybersourceShipping = require('../integrations/cybersource/checkout/shipping');
var commercepaymentsShipping = require('../integrations/commercepayments/checkout/shipping');
var vertexShipping = require('../integrations/vertex/checkout/shipping');
var scrollToFieldError = require('core/components/scrollToFieldError');

var formHelpers = require('core/checkout/formErrors');

var scrollAnimate = require('core/components/scrollAnimate');

if(toggleObject.bopisCartridgeEnabled) {
    [bopisShipping].forEach(function (library) {
        Object.keys(library).forEach(function (key) {
            if (typeof library[key] === 'object') {
                baseShipping[key] = $.extend({}, baseShipping[key], library[key]);
            } else {
                baseShipping[key] = library[key];
            }
        });
    });
}
if(toggleObject.cybersourceCartridgeEnabled) {
    [cybersourceShipping].forEach(function (library) {
        Object.keys(library).forEach(function (key) {
            if (typeof library[key] === 'object') {
                baseShipping[key] = $.extend({}, baseShipping[key], library[key]);
            } else {
                baseShipping[key] = library[key];
            }
        });
    });
}
if (toggleObject.vertexCartridgeEnabled) {
    [vertexShipping].forEach(function (library) {
        Object.keys(library).forEach(function (key) {
            if (typeof library[key] === 'object') {
                baseShipping[key] = $.extend({}, baseShipping[key], library[key]);
            } else {
                baseShipping[key] = library[key];
            }
        });
    });
}
if (toggleObject.sfcommercepaymentsCartridgeEnabled) {
    [commercepaymentsShipping].forEach(function (library) {
        Object.keys(library).forEach(function (key) {
            if (typeof library[key] === 'object') {
                baseShipping[key] = $.extend({}, baseShipping[key], library[key]);
            } else {
                baseShipping[key] = library[key];
            }
        });
    });
}

/**
 * Handle response from the server for valid or invalid form fields.
 * @param {Object} defer - the deferred object which will resolve on success or reject.
 * @param {Object} data - the response data with the invalid form fields or
 *  valid model data.
 */
baseShipping.methods.shippingFormResponse = function shippingFormResponse(defer, data) {
    var isMultiShip = $('#checkout-main').hasClass('multi-ship');
    if (toggleObject.Vertex_isEnabled) {
        vertexShipping.methods.clearVertexErrors();
    }
    var formSelector = isMultiShip
        ? '.multi-shipping .active form'
        : '.single-shipping form';

    var wasHandled = false;
    // highlight fields with errors
    if (data.error) {
        if (data.fieldErrors.length) {
            data.fieldErrors.forEach(function (error) {
                if (Object.keys(error).length) {
                    formHelpers.loadFormErrors(formSelector, error);
                }
                scrollToFieldError(data);
            });
            defer.reject(data);
        }

        if (data.serverErrors && data.serverErrors.length) {
            $.each(data.serverErrors, function (index, element) {
                module.exports.methods.createErrorNotification(element);
            });

            defer.reject(data);
        }

        if (data.cartError) {
            window.location.href = data.redirectUrl;
            defer.reject();
        }
    }

    if(defer.state() === 'pending' && toggleObject.cybersourceCartridgeEnabled) {
        cybersourceShipping.methods.shippingFormResponseExtension(defer, data);
    }

    if (defer.state() === 'pending' && toggleObject.Vertex_isEnabled) {
        vertexShipping.methods.shippingFormResponseExtension(defer, data);
    }

    if (defer.state() === 'pending' && toggleObject.sfcommercepaymentsCartridgeEnabled) {
        commercepaymentsShipping.methods.shippingFormResponseExtension(defer, data);
    }

    if (defer.state() === 'pending') {
        $('body').trigger('checkout:updateCheckoutView', {
            order: data.order,
            customer: data.customer,
            options: data.options
        });
        defer.resolve(data);
        scrollAnimate($('.payment-form'));
    }
}

baseShipping.saveMultiShipInfo = function saveMultiShipInfo() {
    var baseObj = this;

    $('.btn-save-multi-ship').on('click', function (e) {
        e.preventDefault();

        // Save address to checkoutAddressBook
        var form = $(this).closest('form');
        var $rootEl = $(this).closest('.shipping-content');
        var data = $(form).serialize();
        var url = $(form).attr('action');

        if (toggleObject.bopisCartridgeEnabled) {
            var checkedShippingMethod = $('input[name=dwfrm_shipping_shippingAddress_shippingMethodID]:checked', form);
            var isStorePickUpMethod = checkedShippingMethod.attr('data-pickup');
            var storeId = $("input[name='storeId']", form).val();
            var errorMsg = 'Before you can continue to the next step, you must select a store.';

            if (isStorePickUpMethod === 'true' && (storeId === undefined)) {
                module.exports.methods.createErrorNotification(errorMsg);
                return;
            }
        }

        if (toggleObject.Vertex_isEnabled) {
            var vertexErrorBlock = $($rootEl).parent().find('.vertexError');
            var vertexSuggestionBlock = $($rootEl).parent().find('.vertexSuggestions');
            var vertexAddresses = $($rootEl).parent().find('#vertex-suggestion');
            vertexShipping.methods.clearVertexErrors();
        }

        $rootEl.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: data
        })
            .done(function (response) {
                formHelpers.clearPreviousErrors(form);
                if (response.error) {
                    if (toggleObject.Vertex_isEnabled && response.vertexError) {
                        vertexShipping.methods.showVertexErrors(response, vertexErrorBlock, vertexSuggestionBlock, vertexAddresses);
                    } else {
                        if (response.fieldErrors && response.fieldErrors.length) {
                            response.fieldErrors.forEach(function (error) {
                                if (Object.keys(error).length) {
                                    formHelpers.loadFormErrors(form, error);
                                }
                            });
                        } else if (response.serverErrors && response.serverErrors.length) {
                            $.each(response.serverErrors, function (index, element) {
                                module.exports.methods.createErrorNotification(element);
                            });
                        } else if (response.redirectUrl) {
                            window.location.href = response.redirectUrl;
                        }
                    }
                } else {
                    // Update UI from response
                    $('body').trigger('checkout:updateCheckoutView',
                        {
                            order: response.order,
                            customer: response.customer
                        }
                    );

                    if (baseObj.methods && baseObj.methods.viewMultishipAddress) {
                        baseObj.methods.viewMultishipAddress($rootEl);
                    } else {
                        viewMultishipAddress($rootEl);
                    }
                }

                if (response.order && response.order.shippable) {
                    $('button.submit-shipping').attr('disabled', null);
                }

                $rootEl.spinner().stop();
            })
            .fail(function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }

                $rootEl.spinner().stop();
            });

        return false;
    });
}

module.exports = baseShipping;
