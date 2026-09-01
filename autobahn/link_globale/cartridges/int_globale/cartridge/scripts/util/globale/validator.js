/* eslint-disable no-underscore-dangle */

'use strict';

/**
 * Represents abstract rule
 * @constructor
 * @param {Object} ruleConfig - rule configuration
 */
function AbstractRule(ruleConfig) {
    this._ruleConfig = ruleConfig;
    this._valid = true;
    this._error = null;
}

/**
 * Validates value
 * @abstract
 * @param {Object} value - value to validate
 * @returns {boolean} - validation result
 */
AbstractRule.prototype.validate = function (value) { // eslint-disable-line no-unused-vars
    throw new Error('validate function must be implemented by subclass!');
};

/**
 * Returns validation result
 * @returns {boolean} - validation result
 */
AbstractRule.prototype.isValid = function () { // eslint-disable-line no-unused-vars
    return this._valid;
};

/**
 * Returns validation error
 * @returns {boolean} - validation errors
 */
AbstractRule.prototype.getError = function () { // eslint-disable-line no-unused-vars
    return this._error;
};

/**
 * Represents RequiredRule validator
 * @constructor
 * @param {Object} ruleConfig - rule configuration
 */
function RequiredRule(ruleConfig) {
    AbstractRule.call(this, ruleConfig);
}

/* Inherits AbstarctField */
RequiredRule.prototype = Object.create(AbstractRule.prototype);

/**
 * Validates value
 * @param {Object} value - value to validate
 * @returns {boolean} - validation result
 */
RequiredRule.prototype.validate = function (value) {
    if (this._ruleConfig && value === undefined) {
        this._valid = false;
        this._error = 'The value is not provided.';
    }

    return this._valid;
};

/**
 * Represents InRule validator
 * @constructor
 * @param {Object} ruleConfig - rule configuration
 */
function InRule(ruleConfig) {
    AbstractRule.call(this, ruleConfig);
}

/* Inherits AbstarctField */
InRule.prototype = Object.create(AbstractRule.prototype);

/**
 * Validates value
 * @param {Object} value - value to validate
 * @returns {boolean} - validation result
 */
InRule.prototype.validate = function (value) {
    if (this._ruleConfig && this._ruleConfig.length > 0 && this._ruleConfig.indexOf(value) === -1) {
        this._valid = false;
        this._error = 'The value is not allowed.';
    }

    return this._valid;
};

/**
 * Represents EqualsRule validator
 * @constructor
 * @param {Object} ruleConfig - rule configuration
 */
function EqualsRule(ruleConfig) {
    AbstractRule.call(this, ruleConfig);
}

/* Inherits AbstarctField */
EqualsRule.prototype = Object.create(AbstractRule.prototype);

/**
 * Validates value
 * @param {Object} value - value to validate
 * @returns {boolean} - validation result
 */
EqualsRule.prototype.validate = function (value) {
    var currentValue = value;
    var expectedValue = (typeof (this._ruleConfig) === 'object') ? this._ruleConfig.value : this._ruleConfig;
    var caseSensitive = (typeof (this._ruleConfig) === 'object' && ('caseSensitive' in this._ruleConfig)) ? this._ruleConfig.caseSensitive : true;

    if (caseSensitive === false) {
        currentValue = currentValue.toLowerCase();
        expectedValue = expectedValue.toLowerCase();
    }

    if (expectedValue !== currentValue) {
        this._valid = false;
        this._error = 'The value does not match the expected one.';
    }

    return this._valid;
};

/**
 * Represents InRule validator
 * @constructor
 * @param {Object} ruleConfig - rule configuration
 */
function ContainsRule(ruleConfig) {
    AbstractRule.call(this, ruleConfig);
}

/* Inherits AbstarctField */
ContainsRule.prototype = Object.create(AbstractRule.prototype);

/**
 * Validates value
 * @param {Object} value - value to validate
 * @returns {boolean} - validation result
 */
ContainsRule.prototype.validate = function (value) {
    if (value && value.length > 0 && value.indexOf(this._ruleConfig) === -1) {
        this._valid = false;
        this._error = 'The value is not exist.';
    }

    return this._valid;
};

/**
 * Creates rule validator instance
 * @param {string} ruleName - rule name
 * @param {Object} ruleConfig  - rule config
 * @returns {AbstractRule} - rule validator instance
 */
function createValidationRule(ruleName, ruleConfig) {
    var validator = null;
    switch (ruleName) {
        case 'required':
            validator = new RequiredRule(ruleConfig);
            break;
        case 'in':
            validator = new InRule(ruleConfig);
            break;
        case 'equals':
            validator = new EqualsRule(ruleConfig);
            break;
        case 'contains':
            validator = new ContainsRule(ruleConfig);
            break;
        default:
            validator = {
                isValid: function () {
                    return false;
                },
                getError: function () {
                    return 'Validator does not exists.';
                }
            };
    }
    return validator;
}

/**
 * Validates object against JSON schema
 * @param {Object} obj - object to validate
 * @param {Object} schema - JSON validation schema
 * @returns {Object} - validation result
 * @example
 * JSON schema (supports nested properties):
 * { propA: { required: true, in: ['A', 'AA'] } } - property "propA" should exist
 *      and it's value is "A" or "AA"
 * { 'propA.propB': { required: true, in: ['B', 'BB'] } } - property "propB" should exist in the object "propA"
 *      and it's value is "A" or "AA"
 */
function validate(obj, schema) {
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    var result = {
        valid: true,
        errors: {}
    };

    Object.keys(schema).forEach(function (prop) {
        var value = objectUtils.getValueByPath(obj, prop, undefined);
        var rules = schema[prop];

        Object.keys(rules).forEach(function (ruleName) {
            var validator = createValidationRule(ruleName, rules[ruleName]);
            validator.validate(value);
            if (!validator.validate(value)) {
                result.valid = false;
                if (!(prop in result.errors)) {
                    result.errors[prop] = [];
                }
                result.errors[prop].push(validator.getError());
            }
        });
    });

    return result;
}

module.exports = {
    validate: validate
};
