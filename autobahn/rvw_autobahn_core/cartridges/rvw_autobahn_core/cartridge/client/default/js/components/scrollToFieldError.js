'use strict';

var scrollAnimate = require('core/components/scrollAnimate');

/**
 * Scrolls to and focuses the first invalid field in a form.
 * @param {Object} data - The response data containing a fieldErrors array.
 */
function scrollToFieldError(data) {
    if (Array.isArray(data.fieldErrors) && data.fieldErrors.length > 0) {
        const [firstErrorFieldKey] = Object.keys(data.fieldErrors[0]);
        const el = $(`[name="${firstErrorFieldKey}"]`);
        if (el.length) {
            scrollAnimate(el);
            el.focus();
        } else {
            console.warn(`No element found with name="${firstErrorFieldKey}"`);
        }
    }
}

module.exports = scrollToFieldError;
