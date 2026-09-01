const { int_paypal: { constantsPath } } = require('../path.json');

const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const constants = proxyquire(constantsPath, {});

describe('constants', () => {
    it('response type should be object', () => {
        expect(constants).to.be.a('object');
    });

    it('response object should consist of property ACCESS_TOKEN', () => {
        expect(constants).has.property('ACCESS_TOKEN');
    });

    it('response object should consist of property PAYMENT_AUTHORIZATION_VOIDED', () => {
        expect(constants).has.property('PAYMENT_AUTHORIZATION_VOIDED');
    });

    it('response object should consist of property PAYMENT_CAPTURE_REFUNDED', () => {
        expect(constants).has.property('PAYMENT_CAPTURE_REFUNDED');
    });

    it('response object should consist of property PAYMENT_CAPTURE_COMPLETED', () => {
        expect(constants).has.property('PAYMENT_CAPTURE_COMPLETED');
    });

    it('response object should consist of property STATUS_SUCCESS', () => {
        expect(constants).has.property('STATUS_SUCCESS');
    });

    it('response object should consist of property METHOD_POST', () => {
        expect(constants).has.property('METHOD_POST');
    });

    it('response object should consist of property METHOD_GET', () => {
        expect(constants).has.property('METHOD_GET');
    });

    it('response object should consist of property PAYMENT_STATUS_REFUNDED', () => {
        expect(constants).has.property('PAYMENT_STATUS_REFUNDED');
    });

    it('response object should consist of property CONNECT_WITH_PAYPAL_CONSENT_DENIED', () => {
        expect(constants).has.property('CONNECT_WITH_PAYPAL_CONSENT_DENIED');
    });

    it('response object should consist of property ENDPOINT_ACCOUNT_SHOW', () => {
        expect(constants).has.property('ENDPOINT_ACCOUNT_SHOW');
    });

    it('response object should consist of property ENDPOINT_CHECKOUT_LOGIN', () => {
        expect(constants).has.property('ENDPOINT_CHECKOUT_LOGIN');
    });

    it('response object should consist of property PAYMENT_METHOD_ID_PAYPAL', () => {
        expect(constants).has.property('PAYMENT_METHOD_ID_PAYPAL');
    });

    it('response object should consist of property PAYMENT_METHOD_ID_VENMO', () => {
        expect(constants).has.property('PAYMENT_METHOD_ID_VENMO');
    });

    it('response object should consist of property PAYMENT_METHOD_ID_Debit_Credit_Card', () => {
        expect(constants).has.property('PAYMENT_METHOD_ID_Debit_Credit_Card');
    });

    it('response object should consist of property PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD', () => {
        expect(constants).has.property('PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD');
    });

    it('response object should consist of property PP_FUNDING_SOURCE_CARD', () => {
        expect(constants).has.property('PP_FUNDING_SOURCE_CARD');
    });

    it('response object should consist of property PP_DEBIT_CREDIT_PAYMENT_TYPE', () => {
        expect(constants).has.property('PP_DEBIT_CREDIT_PAYMENT_TYPE');
    });

    it('response object should consist of property LOGIN_PAYPAL', () => {
        expect(constants).has.property('LOGIN_PAYPAL');
    });

    it('response object should consist of property APMA_STAGE_COMPLETE', () => {
        expect(constants).has.property('APMA_STAGE_COMPLETE');
    });

    it('response object should consist of property APMA_STAGE_ADDRESS', () => {
        expect(constants).has.property('APMA_STAGE_ADDRESS');
    });

    it('response object should consist of property APMA_STAGE_ACCOUNT', () => {
        expect(constants).has.property('APMA_STAGE_ACCOUNT');
    });

    it('response object should consist of property FLASH_MESSAGE_SUCCESS', () => {
        expect(constants).has.property('FLASH_MESSAGE_SUCCESS');
    });

    it('response object should consist of property FLASH_MESSAGE_INFO', () => {
        expect(constants).has.property('FLASH_MESSAGE_INFO');
    });

    it('response object should consist of property FLASH_MESSAGE_DANGER', () => {
        expect(constants).has.property('FLASH_MESSAGE_DANGER');
    });

    it('response object should consist of property FLASH_MESSAGE_WARNING', () => {
        expect(constants).has.property('FLASH_MESSAGE_WARNING');
    });

    it('response object should consist of property ZERO_AMOUNT', () => {
        expect(constants).has.property('ZERO_AMOUNT');
    });

    it('response object should consist of property AUTHENTICATION_PAYPAL_PROVIDER_ID', () => {
        expect(constants).has.property('AUTHENTICATION_PAYPAL_PROVIDER_ID');
    });

    it('response object should consist of property NO_INSTRUCTION', () => {
        expect(constants).has.property('NO_INSTRUCTION');
    });

    it('response object should consist of property BILLING_ADDRESS_ID', () => {
        expect(constants).has.property('BILLING_ADDRESS_ID');
    });

    it('response object should consist of property SHIPPING_ADDRESS_ID', () => {
        expect(constants).has.property('SHIPPING_ADDRESS_ID');
    });

    it('response object should consist of property REGEXP_PHONE', () => {
        expect(constants).has.property('REGEXP_PHONE');
    });

    it('response object should consist of property REGEXP_EMAIL', () => {
        expect(constants).has.property('REGEXP_EMAIL');
    });

    it('response object should consist of property CREDIT_CARD_TAB', () => {
        expect(constants).has.property('CREDIT_CARD_TAB');
    });

    it('response object should consist of property PAYPAL_TAB', () => {
        expect(constants).has.property('PAYPAL_TAB');
    });

    it('response object should consist of property ACTIVE_TAB', () => {
        expect(constants).has.property('ACTIVE_TAB');
    });

    it('response object should consist of property UNKNOWN', () => {
        expect(constants).has.property('UNKNOWN');
    });

    it('response object should consist of property PAYPAL_FILE_NAME_PREFIX', () => {
        expect(constants).has.property('PAYPAL_FILE_NAME_PREFIX');
    });

    it('response object should consist of property PAYPAL_CATEGORY', () => {
        expect(constants).has.property('PAYPAL_CATEGORY');
    });

    it('response object should consist of property CREDIT_CARD_COMPLEX_BRAND_CODE', () => {
        expect(constants).has.property('CREDIT_CARD_COMPLEX_BRAND_CODE');
    });

    it('response object should consist of property CREDIT_CARD_SAVE_STATUS_VAULTED', () => {
        expect(constants).has.property('CREDIT_CARD_SAVE_STATUS_VAULTED');
    });

    it('response object should consist of property PAYPAL_ORDER_STATUS_COMPLETED', () => {
        expect(constants).has.property('PAYPAL_ORDER_STATUS_COMPLETED');
    });

    it('response object should consist of property CC_NUMBER_LIMIT_NUMBER_START', () => {
        expect(constants).has.property('CC_NUMBER_LIMIT_NUMBER_START');
    });

    it('response object should consist of property CC_NUMBER_LIMIT_NUMBER_END', () => {
        expect(constants).has.property('CC_NUMBER_LIMIT_NUMBER_END');
    });

    it('response object should consist of property CC_SAVE_LIMIT_UNLIMITED', () => {
        expect(constants).has.property('CC_SAVE_LIMIT_UNLIMITED');
    });

    it('response object should consist of property CC_3DS_AUTHENTICATION_REASON_SKIPPED_BY_BUYER', () => {
        expect(constants).has.property('CC_3DS_AUTHENTICATION_REASON_SKIPPED_BY_BUYER');
    });

    it('response object should consist of property CC_3DS_LIABILITY_SHIFT_STATUS_NO', () => {
        expect(constants).has.property('CC_3DS_LIABILITY_SHIFT_STATUS_NO');
    });

    it('response object should consist of property CC_3DS_LIABILITY_SHIFT_STATUS_UNKNOWN', () => {
        expect(constants).has.property('CC_3DS_LIABILITY_SHIFT_STATUS_UNKNOWN');
    });

    it('response object should consist of property CC_3DS_ALLOWED_ENROLLMENT_STATUS_YES', () => {
        expect(constants).has.property('CC_3DS_ALLOWED_ENROLLMENT_STATUS_YES');
    });

    it('response object should consist of property SCA_WHEN_REQUIRED', () => {
        expect(constants).has.property('SCA_WHEN_REQUIRED');
    });

    it('response object should consist of property SCA_ALWAYS', () => {
        expect(constants).has.property('SCA_ALWAYS');
    });

    it('response object should consist of property PAYMENT_METHOD_ID_APPLE_PAY', () => {
        expect(constants).has.property('PAYMENT_METHOD_ID_APPLE_PAY');
    });

    it('response object should consist of property AVAILABLE_PM_IDS', () => {
        expect(constants).has.property('AVAILABLE_PM_IDS');
    });

    it('response object should consist of property AVAILABLE_PM_IDS', () => {
        expect(constants).has.property('AVAILABLE_PM_IDS');
    });

    it('response object should consist of property APPLE_PAY_TOTAL_TYPE_FINAL', () => {
        expect(constants).has.property('APPLE_PAY_TOTAL_TYPE_FINAL');
    });

    it('response object should consist of property APPLE_PAY_TAB_IMAGE_ALT', () => {
        expect(constants).has.property('APPLE_PAY_TAB_IMAGE_ALT');
    });

    it('response object should consist of property PAGE_FLOW_CART', () => {
        expect(constants).has.property('PAGE_FLOW_CART');
    });

    it('response object should consist of property PAYMENT_STATUS_PARTIALLY_REFUNDED', () => {
        expect(constants).has.property('PAYMENT_STATUS_PARTIALLY_REFUNDED');
    });

    it('response object should consist of property ALLOWED_PROCESSORS_IDS', () => {
        expect(constants).has.property('ALLOWED_PROCESSORS_IDS');
    });

    it('response object should consist of property DISABLED', () => {
        expect(constants).has.property('DISABLED');
    });

    it('response object should consist of property PAYER_ACTION_REQUIRED', () => {
        expect(constants).has.property('PAYER_ACTION_REQUIRED');
    });

    it('response object should consist of property ADDRESS_FORM_FIELD_COUNTRY', () => {
        expect(constants).has.property('ADDRESS_FORM_FIELD_COUNTRY');
    });

    it('response object should consist of property ADDRESS_FORM_FIELD_STATE', () => {
        expect(constants).has.property('ADDRESS_FORM_FIELD_STATE');
    });

    it('response object should consist of property ADDRESS_FORM_FIELD_POSTAL_CODE', () => {
        expect(constants).has.property('ADDRESS_FORM_FIELD_POSTAL_CODE');
    });

    it('response object should consist of property PAYPAL_SHIPPING_ADDRESS_ERROR_CODE', () => {
        expect(constants).has.property('PAYPAL_SHIPPING_ADDRESS_ERROR_CODE');
    });

    it('response object should consist of property PAYPAL_SHIPPING_COUNTRY_ERROR_CODE', () => {
        expect(constants).has.property('PAYPAL_SHIPPING_COUNTRY_ERROR_CODE');
    });

    it('response object should consist of property PAYPAL_SHIPPING_STATE_ERROR_CODE', () => {
        expect(constants).has.property('PAYPAL_SHIPPING_STATE_ERROR_CODE');
    });

    it('response object should consist of property PAYPAL_SHIPPING_ZIP_ERROR_CODE', () => {
        expect(constants).has.property('PAYPAL_SHIPPING_ZIP_ERROR_CODE');
    });

    it('response object should consist of property PRODUCTION_SYSTEM_TYPE', () => {
        expect(constants).has.property('PRODUCTION_SYSTEM_TYPE');
    });

    it('response object should consist of property DEVELOPMENT_SYSTEM_TYPE', () => {
        expect(constants).has.property('DEVELOPMENT_SYSTEM_TYPE');
    });

    it('response object should consist of property BILLING_ADDRESS_SElECTOR_OPTION_EXISTING_SHIPMENTS', () => {
        expect(constants).has.property('BILLING_ADDRESS_SElECTOR_OPTION_EXISTING_SHIPMENTS');
    });

    it('response object should consist of property BILLING_ADDRESS_SElECTOR_OPTION_NEW', () => {
        expect(constants).has.property('BILLING_ADDRESS_SElECTOR_OPTION_NEW');
    });

    it('response object should consist of property GOOGLE_PAY_BUTTON_LOCATION', () => {
        expect(constants).has.property('GOOGLE_PAY_BUTTON_LOCATION');
    });

    it('response object should consist of property GOOGLE_PAY_ORDER_STATUS_PAYER_ACTION_REQUIRED', () => {
        expect(constants).has.property('GOOGLE_PAY_ORDER_STATUS_PAYER_ACTION_REQUIRED');
    });

    it('response object should consist of property THREE_DOMAIN_SECURE_LIABILITY_STATUS_POSSIBLE', () => {
        expect(constants).has.property('THREE_DOMAIN_SECURE_LIABILITY_STATUS_POSSIBLE');
    });

    it('response object should consist of property PAYMENT_METHOD_ID_GOOGLE_PAY', () => {
        expect(constants).has.property('PAYMENT_METHOD_ID_GOOGLE_PAY');
    });

    it('response object should consist of property GOOGLEPAY_PHONE_NUMBER_INVALID', () => {
        expect(constants).has.property('GOOGLEPAY_PHONE_NUMBER_INVALID');
    });

    it('response object should consist of property BILLING_ADDRESS_SElECTOR_OPTION_MANUAL_ENTRY', () => {
        expect(constants).has.property('BILLING_ADDRESS_SElECTOR_OPTION_MANUAL_ENTRY');
    });

    it('response object should consist of of property CONTACT_PREFERENCE_NO_CONTACT_INFO', () => {
        expect(constants).has.property('CONTACT_PREFERENCE_NO_CONTACT_INFO');
    });

    it('response object should consist of property CONTACT_PREFERENCE_UPDATE_CONTACT_INFO', () => {
        expect(constants).has.property('CONTACT_PREFERENCE_UPDATE_CONTACT_INFO');
    });

    it('response object should consist of property CONTACT_PREFERENCE_RETAIN_CONTACT_INFO', () => {
        expect(constants).has.property('CONTACT_PREFERENCE_RETAIN_CONTACT_INFO');
    });

    it('response object should consist of property USER_ACTION_CONTINUE', () => {
        expect(constants).has.property('USER_ACTION_CONTINUE');
    });

    it('response object should consist of property USER_ACTION_PAY_NOW', () => {
        expect(constants).has.property('USER_ACTION_PAY_NOW');
    });

    it('response object should consist of property DWSID', () => {
        expect(constants).has.property('DWSID');
    });
});
