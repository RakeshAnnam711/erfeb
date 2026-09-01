'use strict';

const Resource = require('dw/web/Resource');

/**
 * Validator for validating address fields
 * @param {Object} form - the target form
 */
function AddressValidator(form) {
    this.form = form;
    this.valid = true;
    this.fieldsToNotValidate = [];
}

/**
 * Sets fields to not validate
 * @param {Array} fieldsToNotValidate - Array of fields to not validate
 */
AddressValidator.prototype.setFieldsToNotValidate = function(fieldsToNotValidate) {
    if (Array.isArray(fieldsToNotValidate)) {
        this.fieldsToNotValidate = fieldsToNotValidate;
    }
};

/**
 * Checks if a value is an object
 * @returns {boolean} - Returns true if this is an object otherwise false
 */
AddressValidator.prototype.isObject = function() {
    return this.field !== null && typeof this.field === 'object';
};

/**
 * Gets the value of the field
 * @returns {string} - Returns the value of the field
 */
AddressValidator.prototype.getValue = function() {
    return this.field.htmlValue;
};

/**
 * Changes the field state to invalid
 * @returns {void}
 */
AddressValidator.prototype.invalidateField = function() {
    this.field.valid = false;
    this.field.error = Resource.msg('paypal.error.validate.field.failure', 'paypalerrors', null);

    if (this.valid && this.form.valid) {
        this.valid = false;
        this.form.valid = false;
    }
};

/**
 * The rule checks the selected value of the field from the available
 * @returns {void}
 */
AddressValidator.prototype.ruleCheckSelectedOption = function() {
    const self = this;

    if (this.field.options.length > 0) {
        const selectedOption = this.field.options.find(function(option) {
            return option.value === self.getValue();
        });

        if (!selectedOption) {
            this.invalidateField();
        }
    }
};

/**
 * Rule to check that the selected field is required
 * @returns {void}
 */
AddressValidator.prototype.ruleRequired = function() {
    const value = this.getValue();
    const isInvalid = value === '' || value.length === 0;

    if (isInvalid) {
        this.invalidateField();
    }
};

/**
 * Rule for checking for the maximum length of a value
 * @param {number} length - The maximum length of a value
 * @returns {void}
 */
AddressValidator.prototype.ruleMaxLength = function(length) {
    const isInvalid = this.getValue().length > length;

    if (isInvalid) {
        this.invalidateField();
    }
};

/**
 * Rule for checking for the minimum length of a value
 * @param {number} length - The minimum length of a value
 * @returns {void}
 */
AddressValidator.prototype.ruleMinLength = function(length) {
    const isInvalid = this.getValue().length < length;

    if (isInvalid) {
        this.invalidateField();
    }
};

/**
 * Rule to check if value matches regular expression
 * @param {string} regEx -The regular expression value
 * @returns {void}
 */
AddressValidator.prototype.ruleRegExr = function(regEx) {
    const pattern = new RegExp(regEx);
    const isInvalid = !pattern.test(this.getValue());

    if (isInvalid) {
        this.invalidateField();
    }
};

/**
 * Performs all rule checks
 * @returns {void}
 */
AddressValidator.prototype.processRules = function() {
    if (this.field.mandatory === true) {
        this.ruleRequired();
    }

    if (this.field.maxLength > 0) {
        this.ruleMaxLength(this.field.maxLength);
    }

    if (this.field.minLength > 0) {
        this.ruleMinLength(this.field.minLength);
    }

    if (this.field.regEx) {
        this.ruleRegExr(this.field.regEx);
    }

    if (this.field.options) {
        this.ruleCheckSelectedOption();
    }
};

/**
 * Validates and receives errors
 * @returns {Object} - an object that contain the error in the form
 */
AddressValidator.prototype.validate = function() {
    const self = this;

    try {
        Object.keys(this.form).forEach(function(fieldKey) {
            self.field = self.form[fieldKey];

            const isValidationRequired = !self.fieldsToNotValidate.includes(fieldKey);

            if (isValidationRequired && self.isObject() && self.field.formType === 'formGroup') {
                Object.keys(self.field).forEach(function(innerFieldKey) {
                    self.field = self.form[fieldKey][innerFieldKey];

                    if (self.isObject() && self.field.formType === 'formField') {
                        self.key = innerFieldKey;

                        self.processRules();
                    }
                });
            } else if (isValidationRequired && self.isObject() && self.field.formType === 'formField') {
                self.key = fieldKey;

                self.processRules();
            }
        });
    } catch (error) {
        throw new Error(error);
    }

    const formErrors = require('*/cartridge/scripts/formErrors');

    return formErrors.getFormErrors(this.form);
};

module.exports = AddressValidator;
