/* eslint-disable no-underscore-dangle */
const { bm_paypal: { ppTransactionMgrPath } } = require('../path.json');

const { describe, it, beforeEach } = require('mocha');
const { expect } = require('chai');
const { stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const getOrderDetails = stub();
const log = {};

const ppTransactionMgr = proxyquire(ppTransactionMgrPath, {
    'dw/web/Resource': { msg: () => 'note' },
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog: (err) => {
            log.err = err.toString();
        }
    },
    '~/cartridge/scripts/paypal/api/restApiWrapper': function() {
        return { getOrderDetails };
    }
});

describe('ppTransactionMgr file', () => {
    const hm = {
        transactionId: {
            stringValue: 'stringValue'
        }
    };

    let transactionIdFromOrder;

    describe('getTransactionID', () => {
        const getTransactionID = ppTransactionMgr.__get__('getTransactionID');

        it('response type should be equal "string" if condition is true', () => {
            transactionIdFromOrder = 'transactionIdFromOrder';

            expect(getTransactionID(hm, transactionIdFromOrder)).to.be.a('string');
        });

        it('response should be equal transactionIdFromOrder if condition is true', () => {
            expect(getTransactionID(hm, transactionIdFromOrder)).equal(transactionIdFromOrder);
        });

        it('response type should be equal string if condition is false', () => {
            transactionIdFromOrder = null;

            expect(getTransactionID(hm, transactionIdFromOrder)).to.be.a('string');
        });

        it('response should be equal stringValue if condition is false', () => {
            expect(getTransactionID(hm, transactionIdFromOrder)).equal('stringValue');
        });
    });

    describe('TransactionMgrModel', () => {
        it('response type should be equal empty object', () => {
            expect(ppTransactionMgr.TransactionMgrModel).to.be.undefined;
        });
    });

    describe('getTransactionData', () => {
        const ppTransactionMgrInstance = new ppTransactionMgr();
        const orderDetails = {};

        beforeEach(() => {
            getOrderDetails.returns(orderDetails);
        });

        it('result should be orderDetails object when there are no errors', () => {
            expect(ppTransactionMgrInstance.getTransactionData(hm, transactionIdFromOrder)).to.deep.equal(orderDetails);
        });

        it('should log an error when the error message matches the specified message', () => {
            const expectedErrorMsg = 'Specified resource ID does not exist. Please check the resource ID and try again.Note: You can review your transaction details in your PayPal merchant account.';
            const errorMessage = 'Error: ' + expectedErrorMsg;

            getOrderDetails.throws('Error', expectedErrorMsg);
            expect(() => ppTransactionMgrInstance.getTransactionData(hm, transactionIdFromOrder)).to.throw();
            expect(log.err).to.equal(errorMessage);
        });

        it('result should be orderDetails object which equals to {}', () => {
            expect(ppTransactionMgrInstance.getTransactionData(hm, transactionIdFromOrder)).to.deep.equal({});
        });

        it('result should be an error if orderDetails.err isn\'t empty', () => {
            orderDetails.err = true;
            orderDetails.responseData = {
                l_longmessage0: 'error '
            };

            expect(() => ppTransactionMgrInstance.getTransactionData(hm, transactionIdFromOrder)).to.throw();
            expect(log.err).to.equal('Error: error note');
        });

        it('result should be an error if ppRestApiWrapper.getOrderDetails throws an error', () => {
            getOrderDetails.throws(Error);

            expect(() => ppTransactionMgrInstance.getTransactionData(hm, transactionIdFromOrder)).to.throw();
            expect(log.err).to.equal('Error');
        });
    });
});
