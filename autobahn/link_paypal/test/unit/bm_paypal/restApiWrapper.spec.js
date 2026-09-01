/* eslint-disable no-underscore-dangle */
const { bm_paypal: { restApiWrapperPath } } = require('../path.json');

const { expect } = require('chai');
const {
    it, describe, before, after, afterEach
} = require('mocha');

const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const createErrorLog = stub();
const reauthorizeTransaction = stub();
const refundTransaction = stub();
const captureTransaction = stub();
const getOrder = stub();
const cancelOrder = stub();
const getPaypalPaymentInstrument = stub();

getPaypalPaymentInstrument.returns({
    custom: {}
});

const restApiWrapper = proxyquire(restApiWrapperPath, {
    'dw/web/Resource': dw.web.Resource,
    'dw/order/OrderMgr': {
        getOrder,
        cancelOrder
    },
    '~/cartridge/scripts/paypal/api/paypal': {
        voidAuthorizedPayment: () => {},
        getOrderDetails: () => ({}),
        reauthorizeTransaction,
        refundTransaction,
        captureTransaction
    },
    '~/cartridge/config/constants': {
        ACTION_STATUS_SUCCESS: 'SUCCESS',
        STATUS_COMPLETED: 'COMPLETED',
        STATUS_CREATED: 'CREATED'
    },
    '~/cartridge/scripts/paypal/paymentInstrumentHelpers': {
        getPaypalPaymentInstrument
    },
    '~/cartridge/scripts/paypal/utils': { createErrorLog }
});

describe('restApiWrapper file', () => {
    describe('ppRestSdk', () => {
        it('ppRestSdk should be a function', () => {
            expect(restApiWrapper()).to.equal(undefined);
            expect(restApiWrapper).to.be.a('function');
        });
    });

    describe('doVoid', () => {
        const reqData = {};

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.returns('Error during voiding');
            getOrder.returns({
                status: 'CANCELLED'
            });
        });

        after(() => {
            dw.web.Resource.msg.restore();
            createErrorLog.reset();
            getOrder.reset();
        });

        it('if reqData.authorizationId was not provided', () => {
            const result = restApiWrapper.prototype.doVoid(reqData);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('err', 'responseData');
            expect(result.responseData.l_longmessage0).to.equal('');
            expect(createErrorLog.calledWith('Error during voiding')).to.be.true;
        });

        it('if voiding was successfully performed', () => {
            reqData.authorizationId = 'id';

            const result = restApiWrapper.prototype.doVoid(reqData);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                responseData: {
                    ack: 'SUCCESS'
                },
                status: 'COMPLETED'
            });
        });
    });

    describe('doReauthorize', () => {
        let reqData = {};

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.withArgs('api.error.noid.during.reauthorization', 'errors', null).returns('Error during reauthorization');
            dw.web.Resource.msg.withArgs('api.error.not.successful.reauthorize', 'errors', null).returns('Error, not successful reauthorize');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        afterEach(() => {
            createErrorLog.reset();
            reauthorizeTransaction.reset();

            reqData = {};
        });

        it('if reqData.authorizationId was not provided', () => {
            const result = restApiWrapper.prototype.doReauthorize(reqData);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('err', 'responseData');
            expect(result.responseData.l_longmessage0).to.equal('');
            expect(createErrorLog.calledWith('Error during reauthorization')).to.be.true;
        });

        it('if resp.status !== ppConstants.STATUS_CREATED and error was thrown', () => {
            reqData.authorizationId = 'id';
            reauthorizeTransaction.returns({
                status: 'ERROR'
            });

            const result = restApiWrapper.prototype.doReauthorize(reqData);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('err', 'responseData');
            expect(result.responseData.l_longmessage0).to.equal('');
            expect(createErrorLog.calledWith('Error, not successful reauthorize')).to.be.true;
        });

        it('if reauthorization successfully performed', () => {
            reqData.authorizationId = 'id';
            reauthorizeTransaction.returns({
                status: 'CREATED'
            });

            const result = restApiWrapper.prototype.doReauthorize(reqData);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                status: 'CREATED',
                responseData: {
                    ack: 'SUCCESS'
                }
            });
        });
    });

    describe('doRefundTransaction', () => {
        let reqData = {};

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.withArgs('api.error.no.captureid', 'errors', null).returns('Error no capture id');
            dw.web.Resource.msg.withArgs('api.error.not.successful.refund', 'errors', null).returns('Error, not successful refund');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        afterEach(() => {
            createErrorLog.reset();
            refundTransaction.reset();

            reqData = {};
        });

        it('if reqData.transactionid was not provided', () => {
            const result = restApiWrapper.prototype.doRefundTransaction(reqData);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('err', 'responseData');
            expect(result.responseData.l_longmessage0).to.equal('');
            expect(createErrorLog.calledWith('Error no capture id')).to.be.true;
        });

        it('if resp.status !== ppConstants.STATUS_COMPLETED and error was thrown', () => {
            reqData.transactionid = 'id';
            reqData.invNum = '00001';
            reqData.note = 'note';
            reqData.amt = 100;
            reqData.currencyCode = 'USD';

            refundTransaction.returns({
                status: 'ERROR'
            });

            const result = restApiWrapper.prototype.doRefundTransaction(reqData);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('err', 'responseData');
            expect(result.responseData.l_longmessage0).to.equal('');
            expect(createErrorLog.calledWith('Error, not successful refund')).to.be.true;
        });

        it('if refund successfully performed', () => {
            reqData.transactionid = 'id';

            refundTransaction.returns({
                status: 'COMPLETED'
            });

            const result = restApiWrapper.prototype.doRefundTransaction(reqData);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                status: 'COMPLETED',
                responseData: {
                    ack: 'SUCCESS'
                }
            });
        });
    });

    describe('doCapture', () => {
        let reqData = {};

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.returns('Error during capturing');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        afterEach(() => {
            createErrorLog.reset();
            captureTransaction.reset();

            reqData = {};
        });

        it('if reqData.authorizationId was not provided', () => {
            const result = restApiWrapper.prototype.doCapture(reqData);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('err', 'responseData');
            expect(result.responseData.l_longmessage0).to.equal('');
            expect(createErrorLog.calledWith('Error during capturing')).to.be.true;
        });

        it('if invoice id and note to payer were not provided', () => {
            reqData.authorizationId = 'id';

            captureTransaction.returns({});

            const result = restApiWrapper.prototype.doCapture(reqData);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                responseData: {
                    ack: 'SUCCESS'
                }
            });
        });

        it('if invoice id and note to payer were provided', () => {
            reqData.authorizationId = 'id';
            reqData.invNum = '00001';
            reqData.note = 'note';

            captureTransaction.returns({
                note: 'note',
                invNum: '00001'
            });

            const result = restApiWrapper.prototype.doCapture(reqData);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                note: 'note',
                invNum: '00001',
                responseData: {
                    ack: 'SUCCESS'
                }
            });
        });
    });

    describe('getOrderDetails', () => {
        let id;

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.returns('Error, no token or id');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('if no id provided', () => {
            const result = restApiWrapper.prototype.getOrderDetails(id);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('err', 'responseData');
            expect(result.responseData.l_longmessage0).to.equal('');
            expect(createErrorLog.calledWith('Error, no token or id')).to.be.true;
        });

        it('if order details successfully returned', () => {
            id = 'id';

            const result = restApiWrapper.prototype.getOrderDetails(id);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({});
        });
    });
});
