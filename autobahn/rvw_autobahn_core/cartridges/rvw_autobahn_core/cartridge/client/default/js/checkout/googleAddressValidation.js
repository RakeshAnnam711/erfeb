'use strict';

function normalizeAddressValue(value) {
    return (value || '').toString().trim().toUpperCase();
}

function normalizeZipCode(value) {
    return normalizeAddressValue(value).split('-')[0];
}

function getZipInput(form) {
    return $(form).find('.shippingZipCode');
}

function showZipError(form) {
    var zipInput = getZipInput(form);
    var message = zipInput.attr('data-zip-mismatch-message') || '';

    zipInput
        .addClass('is-invalid')
        .siblings('.invalid-feedback')
        .html(message);
}

function clearZipError(form) {
    getZipInput(form)
        .removeClass('is-invalid')
        .siblings('.invalid-feedback')
        .html('');
}

function scrollToZipError(form) {
    var zipInput = getZipInput(form);

    if (!zipInput.length) {
        return;
    }

    zipInput.focus();

    if (zipInput[0].scrollIntoView) {
        zipInput[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

function shouldValidateUSZipState(form) {
    var $form = $(form);
    var googleCountry = normalizeAddressValue($form.attr('data-google-selected-country'));
    var currentCountry = normalizeAddressValue($form.find('.shippingCountry').val());
    var currentState = normalizeAddressValue($form.find('.shippingState').val());
    var currentZip = normalizeZipCode($form.find('.shippingZipCode').val());

    return (googleCountry === 'US' || currentCountry === 'US') && !!currentState && !!currentZip;
}

function getGoogleStateFromAddressComponents(addressComponents) {
    var components = addressComponents || [];

    for (var i = 0; i < components.length; i++) {
        if (components[i].types.indexOf('administrative_area_level_1') !== -1) {
            return normalizeAddressValue(components[i].short_name);
        }
    }

    return '';
}

function getGooglePostalCodeFromAddressComponents(addressComponents) {
    var components = addressComponents || [];

    for (var i = 0; i < components.length; i++) {
        if (components[i].types.indexOf('postal_code') !== -1) {
            return normalizeZipCode(components[i].long_name);
        }
    }

    return '';
}

function getMatchingZipStateResult(results, zipCode, expectedState) {
    var normalizedZip = normalizeZipCode(zipCode);

    for (var i = 0; i < results.length; i++) {
        if (getGooglePostalCodeFromAddressComponents(results[i].address_components) === normalizedZip
            && getGoogleStateFromAddressComponents(results[i].address_components) === expectedState) {
            return results[i];
        }
    }

    return null;
}

function validateUSZipState(form, callback) {
    var $form = $(form);
    var googleState = normalizeAddressValue($form.attr('data-google-selected-state'));
    var currentState = normalizeAddressValue($form.find('.shippingState').val());
    var currentZip = normalizeZipCode($form.find('.shippingZipCode').val());
    var expectedState = googleState || currentState;

    if (!/^\d{5}$/.test(currentZip) || !currentState || currentState !== expectedState) {
        callback(false);
        return;
    }

    if (!window.google || !google.maps || !google.maps.Geocoder) {
        callback(true);
        return;
    }

    new google.maps.Geocoder().geocode({
        address: currentZip,
        componentRestrictions: {
            country: 'US'
        }
    }, function (results, status) {
        var matchingResult = status === 'OK'
            ? getMatchingZipStateResult(results || [], currentZip, expectedState)
            : null;

        callback(!!matchingResult);
    });
}

module.exports = {
    clearZipError: clearZipError,
    scrollToZipError: scrollToZipError,
    shouldValidateUSZipState: shouldValidateUSZipState,
    showZipError: showZipError,
    validateUSZipState: validateUSZipState
};
