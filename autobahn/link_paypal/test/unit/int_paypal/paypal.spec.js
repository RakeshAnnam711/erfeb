const { int_paypal: { paypalPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe, beforeEach } = require('mocha');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const proxyquire = require('proxyquire').noCallThru();

const createErrorLog = stub();
const handle = stub();
const authorize = stub();

const form = {};

const paypal = proxyquire(paypalPath, {
    'dw/order/OrderMgr': dw.order.OrderMgr,
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog
    },
    '*/cartridge/scripts/paypal/processor': {
        handle,
        authorize
    },
    '*/cartridge/config/constants': {
        PAYMENT_METHOD_ID_PAYPAL: 'PayPal'
    }
});

describe('paypal file', () => {
    describe('processForm', () => {
        const viewData = {};

        it('must return viewData', () => {
            expect(paypal.processForm({}, form, viewData)).to.be.deep.equal({
                viewData: {
                    paymentInformation: {
                        billingForm: {
                            paymentMethod: {
                                htmlName: 'PayPal',
                                value: 'PayPal'
                            }
                        }
                    },
                    paymentMethod: {
                        htmlName: 'PayPal',
                        value: 'PayPal'
                    }
                }
            });
        });
    });

    describe('Handle', () => {
        it('must return object with details', () => {
            handle.returns({
                success: true,
                paymentInstrument: 'paymentInstrument',
                shippingAddress: 'shippingAddress'
            });

            expect(paypal.Handle({}, form)).to.be.deep.equal({
                success: true,
                paymentInstrument: 'paymentInstrument',
                shippingAddress: 'shippingAddress'
            });
        });
    });

    describe('Authorize', () => {
        it('must return object with authorized status', () => {
            dw.order.OrderMgr.createOrderSequenceNo = () => {};
            authorize.returns({
                authorized: true
            });

            expect(paypal.Authorize({}, form)).to.be.deep.equal({
                authorized: true
            });
        });
    });

    describe('createOrderNo', () => {
        const expectedOrderNo = 'orderNo';
        const gotOrderNo = 'paypalUsedOrderNo';

        before(() => {
            session = {
                privacy: {
                    paypalUsedOrderNo: ''
                }
            };
        });

        beforeEach(() => {
            dw.order.OrderMgr.createOrderSequenceNo = () => expectedOrderNo;
        });

        it('if there is no paypalUsedOrderNo', () => {
            expect(paypal.createOrderNo()).to.be.equal(expectedOrderNo);
        });

        it('if order is exist', () => {
            session.privacy.paypalUsedOrderNo = gotOrderNo;
            dw.order.OrderMgr.getOrder = () => 'order';

            expect(paypal.createOrderNo()).to.be.equal(expectedOrderNo);
        });

        it('if order is not exist', () => {
            session.privacy.paypalUsedOrderNo = gotOrderNo;
            dw.order.OrderMgr.getOrder = () => '';

            expect(paypal.createOrderNo()).to.be.equal(session.privacy.paypalUsedOrderNo);
            expect(session.privacy.paypalUsedOrderNo).to.deep.equal(gotOrderNo);
        });

        it('If an error occurs', () => {
            dw.order.OrderMgr.getOrder = () => {
                throw (new Error());
            };

            expect(paypal.createOrderNo()).to.be.equal(expectedOrderNo);
            expect(session.privacy.paypalUsedOrderNo).to.deep.equal(expectedOrderNo);
        });
    });
});
