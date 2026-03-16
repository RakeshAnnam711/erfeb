'use strict';

var base = require('base/addressBook/addressBook');

var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var url;
var isDefault;

if (toggleObject.googlePlacesEnabled) {
    var googleApi = require('../thirdParty/googleMaps');
    var googleAutoComplete = require('../thirdParty/googleAutoComplete');

    base.initAutocomplete = googleApi().then(googleAutoComplete.initAutocomplete);

    // Prevent Google Place Address selection from submitting incomplete address form.
    $('.form-control.address-form').on('keypress', '.form-control.initComplete', function (e) {
        if (e.keyCode == 13) e.preventDefault();
    });
}

/**
 * Create an alert to display the error message
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.error-messaging').append(errorHtml);
}

base.removeAddress = function removeAddress() {
    $('.remove-address').on('click', function (e) {
        e.preventDefault();
        isDefault = $(this).data('default');
        if (isDefault) {
            url = $(this).data('url')
                + '?addressId='
                + $(this).data('id')
                + '&isDefault='
                + isDefault;
        } else {
            url = $(this).data('url') + '?addressId=' + $(this).data('id');
        }
        $('.product-to-remove').empty().text($(this).data('id'));
    });
};
base.removeAddressConfirmation = function removeAddressConfirmation() {
    $('.delete-confirmation-btn').click(function (e) {
        e.preventDefault();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('#uuid-' + data.UUID).remove();
                if (isDefault) {
                    var addressId = $('.card .address-heading').first().text();
                    var addressHeading = addressId + ' (' + data.defaultMsg + ')';
                    $('.card .address-heading').first().text(addressHeading);
                    $('.card .card-make-default-link').first().remove();
                    $('.remove-address').data('default', true);
                    if (data.message) {
                        var toInsert = '<div><h3>' +
                            data.message +
                            '</h3><div>';
                        $('.addressList').after(toInsert);
                    }
                }
                //only difference from base when initially added
                $('body').trigger('addressBook:removeAddress');
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                }
                $.spinner().stop();
            }
        });
    });
};

module.exports = base;
