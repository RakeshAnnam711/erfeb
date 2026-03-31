'use strict';

var processInclude = require('base/util');

/**
 * A list of base Files, leave these in order they are listed
 */
var baseFiles = {
    login: require('./login/login')
};

document.addEventListener('invalid', function (e) {
    const loginInputField = $(e.target);

    if (loginInputField.closest('form.login').length) {
        const loginInputId = loginInputField.attr('id');
        const loginSrErrorId = `sr-${loginInputId}-error`;
        loginInputField.attr('aria-describedby', loginSrErrorId);

        // Focus the first invalid field in the form
        const form = loginInputField.closest('form.login');
        const firstInvalidField = form.find(':invalid').first();
        firstInvalidField.trigger('focus');
    }
}, true);

$(document).ready(function () {
    Object.keys(baseFiles).forEach(function (key) {
        processInclude(baseFiles[key]);
    });
});

module.exports = {
    baseFiles
};
