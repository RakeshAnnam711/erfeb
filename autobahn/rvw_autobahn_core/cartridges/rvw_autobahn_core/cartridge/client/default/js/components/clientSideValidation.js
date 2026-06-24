'use strict';
var base = require('base/components/clientSideValidation');
var baseSubmit = base.submit;

base.invalid = function () {
    $('form input, form textarea, form select').on('invalid', function (e) {
        e.preventDefault();
        this.setCustomValidity('');

        if (!this?.validity?.valid) {
            var validationMessage = this.validationMessage;
            var $this = $(this);

            $this.addClass('is-invalid');
            if (this.validity.patternMismatch && $this.data('pattern-mismatch')) {
                validationMessage = $this.data('pattern-mismatch');
            }
            if ((this.validity.rangeOverflow || this.validity.rangeUnderflow) &&
                $this.data('range-error')) {
                validationMessage = $this.data('range-error');
            }
            if ((this.validity.tooLong || this.validity.tooShort) &&
                $this.data('range-error')) {
                validationMessage = $this.data('range-error');
            }
            if (this.validity.valueMissing && $this.data('missing-error')) {
                validationMessage = $this.data('missing-error');
            }
            $this.parents('.form-group').find('.invalid-feedback')
                .text(validationMessage);
        }
    });
}

/**
 * Validate whole form. Requires `this` to be set to form object
 * @param {jQuery.event} event - Event to be canceled if form is invalid.
 * @returns {boolean} - Flag to indicate if form is valid
 */
base.validateForm = function(event) {
    var valid = true,
        $this = $(this);

    if (!this?.checkValidity?.()) {
        valid = false;

        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }

        if (!this?.validity?.valid) {
            if ($this.is('input, select')) {
                // handle where 'this' is a form field
                $this.trigger('invalid', this.validity);
            } else {
                $this.find('input, select').each(function (el) {
                    // handle where 'this' is a form
                    $(el).trigger('invalid', this.validity);
                });
            }
        }
    }

    return valid;
}
/**
 * Password Messaging Helper Functions
 */
var baseInitialize = base.initialize;
base.initialize = function() {
    baseInitialize?.apply(this, arguments);

    $('form:has(input[type^=password])').each(function (i, form) {
        var $form = $(form),
            $passwordFields = $form.find('input:password'),
            $passwordInput = $form.find('.password-validate'),
            $passwordHelper = $form.find('.password-validation-helper li'), //multiple
            $showPassword = $form.find("#show-password");

        // change the border of the input field to alert the user of acceptance|error
        $passwordInput.on('validatepassword', function (e) {
            if ($passwordHelper.hasClass("error") || $passwordHelper.hasClass("empty")) {
                $passwordInput
                    .removeClass("is-valid")
                    .addClass("is-invalid");
                $passwordHelper
                    .not(".valid")
                    .addClass("error")
                    .removeClass("empty");
            } else {
                $passwordInput
                    .addClass("is-valid")
                    .removeClass("is-invalid");
            }
        });

        $passwordInput.on("keyup", function (e) {
            var $this = $(this);
            var value = $this.val();

            // first check if the form is in error state, then re-eval
            if ($this.hasClass("is-invalid")) {
                // leave the "error" states until valid
                $passwordHelper.trigger('checkrequirement', [value, 'valid empty']);

                $this.trigger('validatepassword');
            } else{
                $passwordHelper.trigger('checkrequirement', [value, 'error valid empty']);
            };
        });

        // change input decoration when user leaves, attach event only once
        $passwordInput.one("change", function (e) {
            var $this = $(this);

            $this.on("blur", function (e) {
                $this.trigger('validatepassword');
            });
        });

        /**
         * Display validation messages and highlight
         * each one of the requirements for the password
         * @param {string} clearClasses - which classes to clear
         */
        $passwordHelper.on('checkrequirement', function (e, value, clearClasses) {
            var $this = $(this).removeClass(clearClasses).removeClass('valid error empty');
            var regex = new RegExp($this.data('val-regex'));

            if (regex.test(value)) {
                $this.addClass("valid");
            } else if (!regex.test(value) && $passwordInput.focus) {
                $this.addClass("empty error");
            } else {
                $this.addClass("error");
            }
        });


        //show password checkbox
        $showPassword.on('click', event => {
            var $checkbox = $(event.target);

            $passwordFields.each((index, element) => {
                $(element).attr('type', $checkbox.prop('checked') ? 'text' : 'password');
            });
        });
    });
};

function validateFormFix(form, event) {
    if (arguments.length === 1) {
        event = form;
        form = this;
    }

    base.validateForm.call(form, event || null);
}

base.functions.validateForm = validateFormFix;
base.submit = function () {
    var scope = this;

    if (baseSubmit) baseSubmit.apply(scope, arguments);

    $('form').on('validate', function (e) {
        return scope.functions.validateForm.call(this, e);
    });
}

module.exports = base;
