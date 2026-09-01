const { bm_paypal: { constantsPath } } = require('../path.json');

const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const constants = proxyquire(constantsPath, {
});

describe('constants from bm_paypal cartridge', () => {
    it('response type should be object', () => {
        expect(constants).to.be.a('object');
    });

    it('response object should consist property SEARCH_BY_TRANSACTION_ID', () => {
        expect(constants).has.property('SEARCH_BY_TRANSACTION_ID');
    });

    it('response object should consist property SEARCH_BY_ORDER_NUMBER', () => {
        expect(constants).has.property('SEARCH_BY_ORDER_NUMBER');
    });

    it('response object should consist property INTENT_CAPTURE', () => {
        expect(constants).has.property('INTENT_CAPTURE');
    });

    it('response object should consist property STATUS_COMPLETED', () => {
        expect(constants).has.property('STATUS_COMPLETED');
    });

    it('response object should consist property STATUS_CAPTURED', () => {
        expect(constants).has.property('STATUS_CAPTURED');
    });

    it('response object should consist property STATUS_REFUNDED', () => {
        expect(constants).has.property('STATUS_REFUNDED');
    });

    it('response object should consist property STATUS_CREATED', () => {
        expect(constants).has.property('STATUS_CREATED');
    });

    it('response object should consist property ACTION_VOID', () => {
        expect(constants).has.property('ACTION_VOID');
    });

    it('response object should consist property ACTION_REAUTHORIZE', () => {
        expect(constants).has.property('ACTION_REAUTHORIZE');
    });

    it('response object should consist property ACTION_REFUND', () => {
        expect(constants).has.property('ACTION_REFUND');
    });

    it('response object should consist property ACTION_CAPTURE', () => {
        expect(constants).has.property('ACTION_CAPTURE');
    });

    it('response object should consist property SERVICE_NAME', () => {
        expect(constants).has.property('SERVICE_NAME');
    });

    it('response object should consist property UNKNOWN', () => {
        expect(constants).has.property('UNKNOWN');
    });

    it('response object should consist property NOT_APPLICABLE', () => {
        expect(constants).has.property('NOT_APPLICABLE');
    });

    it('response object should consist property PARTNER_ATTRIBUTION_ID', () => {
        expect(constants).has.property('PARTNER_ATTRIBUTION_ID');
    });

    it('response object should consist property ACTION_STATUS_SUCCESS', () => {
        expect(constants).has.property('ACTION_STATUS_SUCCESS');
    });

    it('response object should consist property INVALID_CLIENT', () => {
        expect(constants).has.property('INVALID_CLIENT');
    });

    it('response object should consist property TRANSACTION_STATUSES', () => {
        expect(constants).has.property('TRANSACTION_STATUSES');
    });

    it('response object should consist property TRANSACTION_FAILED_STATUSES', () => {
        expect(constants).has.property('TRANSACTION_FAILED_STATUSES');
    });

    it('response object should consist property INSTANCE_PRODUCTION', () => {
        expect(constants).has.property('INSTANCE_PRODUCTION');
    });

    it('response object should consist property INSTANCE_PRODUCTION', () => {
        expect(constants).has.property('INSTANCE_PRODUCTION');
    });

    it('response object should consist property INSTANCE_SANDBOX', () => {
        expect(constants).has.property('INSTANCE_SANDBOX');
    });

    it('response object should consist property VALUE_TYPE', () => {
        expect(constants).has.property('VALUE_TYPE');
    });

    it('response object should consist property ERRORS_WHITE_LIST', () => {
        expect(constants).has.property('ERRORS_WHITE_LIST');
    });

    it('response object should consist property PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD', () => {
        expect(constants).has.property('PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD');
    });

    it('response object should consist property ALLOWED_PROCESSORS_IDS', () => {
        expect(constants).has.property('ALLOWED_PROCESSORS_IDS');
    });

    it('response object should consist property PAYMENT_METHODS_MAP', () => {
        expect(constants).has.property('PAYMENT_METHODS_MAP');
    });

    it('response object should consist property PAYLATER_MESSAGING_LOCATIONS', () => {
        expect(constants).has.property('PAYLATER_MESSAGING_LOCATIONS');
    });
});
