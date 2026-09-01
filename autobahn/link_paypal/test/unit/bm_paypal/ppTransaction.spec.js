/* eslint-disable no-underscore-dangle */
const { bm_paypal: { ppTransactionPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const {
    describe, it, beforeEach, afterEach
} = require('mocha');

const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const isJson = stub();
const isExpiredHonorPeriod = stub();
const formattedDate = stub();
const getPaypalPaymentInstrument = stub();
const splitFullName = stub();
const getPaymentMethodId = stub();

const ppTransaction = proxyquire(ppTransactionPath, {
    'dw/value/Money': dw.value.Money,
    'dw/system/Transaction': dw.system.Transaction,
    '*/cartridge/scripts/paypal/helpers': {
        isExpiredHonorPeriod,
        formattedDate,
        splitFullName,
        getReadablePaymentMethod: (val) => val
    },
    '~/cartridge/config/constants': {
        INTENT_CAPTURE: 'CAPTURE',
        STATUS_COMPLETED: 'COMPLETED',
        UNKNOWN: 'UNKNOWN',
        TRANSACTION_STATUSES: ['CREATED', 'PARTIALLY_CAPTURED']
    },
    '*/cartridge/scripts/helpers/coreHelpers': { isJson },
    '*/cartridge/scripts/paypal/paymentInstrumentHelpers': {
        getPaypalPaymentInstrument,
        getPaymentMethodId
    },
    '~/cartridge/config/preferences': { isTransactionLogEnabled: true }
});

describe('ppTransaction file', () => {
    describe('getTaxAndShippingAmount', () => {
        const getTaxAndShippingAmount = ppTransaction.__get__('getTaxAndShippingAmount');
        const returnValue = 5;
        const order = { custom: {} };

        let amountBreakdown;

        afterEach(() => {
            amountBreakdown = null;
            order.shippingTotalPrice = null;
            order.totalTax = null;
        });

        it('if amountBreakdown is true', () => {
            amountBreakdown = {
                shipping: { value: returnValue },
                tax_total: { value: returnValue }
            };

            expect(getTaxAndShippingAmount(amountBreakdown, order)).to.deep.equal({
                shippingAmount: returnValue,
                taxAmount: returnValue
            });
        });

        it('if amountBreakdown is false', () => {
            order.shippingTotalPrice = { value: returnValue };
            order.totalTax = { value: returnValue };

            expect(getTaxAndShippingAmount(amountBreakdown, order)).to.deep.equal({
                shippingAmount: returnValue,
                taxAmount: returnValue
            });
        });
    });

    describe('getTaxAndShippingAmount', () => {
        const fixId = '***';
        const getTransactionId = ppTransaction.__get__('getTransactionId');

        let payments;
        let transactionIdFromReq;

        afterEach(() => {
            payments = {};
            transactionIdFromReq = '';
        });

        it('if payments.captures and transactionIdFromReq are not empty should return transactionIdFromReq', () => {
            payments = {
                captures: [{ id: fixId }],
                authorizations: [{ id: fixId }]
            };
            transactionIdFromReq = 'transactionIdFromReq';
            expect(getTransactionId(payments, transactionIdFromReq)).to.deep.equal(transactionIdFromReq);
        });

        it('if payments.captures or transactionIdFromReq are empty and payments.authorizations is not than should return payments.authorizations[0].id', () => {
            payments = {
                authorizations: [{ id: fixId }]
            };
            transactionIdFromReq = 'transactionIdFromReq';
            expect(getTransactionId(payments, transactionIdFromReq)).to.deep.equal(fixId);
        });

        it('if payments.captures, transactionIdFromReq and payments.authorizations are empty should be returned payments.captures[0].id', () => {
            payments = {
                captures: [{ id: fixId }]
            };
            expect(getTransactionId(payments, transactionIdFromReq)).to.deep.equal(fixId);
        });
    });

    describe('setRefundRelatedAmounts', () => {
        const setRefundRelatedAmounts = ppTransaction.__get__('setRefundRelatedAmounts');
        const payments = {
            refunds: [{
                links: [{}, { href: 'url/0001' }],
                amount: {
                    value: 100,
                    currency_code: 'USD'
                }
            }]
        };

        const amount = {
            value: 120,
            currency_code: 'USD'
        };

        const currencyCode = 'USD';

        let transactionIdFromReq = '0001';

        it('result should be an object with values set for isRefundButtonAllowed, refundedAmount & restRefundAmount', () => {
            expect(setRefundRelatedAmounts({
                payments: payments,
                transactionIdFromReq: transactionIdFromReq,
                amount: amount,
                currencyCode: currencyCode
            })).to.deep.equal({
                isRefundButtonAllowed: false,
                refundedAmount: 100,
                restRefundAmount: 20
            });
        });

        it('result should be an object with property isRefundButtonAllowed set to undefined if transactionIdFromReq equals null', () => {
            transactionIdFromReq = null;
            expect(setRefundRelatedAmounts({
                payments: payments,
                transactionIdFromReq: transactionIdFromReq,
                amount: amount,
                currencyCode: currencyCode
            })).to.have.property('isRefundButtonAllowed').which.is.undefined;
        });

        it('result should be an object with properties set to undefined if payments.refunds are null', () => {
            payments.refunds = null;

            expect(setRefundRelatedAmounts({
                payments: payments,
                transactionIdFromReq: transactionIdFromReq,
                amount: amount,
                currencyCode: currencyCode
            })).to.deep.equal({
                isRefundButtonAllowed: undefined,
                refundedAmount: undefined,
                restRefundAmount: undefined
            });
        });
    });

    describe('setCaptureRelatedAmounts', () => {
        const setCaptureRelatedAmounts = ppTransaction.__get__('setCaptureRelatedAmounts');

        const params = {
            transaction: {
                status: 'COMPLETED',
                intent: 'CAPTURE'
            },
            payments: {
                authorizations: null
            },
            captures: [{
                id: 'id',
                status: 'captured',
                amount: { value: 100 }
            }],
            amount: { value: 125 },
            transactionIdFromReq: 'id'
        };

        it('result should be an object with all properties, except for restCaptureAmount, set to their values if transactionIdFromReq isn\'t empty', () => {
            expect(setCaptureRelatedAmounts(params)).to.deep.equal({
                capturedAmount: 100,
                paymentStatus: 'captured',
                captureID: 'id',
                isCaptureButtonAllowed: false,
                restCaptureAmount: undefined,
                refundedAmount: 0.00,
                restRefundAmount: 100
            });
        });

        it('result should be a value set for capturedAmount from params obj & isCaptureButtonAllowed as false if transactionIdFromReq is null', () => {
            params.transactionIdFromReq = null;

            expect(setCaptureRelatedAmounts(params)).to.have.property('capturedAmount').which.equals(100);
            expect(setCaptureRelatedAmounts(params)).to.have.property('isCaptureButtonAllowed').which.is.false;
        });

        it('result should be a value set for restCaptureAmount if isCaptureStatus is false & transactionIdFromReq is empty ', () => {
            params.payments.authorizations = 'authorized';

            expect(setCaptureRelatedAmounts(params)).to.have.property('restCaptureAmount').which.equals(25);
        });

        it('result should be an object with all properties set to undefined if captures are null', () => {
            params.captures = null;

            expect(setCaptureRelatedAmounts(params)).to.deep.equal({
                capturedAmount: undefined,
                paymentStatus: undefined,
                captureID: undefined,
                isCaptureButtonAllowed: undefined,
                restCaptureAmount: undefined,
                refundedAmount: undefined,
                restRefundAmount: undefined
            });
        });
    });

    describe('setPaypalRequestAndResponseFromPI', () => {
        const paymentInstrument = {
            custom: {
                paypalRequest: '{}',
                paypalResponse: '{}'
            }
        };

        const setPaypalRequestAndResponseFromPI = ppTransaction.__get__('setPaypalRequestAndResponseFromPI');

        it('responce should be an object with property paypalRequest & paypalResponse', () => {
            expect(setPaypalRequestAndResponseFromPI(paymentInstrument)).to.deep.equal({ paypalRequest: {}, paypalResponse: {} });
        });
    });

    describe('getPaypalTransactionHistory', () => {
        const response = [{ amount: '50.00', 'status': 'CREATED', 'timestamp': '2023-02-28T12:00:00.000Z' }];

        const paymentInstrument = {
            paymentTransaction: { custom: { paypalTransactionHistory: JSON.stringify(response) } }
        };

        const getPaypalTransactionHistory = ppTransaction.__get__('getPaypalTransactionHistory');

        before(() => {
            isJson.returns(true);
        });

        after(() => {
            isJson.reset();
        });

        it('should returns array of objects', () => {
            const val = getPaypalTransactionHistory(paymentInstrument);

            expect(val).to.be.an('array').that.is.not.empty;
            expect(val).to.deep.equal(response);
        });

        it('should returns empty array', () => {
            isJson.returns(false);

            expect(getPaypalTransactionHistory(paymentInstrument)).to.be.an('array').that.is.empty;
        });
    });

    describe('TransactionModel', function() {
        const transaction = {
            id: '7DV33677FE740241X',
            intent: 'AUTHORIZE',
            payer: {
                name: {
                    given_name: 'Ivan',
                    surname: 'C Vinogradov'
                },
                email_address: 'I.VinogradovVN@gmail.com'
            },
            purchase_units: [{
                amount: {
                    breakdown: {
                        discount: {
                            currency_code: 'USD',
                            value: 0.00
                        },
                        handling: {
                            currency_code: 'USD',
                            value: 0.00
                        },
                        insurance: {
                            currency_code: 'USD',
                            value: 0.00
                        },
                        shipping: {
                            currency_code: 'USD',
                            value: 5.99
                        },
                        tax_total: {
                            currency_code: 'USD',
                            value: 3.75
                        }
                    },
                    value: 78.74,
                    currency_code: 'USD'
                },
                invoice_id: '00002818',
                payments: {
                    captures: [{
                        status: 'COMPLETED',
                        id: '7F0816103A703023N',
                        amount: {
                            currency_code: 'USD',
                            value: 1000
                        }
                    }],
                    authorizations: [{
                        amount: [{}],
                        create_time: '',
                        expiration_time: '',
                        id: '75P818536D991905L',
                        invoice_id: '00002818',
                        links: [],
                        seller_protection: [],
                        status: 'COMPLETED',
                        update_time: ''
                    }]
                }
            }],
            create_time: '',
            update_time: '2021-12-02T08:28:41Z'
        };

        const order = {
            custom: {},
            getCustom: () => {
                return {
                    custom: {},
                    paypalRequest: JSON.stringify({ request: 'paypalRequest' }),
                    paypalResponse: JSON.stringify({ response: 'paypalResponse' })
                };
            }
        };

        formattedDate.returns('12/02/21 8:28 am');
        isExpiredHonorPeriod.returns(false);
        getPaymentMethodId.returns('PayPal');

        beforeEach(() => {
            request.httpParameterMap = {
                transactionId: { stringValue: '7F0816103A703023N' }
            };
        });

        afterEach(() => {
            request.httpParameterMap = null;
            transaction.purchase_units[0].payments.refunds = [];
            transaction.purchase_units[0].payments.captures = [{
                status: 'COMPLETED',
                id: '7F0816103A703023N',
                amount: {
                    currency_code: 'USD',
                    value: 1000
                }
            }];
            transaction.payer.email_address = 'I.VinogradovVN@gmail.com';
            transaction.create_time = '';
            transaction.update_time = '2021-12-02T08:28:41Z';
            getPaypalPaymentInstrument.returns({
                custom: {
                    paypalRequest: null,
                    paypalResponse: null
                },
                paymentTransaction: {
                    custom: { paypalTransactionHistory: [] }
                }
            });
        });

        it('result should be TransactionModel equal to expectedTransactionModelObject', function() {
            const expectedTransactionModelObject = {
                id: '7DV33677FE740241X',
                intent: 'AUTHORIZE',
                payer: {
                    name: {
                        given_name: 'Ivan',
                        surname: 'C Vinogradov'
                    },
                    email_address: 'I.VinogradovVN@gmail.com'
                },
                purchase_units: [
                    {
                        amount: {
                            breakdown: {
                                discount: {
                                    currency_code: 'USD',
                                    value: 0
                                },
                                handling: {
                                    currency_code: 'USD',
                                    value: 0
                                },
                                insurance: {
                                    currency_code: 'USD',
                                    value: 0
                                },
                                shipping: {
                                    currency_code: 'USD',
                                    value: 5.99
                                },
                                tax_total: {
                                    currency_code: 'USD',
                                    value: 3.75
                                }
                            },
                            value: 78.74,
                            currency_code: 'USD'
                        },
                        invoice_id: '00002818',
                        payments: {
                            captures: [
                                {
                                    status: 'COMPLETED',
                                    id: '7F0816103A703023N',
                                    amount: {
                                        currency_code: 'USD',
                                        value: 1000
                                    }
                                }
                            ],
                            authorizations: [
                                {
                                    amount: [
                                        {}
                                    ],
                                    create_time: '',
                                    expiration_time: '',
                                    id: '75P818536D991905L',
                                    invoice_id: '00002818',
                                    links: [],
                                    seller_protection: [],
                                    status: 'COMPLETED',
                                    update_time: ''
                                }
                            ]
                        }
                    }
                ],
                create_time: '',
                update_time: '2021-12-02T08:28:41Z',
                isCaptureButtonAllowed: false,
                capturedAmount: 1000,
                captureID: '7F0816103A703023N',
                refundedAmount: 0,
                restRefundAmount: 1000,
                captures: [
                    {
                        'status': 'COMPLETED',
                        'id': '7F0816103A703023N',
                        'amount': {
                            'currency_code': 'USD',
                            'value': 1000
                        }
                    }
                ],
                purchaseUnits: {
                    'amount': {
                        'breakdown': {
                            'discount': {
                                'currency_code': 'USD',
                                'value': 0
                            },
                            'handling': {
                                'currency_code': 'USD',
                                'value': 0
                            },
                            'insurance': {
                                'currency_code': 'USD',
                                'value': 0
                            },
                            'shipping': {
                                'currency_code': 'USD',
                                'value': 5.99
                            },
                            'tax_total': {
                                'currency_code': 'USD',
                                'value': 3.75
                            }
                        },
                        'value': 78.74,
                        'currency_code': 'USD'
                    },
                    'invoice_id': '00002818',
                    'payments': {
                        'captures': [
                            {
                                'status': 'COMPLETED',
                                'id': '7F0816103A703023N',
                                'amount': {
                                    'currency_code': 'USD',
                                    'value': 1000
                                }
                            }
                        ],
                        'authorizations': [
                            {
                                'amount': [
                                    {}
                                ],
                                'create_time': '',
                                'expiration_time': '',
                                'id': '75P818536D991905L',
                                'invoice_id': '00002818',
                                'links': [],
                                'seller_protection': [],
                                'status': 'COMPLETED',
                                'update_time': ''
                            }
                        ]
                    }
                },
                firstname: 'Ivan',
                lastname: 'C Vinogradov',
                email: 'I.VinogradovVN@gmail.com',
                amt: 78.74,
                currencycode: 'USD',
                shippingAmount: 5.99,
                taxAmount: 3.75,
                invnum: '00002818',
                mainTransactionId: '7DV33677FE740241X',
                transactionid: '7F0816103A703023N',
                authorizationId: '75P818536D991905L',
                order: order,
                orderTimeCreated: '',
                orderTimeUpdated: '12/02/21 8:28 am',
                paymentMethod: null,
                paymentstatus: 'COMPLETED',
                paypalRequest: '',
                paypalResponse: '',
                isTransactionLogEnabled: true,
                paypalTransactionHistory: [],
                isCaptured: false,
                isExpiredHonorPeriod: false
            };

            const ppTransactionObject = new ppTransaction(transaction, order);

            Object.setPrototypeOf(expectedTransactionModelObject, Object.getPrototypeOf(ppTransactionObject));

            expect(ppTransactionObject).to.deep.equal(expectedTransactionModelObject);
        });

        it('result should be ppTransactionObject having value for create_time & none for update_time', () => {
            transaction.create_time = '2022-11-02T08:28:41Z';
            transaction.update_time = '';

            const ppTransactionObject = new ppTransaction(transaction, order);

            expect(ppTransactionObject).to.have.property('create_time').to.equal('2022-11-02T08:28:41Z');
            expect(ppTransactionObject).to.have.property('update_time').to.equal('');
        });

        it('result should be ppTransactionObject having "UNKNOWN" as value for email if there\'s none in transaction', () => {
            transaction.payer.email_address = '';

            const ppTransactionObject = new ppTransaction(transaction, order);

            expect(ppTransactionObject).to.have.property('email').that.equals('UNKNOWN');
        });

        it('result should be ppTransactionObject having value for refundedAmount & restRefundAmount properties if payments.refunds isn\'t null', () => {
            transaction.purchase_units[0].payments.refunds = [{
                links: [{}, { href: 'url/7F0816103A703023N' }],
                amount: {
                    value: 30,
                    currency_code: 'USD'
                }
            }];

            const ppTransactionObject = new ppTransaction(transaction, order);

            expect(ppTransactionObject).to.have.property('refundedAmount').that.equals(30);
            expect(ppTransactionObject).to.have.property('restRefundAmount').that.equals(970);
        });

        it('result should be ppTransactionObject having [] as value for captures if there\'re none in transaction', () => {
            transaction.purchase_units[0].payments.captures = [];

            const ppTransactionObject = new ppTransaction(transaction, order);

            expect(ppTransactionObject).to.have.property('captures').that.deep.equals([]);
        });

        it('result should be ppTransactionObject having "" as values for paypalRequest & paypalResponse if in paymentInstrument.custom they are set to ""undefined"', () => {
            getPaypalPaymentInstrument.returns({
                custom: {
                    paypalRequest: undefined,
                    paypalResponse: undefined
                },
                paymentTransaction: {
                    custom: { paypalTransactionHistory: null }
                }
            });

            const ppTransactionObject = new ppTransaction(transaction, order);

            expect(ppTransactionObject).to.have.property('paypalRequest').that.equals('');
            expect(ppTransactionObject).to.have.property('paypalResponse').that.equals('');
        });

        it('result should be ppTransactionObject having JSON.stringify values for paypalRequest & paypalResponse, and paymentId if in paymentInstrument.custom they aren\'t empty', () => {
            getPaypalPaymentInstrument.returns({
                custom: {
                    paypalRequest: '{}',
                    paypalResponse: '{}'
                },
                paymentTransaction: {
                    custom: { paypalTransactionHistory: null }
                }
            });

            const ppTransactionObject = new ppTransaction(transaction, order);

            expect(ppTransactionObject).to.have.property('paypalRequest').that.equals('{}');
            expect(ppTransactionObject).to.have.property('paypalResponse').that.equals('{}');
            expect(ppTransactionObject).to.have.property('paymentMethod').that.equals('PayPal');
        });
    });

    describe('setCustomerData', () => {
        let transaction = {
            payer: {
                name: {
                    given_name: 'Joe',
                    surname: 'Gray'
                },
                email_address: 'email'
            },
            purchase_units: [{
                shipping: {
                    name: {
                        full_name: 'fullName'
                    }
                }
            }]
        };

        let result;

        afterEach(() => {
            splitFullName.reset();
        });

        it('should set customer data if payer data is passed', () => {
            result = ppTransaction.prototype.setCustomerData(transaction);
            expect(result).to.be.undefined;
        });

        it('should set customer data for card if payer data is not passed', () => {
            transaction.payment_source = {
                card: {}
            };
            splitFullName.returns({
                firstName: 'Joe',
                lastName: 'Gray'
            });

            result = ppTransaction.prototype.setCustomerData(transaction);
            expect(result).to.be.undefined;
        });

        it('should set name when payer data is not passed and even if there\'s no shipping address', () => {
            transaction = {
                purchase_units: [{
                    shipping: null
                }]
            };

            splitFullName.returns({
                firstName: 'Joe',
                lastName: 'Gray'
            });

            ppTransaction.prototype.setCustomerData(transaction, { customerName: 'Test Name' });
            expect(splitFullName.calledOnce).to.be.true;
        });
    });
});
