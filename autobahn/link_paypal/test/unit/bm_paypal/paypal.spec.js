/* eslint-disable object-curly-newline */
/* eslint-disable no-underscore-dangle */
const { bm_paypal: { bmPaypalApiPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const { describe, it, beforeEach, afterEach } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const errorHandlerFake = stub();
const getValueByKeyFake = stub();
const paypalREST = stub();
const log = {};

const paypalApi = proxyquire(bmPaypalApiPath, {
    'dw/web/Resource': { msgf: () => 'errors' },
    '~/cartridge/scripts/paypal/utils': {
        createErrorLog: (err) => {
            log.err = err.toString();
        }
    },
    '~/cartridge/config/constants': {
        SERVICE_NAME: 'int_paypal.http.rest',
        PARTNER_ATTRIBUTION_ID: 'SFCC_EC_B2C_25_3_0',
        INVALID_CLIENT: 'invalid client',
        INVALID_RESOURCE_ID: 'invalid resource id',
        ERRORS_WHITE_LIST: [
            'INVALID_RESOURCE_ID',
            'INVALID CLIENT'
        ]
    },
    '~/cartridge/scripts/service/paypalREST': paypalREST,
    '~/cartridge/scripts/helpers/coreHelpers': {
        getValueByKey: getValueByKeyFake
    },
    '~/cartridge/scripts/helpers/serviceHelpers': {
        errorHandler: errorHandlerFake
    }
});

describe('bmPaypalApi file', () => {
    const requestData = {
        body: {},
        method: 'GET',
        path: 'v2/checkout/orders/',
        partnerAttributionId: 'SFCC_EC_B2C_25_3_0',
        referenceid: 'id'
    };

    beforeEach(() => {
        paypalREST.returns({
            call: function(data) {
                this.getResponse = () => data;

                return { isOk: () => true };
            }
        });
    });

    afterEach(() => {
        paypalREST.reset();
    });

    describe('getOrderDetails', () => {
        it('result should be an error if paypalREST throws an error', () => {
            paypalREST.throws(Error);
            expect(() => paypalApi.getOrderDetails('73R2506398473783H')).to.throw();
        });

        it('result should be a path string to follow getOrderDetails path pattern', () => {
            expect(paypalApi.getOrderDetails('73R2506398473783H')).to.have.property('path').that.equals('v2/checkout/orders/73R2506398473783H');
        });
    });

    describe('voidAuthorizedPayment', () => {
        it('result should be a path string to follow voidAuthorizedPayment path pattern', () => {
            expect(paypalApi.voidAuthorizedPayment('authorizationId')).to.have.property('path').that.equals('v2/payments/authorizations/authorizationId/void');
        });
    });

    describe('reauthorizeTransaction', () => {
        it('result should be a path string to follow reauthorizeTransaction path pattern', () => {
            expect(paypalApi.reauthorizeTransaction('authorizationId')).to.have.property('path').that.equals('v2/payments/authorizations/authorizationId/reauthorize');
        });
    });

    describe('refundTransaction', () => {
        const transactionid = 'transactionid';

        it('result should be a body obj to equal {}', () => {
            expect(paypalApi.refundTransaction(transactionid, requestData.body)).to.have.property('body').that.deep.equals({});
        });

        it('result should be a path string to follow refundTransaction path pattern', () => {
            expect(paypalApi.refundTransaction(transactionid, requestData.body)).to.have.property('path').that.equals('v2/payments/captures/transactionid/refund');
        });
    });

    describe('captureTransaction', () => {
        const authorizationId = 'authorizationId';

        it('result should be a body obj to equal {}', () => {
            expect(paypalApi.captureTransaction(authorizationId, requestData.body)).to.have.property('body').that.deep.equals({});
        });

        it('result should be a path string to follow captureTransaction path pattern', () => {
            expect(paypalApi.captureTransaction(authorizationId, requestData.body)).to.have.property('path').that.equals('v2/payments/authorizations/authorizationId/capture');
        });
    });

    describe('getDisputes', () => {
        it('should return a list of disputes', () => {
            expect(paypalApi.getDisputes()).to.have.property('path').that.equal('v1/customer/disputes?page_size=50');
        });
    });

    describe('getDisputeDetails', () => {
        const disputeId = 'PP-R-LVV-10084826';

        it('should return details for specific dispute', () => {
            expect(paypalApi.getDisputeDetails(disputeId)).to.have.property('path').that.equal('v1/customer/disputes/' + disputeId);
        });
    });

    describe('addTrackingAPI', () => {
        const order = {
            paymentInstrument: {
                custom: {
                    paypalOrderID: 'paypalOrderID'
                }
            },
            custom: {
                PP_API_TransactionID: 'TransactionID'
            },
            shipments: [{
                trackingNumber: 'trackingNumber',
                shippingMethod: {
                    custom: {
                        paypalCarrierName: 'paypalCarrierName'
                    }
                }
            }]
        };

        it('should proceed call', () => {
            paypalApi.addTrackingAPI(order);

            expect(paypalREST.calledOnce).to.be.true;
        });
    });

    describe('createPaymentToken', () => {
        before(() => {
            paypalREST.returns({
                call: ({ body: { payment_source, customer } }) => {
                    return {
                        id: 'payment-token',
                        payment_source: payment_source,
                        customer: customer
                    };
                }
            });
        });

        after(() => {
            paypalREST.call = () => response;

            errorHandlerFake.reset();
        });

        it('if service result is successfully returned', () => {
            const result = paypalApi.createPaymentToken('token1', 'SETUP_TOKEN', 'pp-customer-1');

            expect(result).to.be.an('object');
            expect(result.path).to.equal('v3/vault/payment-tokens');
            expect(result.body).to.deep.equal({
                payment_source: {
                    token: {
                        id: 'token1',
                        type: 'SETUP_TOKEN'
                    }
                },
                customer: {
                    id: 'pp-customer-1'
                }
            });
        });

        it('if service result is successfully returned, but without paypal customer id', () => {
            const result = paypalApi.createPaymentToken('token2', 'SETUP_TOKEN', undefined);

            expect(result).to.be.an('object');
            expect(result.path).to.equal('v3/vault/payment-tokens');
            expect(result.body).to.deep.equal({
                payment_source: {
                    token: {
                        id: 'token2',
                        type: 'SETUP_TOKEN'
                    }
                }
            });
        });

        it('if service call throws an error, the object with error msg should be returned', () => {
            paypalREST.returns({
                call: () => {
                    throw new Error('An internal server error occurred.');
                }
            });

            const result = paypalApi.createPaymentToken('token2', 'SETUP_TOKEN', 'pp-customer-2');

            expect(result).to.be.an('object');
        });

        it('if service call return an isOk = false, then errorHandler helper will called', () => {
            paypalREST.returns({
                call: () => {
                    return { isOk: () => false };
                }
            });

            paypalApi.createPaymentToken('token2', 'SETUP_TOKEN', 'pp-customer-2');

            expect(errorHandlerFake.called).to.be.true;
        });
    });
});
