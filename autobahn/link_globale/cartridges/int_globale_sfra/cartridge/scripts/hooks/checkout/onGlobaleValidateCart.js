/* eslint-disable no-param-reassign */

'use strict';

exports.validateCart = function (validateCartPayload, isPayByLinkScenario) {
    /**
     * In case if the logic should be customized, do not override the validateCartHelpers.js
     * in the int_globale, instead put the custom logic to the hook handler directly
     */

    var validateCartHelpers = require('*/cartridge/scripts/helpers/validateCartHelpers');
    return isPayByLinkScenario ? validateCartHelpers.validateCartPayByLink(validateCartPayload) : validateCartHelpers.validateCart(validateCartPayload);
};
