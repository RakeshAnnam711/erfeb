'use strict';

var scrollAnimate = require('core/components/scrollAnimate');

/**
 * Display error messages and highlight form fields with errors.
 * @param {string} parentSelector - the form which contains the fields
 * @param {Object} fieldErrors - the fields with errors
 */
function loadFormErrors(parentSelector, fieldErrors) { // eslint-disable-line
    // Display error messages and highlight form fields with errors.
    $.each(fieldErrors, function (attr) {
        $('*[name=' + attr + ']', parentSelector)
            .addClass('is-invalid')
            .siblings('.invalid-feedback')
            .html(fieldErrors[attr]);
    });
    // Animate to top of form that has errors
    scrollAnimate($(parentSelector));
}

/**
 * Clear the form errors.
 * @param {string} parentSelector - the parent form selector.
 */
function clearPreviousErrors(parentSelector) {
    //default clientSideValidation.js will remove .is-invalid only for html5 errors
    //let our manual call here clear all messaging on .invalid-feedback always
    $(parentSelector).find('.form-control.is-invalid').removeClass('is-invalid');
    $(parentSelector).find('.invalid-feedback').html('');
    $('.error-message').hide();
}

module.exports = {
    loadFormErrors: loadFormErrors,
    clearPreviousErrors: clearPreviousErrors
};
