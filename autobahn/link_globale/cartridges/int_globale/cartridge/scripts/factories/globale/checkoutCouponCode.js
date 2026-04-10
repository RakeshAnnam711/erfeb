'use strict';

/**
 * Returns JSON Payload Data sent from Global-e to SFCC
 * @throws {Error}
 * @returns {Object} - Request payload data
 */
function getPayloadData() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var payload = httpParameterMap.requestBodyAsString;

    logger.info('GLOBALE_CHECKOUT_COUPON: {0}', payload);

    if (!payload) {
        throw new Error('Empty payload.');
    }
    var payloadJson = JSON.parse(payload);
    if (!payloadJson) {
        throw new Error('Empty payload.');
    }

    return payloadJson;
}

/**
 * Validates JSON payload
 * @throws {Error}
 * @param {Object} jsonPayload - JSON payload
 */
function validatePayload(jsonPayload) {
    var validator = require('*/cartridge/scripts/util/globale/validator');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var jsonSchema = {
        SessionId: { required: true },
        AuthToken: { required: true },
        CartId: { required: true },
        CartToken: { required: true },
        MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
        VoucherCode: { required: true },
        VoucherCodeToRemove: { required: true }
    };
    var result = validator.validate(jsonPayload, jsonSchema);
    if (!result.valid) {
        throw new Error('Invalid payload: ' + JSON.stringify(result));
    }
}

/**
 * Creates coupon strategy
 * @param {Object} jsonPayload - JSON payload
 * @returns {Object} - coupon strategy
 */
function createCouponStrategy(jsonPayload) {
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');

    var strategyClasses = {
        SessionBridgeStrategy: require('*/cartridge/models/globale/checkoutApplyCoupon/SessionBridgeStrategy'),
        JWTStrategy: require('*/cartridge/models/globale/checkoutApplyCoupon/JWTStrategy'),
        SessionBridgeStrategySCAPI: require('*/cartridge/models/globale/checkoutApplyCoupon/SessionBridgeStrategySCAPI'),
        JWTStrategySCAPI: require('*/cartridge/models/globale/checkoutApplyCoupon/JWTStrategySCAPI')
    };

    var scapiEnabled = globaleCAPIHelpers.isSCAPIEnabled();
    var strategy = null;
    var id = null;

    if (jsonPayload.SessionId !== null && scapiEnabled) {
        strategy = 'SessionBridgeStrategySCAPI';
        id = jsonPayload.SessionId;
    } else if (jsonPayload.AuthToken !== null && scapiEnabled) {
        strategy = 'JWTStrategySCAPI';
        id = jsonPayload.AuthToken;
    } else if (jsonPayload.SessionId !== null) {
        strategy = 'SessionBridgeStrategy';
        id = jsonPayload.SessionId;
    } else if (jsonPayload.AuthToken !== null) {
        strategy = 'JWTStrategy';
        id = jsonPayload.AuthToken;
    }

    if (!strategy) {
        throw new Error('Impossible to create coupon application strategy.');
    }

    return new strategyClasses[strategy](jsonPayload.CartId, id, jsonPayload);
}

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var result = {
        IsVoucherValid: false,
        VoucherType: 1,
        CartToken: null,
        VoucherValidationRestriction: [],
        ValidationFaliureMessage: ''
    };

    try {
        // parse payload
        var jsonPayload = getPayloadData();

        // validate JSON payload
        validatePayload(jsonPayload);
        result.CartToken = jsonPayload.CartToken;

        // apply/remove coupon code
        var couponStrategy = createCouponStrategy(jsonPayload);

        if (('VoucherCodeToRemove' in jsonPayload) && jsonPayload.VoucherCodeToRemove) {
            couponStrategy.remove(jsonPayload.VoucherCodeToRemove);
        } else {
            couponStrategy.apply(jsonPayload.VoucherCode);
        }

        result.IsVoucherValid = true;
    } catch (e) {
        logger.error('GLOBALE_CHECKOUT_COUPON: {0}', logger.message(e));
        result.IsVoucherValid = false;
        result.ValidationFaliureMessage = 'Coupon not valid or cannot be currently used. Please try again later or contact our customer services.';
    }

    return result;
};
