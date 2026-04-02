'use strict';

module.exports = function () {
    var System = require('dw/system/System');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var ValidateCartRequest = require('*/cartridge/models/globale/checkout/requests/ValidateCartRequest');
    var ValidateCartResponse = require('*/cartridge/models/globale/checkout/responses/ValidateCartResponse');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var globaleWebStoreHelpers = require('*/cartridge/scripts/helpers/globaleWebStoreHelpers');

    // init response
    var responseObj = new ValidateCartResponse();

    try {
        // init request
        var requestObj = new ValidateCartRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        requestObj.isPayByLinkScenario = globaleHelpers.getUrlParametersValue(requestObj.payload.UrlParameters, globaleHelpers.customAttr.order.geIsOrderCreatedPayByLinkScenario) || false;

        // validate payload
        requestObj.validate({
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            Products: { required: true },
            UrlParameters: { required: true }
        });
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccDoWebStoreValidation, System.instanceType !== System.PRODUCTION_SYSTEM, 'boolean')) {
            var geWebStoreUUID = globaleHelpers.getUrlParametersValue(requestObj.payload.UrlParameters, globaleHelpers.preferenceKeys.geWebStoreUUID);
            globaleWebStoreHelpers.validateWebStore(geWebStoreUUID);
        }

        // create action handler
        var ValidateCartAction = require('*/cartridge/models/globale/checkout/actions/ValidateCartAction');
        var actionHandler = new ValidateCartAction(requestObj, responseObj);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_BASKET_VALIDATION: {0}', logger.message(e));
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);

        if (globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geEnableCartValidationErrors)) {
            // 1 - invalid cart content error
            // 2 - invalid email error
            // 3 - generic error
            responseObj.errorCode = responseObj.errorCode || '3';
        }
    }

    return responseObj.getPayload();
};
