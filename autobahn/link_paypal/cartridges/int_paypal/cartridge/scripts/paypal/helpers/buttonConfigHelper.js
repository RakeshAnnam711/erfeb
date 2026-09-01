'use strict';

const preferences = require('*/cartridge/config/preferences');

const buttonConfigHelper = {};

/**
 * @param {string} currentFlow - the current page flow
 * @returns {Object} - return the object with necessary configuration for PayPal login
 */
buttonConfigHelper.createCwppButtonConfig = function(currentFlow) {
    let cwppButtonConfig = {};

    const constants = require('*/cartridge/config/constants');
    const availablePageFlows = [constants.PAGE_FLOW_LOGIN, constants.PAGE_FLOW_BILLING];

    if (availablePageFlows.includes(currentFlow)) {
        const sdkConfig = require('*/cartridge/config/sdkConfig');
        const paypalUrls = require('*/cartridge/config/urls');
        const paypalUtils = require('*/cartridge/scripts/paypal/utils');
        const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');

        const buttonConfig = preferences.cwppButtonStyles[currentFlow];

        cwppButtonConfig = {
            fullPage: 'true',
            responseType: 'code',
            containerid: 'js-cwpp-button',
            scopes: sdkConfig.cwppScopes,
            theme: buttonConfig.theme,
            buttonSize: buttonConfig.buttonSize,
            buttonShape: buttonConfig.buttonShape,
            buttonType: buttonConfig.buttonType,
            labelType: buttonConfig.buttonType,
            appid: paypalUtils.getClientId(),
            locale: basicHelpers.getLocaleWithHyphen(request.getLocale()),
            returnurl: paypalUrls.cwppUrl,
            authend: preferences.instanceType
        };
    }

    return cwppButtonConfig;
};

/**
 * Returns the object with messages for LPM's popup
 * @return {Object} - object with messages for LPM's popup
 */
buttonConfigHelper.getLPMSMessages = function() {
    const Resource = require('dw/web/Resource');

    return {
        closedPopupErrorMsg: Resource.msg('locale.payment.method.popup.closed.message', 'locale', null),
        paymentNotProceedMsg: Resource.msg('locale.payment.method.payment.not.proceed.message', 'locale', null)
    };
};

/**
 * Returns a filtered array of LPMS available for rendering on storefront
 * @returns {Array} An array
 */
buttonConfigHelper.getAvailableLPMSArray = function() {
    const disabledLpms = preferences.disableFundingList.filter(function(el) {
        return preferences.enabledLPMs.includes(el);
    });

    return preferences.enabledLPMs.filter(function(el) {
        return !disabledLpms.includes(el);
    });
};

/**
 * Returns the type of the instance(TEST/PRODUCTION)
 * @returns {string} The type of the instance
 */
buttonConfigHelper.getInstanceType = function() {
    const constants = require('*/cartridge/config/constants');

    const instanceObject = {
        'production': constants.PRODUCTION_SYSTEM_TYPE,
        'sandbox': constants.DEVELOPMENT_SYSTEM_TYPE
    };

    return instanceObject[preferences.instanceType];
};

module.exports = buttonConfigHelper;
