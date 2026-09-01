/* eslint-disable object-curly-newline */

const { bm_paypal: { disputeHelperPath } } = require('../path.json');

const { stub, createStubInstance } = require('sinon');
const { expect } = require('chai');
const { it, describe, before, after } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const MoneyStub = stub();
const isJsonFake = stub();
const getDisputesFake = stub();
const formattedDateFake = stub();
const getDisputeDetailsFake = stub();
const getCustomObjectFake = stub();
const queryCustomObjectsFake = stub();
const createCustomObjectFake = stub();

const prefs = {
    simplifiedDisputePage: false
};

const paypalConstants = {
    NOT_APPLICABLE_SHORT: 'N/A'
};

const disputeHelper = proxyquire(disputeHelperPath, {
    'dw/object/CustomObjectMgr': {
        getCustomObject: getCustomObjectFake,
        queryCustomObjects: queryCustomObjectsFake,
        createCustomObject: createCustomObjectFake
    },
    '~/cartridge/scripts/paypal/api/paypal': {
        getDisputes: getDisputesFake,
        getDisputeDetails: getDisputeDetailsFake
    },
    '~/cartridge/scripts/paypal/helpers': {
        formattedDate: formattedDateFake,
        parseStatus: (status) => `Parsed ${status}`
    },
    '~/cartridge/scripts/helpers/coreHelpers': {
        isJson: isJsonFake,
        tryParseJSON: val => JSON.parse(val)
    },
    'dw/value/Money': MoneyStub,
    '~/cartridge/config/preferences': prefs,
    '~/cartridge/config/constants': paypalConstants
});

describe('disputeHelper file', () => {
    const listOfDisputes = [{
        dispute_id: 'PP-R-LVV-10084826',
        create_time: '2023-09-22T08:53:53.000Z',
        update_time: '2023-09-22T09:28:33.000Z',
        reason: 'UNAUTHORISED',
        status: 'WAITING_FOR_SELLER_RESPONSE',
        dispute_amount: {
            currency_code: 'USD',
            value: '34.48'
        }
    }, {
        dispute_id: 'PP-R-ZZX-10084825',
        create_time: '2023-09-22T08:47:21.000Z',
        update_time: '2023-09-22T09:42:43.000Z',
        reason: 'UNAUTHORISED',
        status: 'WAITING_FOR_BUYER_RESPONSE',
        dispute_amount: {
            currency_code: 'USD',
            value: '34.48'
        }
    }];

    describe('extractCustomAttributes', () => {
        const extractCustomAttributes = disputeHelper.__get__('extractCustomAttributes');

        it('should return an empty object if arg custom attributes are empty', () => {
            expect(extractCustomAttributes).to.be.a('function');
            expect(extractCustomAttributes({ custom: {} })).to.be.an('object').that.is.empty;
        });

        it('should return an object if arg custom attributes has data', () => {
            expect(extractCustomAttributes({
                custom: {
                    amount: '90.00',
                    status: 'OPEN',
                    currency_code: 'USD'
                }
            })).to.deep.equal({
                amount: '90.00',
                status: 'OPEN',
                currency_code: 'USD'
            });
        });
    });

    describe('createDispute', () => {
        const disputeFromPayPalApi = listOfDisputes[0];

        before(() => {
            createCustomObjectFake.withArgs('PayPalDisputes').returns({
                custom: {}
            });
        });

        after(() => {
            createCustomObjectFake.reset();
        });

        it('should create a new dispute - custom object', () => {
            expect(disputeHelper.createDispute(disputeFromPayPalApi)).to.be.undefined;
            expect(createCustomObjectFake.calledOnce, 'createCustomObject called once').to.be.true;
        });
    });

    describe('createDisputes', () => {
        let createDisputeStub;

        before(() => {
            createDisputeStub = stub(disputeHelper, 'createDispute');
        });

        after(() => {
            createDisputeStub.restore();
        });

        it('should create each dispute into custom object', () => {
            expect(disputeHelper.createDisputes(listOfDisputes)).to.be.undefined;
            expect(createDisputeStub.calledTwice).to.be.true;
        });
    });

    describe('getDisputeFromPayPal', () => {
        before(() => {
            getDisputeDetailsFake.withArgs('PP-R-EGT-10085693').returns({
                dispute_id: 'PP-R-EGT-10085693',
                dispute_amount: { currency_code: 'USD', value: '90.00' },
                status: 'OPEN',
                messages: [{ posted_by: 'BUYER', content: 'Test message' }]
            });

            getDisputeDetailsFake.withArgs('PP-R-EGT-10085692').returns({
                dispute_id: 'PP-R-EGT-10085692',
                dispute_amount: { currency_code: 'USD', value: '90.00' },
                status: 'RESOLVED'
            });
        });

        after(() => {
            getDisputeDetailsFake.reset();
            getDisputeDetailsFake.resetBehavior();
        });

        it('should return dispute details with messages', () => {
            expect(disputeHelper.getDisputeFromPayPal('PP-R-EGT-10085693'))
                .to.deep.equal({
                    dispute_id: 'PP-R-EGT-10085693',
                    dispute_amount: { currency_code: 'USD', value: '90.00' },
                    status: 'OPEN',
                    messages: [{ posted_by: 'BUYER', content: 'Test message' }],
                    history: []
                });
        });

        it('should return dispute details without messages', () => {
            expect(disputeHelper.getDisputeFromPayPal('PP-R-EGT-10085692'))
                .to.deep.equal({
                    dispute_id: 'PP-R-EGT-10085692',
                    dispute_amount: { currency_code: 'USD', value: '90.00' },
                    status: 'RESOLVED',
                    messages: [],
                    history: []
                });
        });
    });

    describe('getDisputeFromCustomObject', () => {
        before(() => {
            isJsonFake.returns(true);
            isJsonFake.withArgs(undefined).returns(false);
            isJsonFake.withArgs('undefined').returns(false);

            getCustomObjectFake.withArgs('PayPalDisputes', 'PP-R-EGT-10085692').returns(null);
            getCustomObjectFake.withArgs('PayPalDisputes', 'PP-R-EGT-10085693').returns({
                custom: {
                    dispute_id: 'PP-R-EGT-10085693',
                    amount: '90.00',
                    status: 'OPEN',
                    currency_code: 'USD'
                }
            });
            getCustomObjectFake.withArgs('PayPalDisputes', 'PP-R-EGT-10085694').returns({
                custom: {
                    dispute_id: 'PP-R-EGT-10085694',
                    amount: '90.00',
                    status: 'OPEN',
                    currency_code: 'USD',
                    messages: JSON.stringify([{ posted_by: 'BUYER', content: 'Test message' }])
                }
            });
        });

        after(() => {
            isJsonFake.reset();
            getCustomObjectFake.reset();
        });

        it('should return null', () => {
            expect(disputeHelper.getDisputeFromCustomObject('PP-R-EGT-10085692')).to.be.null;
        });

        it('should return an object where history and messages are empty array', () => {
            expect(disputeHelper.getDisputeFromCustomObject('PP-R-EGT-10085693'))
                .to.deep.equal({
                    dispute_id: 'PP-R-EGT-10085693',
                    amount: '90.00',
                    status: 'OPEN',
                    currency_code: 'USD',
                    history: [],
                    messages: []
                });
        });

        it('should return an object where messages already has data', () => {
            expect(disputeHelper.getDisputeFromCustomObject('PP-R-EGT-10085694'))
                .to.deep.equal({
                    dispute_id: 'PP-R-EGT-10085694',
                    amount: '90.00',
                    status: 'OPEN',
                    currency_code: 'USD',
                    history: [],
                    messages: [{ posted_by: 'BUYER', content: 'Test message' }]
                });
        });
    });

    describe('getDisputesFromPayPal', () => {
        after(() => {
            getDisputesFake.reset();
        });

        it('should recive list of disputes from PayPal API', () => {
            getDisputesFake.returns({
                items: listOfDisputes
            });

            expect(disputeHelper.getDisputesFromPayPal()).to.deep.equals(listOfDisputes);
        });
    });

    describe('getDisputesFromCustomObject', () => {
        after(() => {
            queryCustomObjectsFake.reset();
        });

        it('should return a list of all disputes from custom object when there are no searchType and searchQuery', () => {
            queryCustomObjectsFake.withArgs('PayPalDisputes', '', 'custom.create_time desc').returns(dw.util.SeekableIterator);

            expect(disputeHelper.getDisputesFromCustomObject(undefined, undefined)).to.be.equal(dw.util.SeekableIterator);
        });

        it('should return a list of specific disputes from custom object when searchType and searchQuery are passed', () => {
            queryCustomObjectsFake.withArgs('PayPalDisputes', 'custom.disputeStatus={0}', 'custom.create_time desc', 'WAITING_FOR_SELLER_RESPONSE').returns(dw.util.SeekableIterator);

            expect(disputeHelper.getDisputesFromCustomObject('custom.disputeStatus', 'WAITING_FOR_SELLER_RESPONSE')).to.be.equal(dw.util.SeekableIterator);
        });
    });

    describe('formattedDispute', () => {
        let dispute = {
            dispute_id: 'PP-R-ZZX-10084825',
            create_time: '2023-09-22T08:47:21.000Z',
            update_time: '2023-09-22T09:42:43.000Z',
            reason: 'UNAUTHORISED',
            status: 'WAITING_FOR_BUYER_RESPONSE',
            currency_code: 'USD',
            amount: '34.48'
        };

        before(() => {
            formattedDateFake.returns('9/22/23 8:53 am');

            MoneyStub.withArgs('34.48', 'USD').returns({
                toFormattedString: () => '$34.48'
            });
        });

        after(() => {
            MoneyStub.reset();
            formattedDateFake.reset();
        });

        it('should return formatted dispute for PayPalP API data', () => {
            expect(disputeHelper.formattedDispute(dispute))
                .that.deep.equals({
                    dispute_id: 'PP-R-ZZX-10084825',
                    create_time: '9/22/23 8:53 am',
                    update_time: '9/22/23 8:53 am',
                    reason: 'UNAUTHORISED',
                    status: 'WAITING_FOR_BUYER_RESPONSE',
                    currency_code: 'USD',
                    amount: '$34.48'
                });
        });

        it('should return formatted dispute for Custom Object data', () => {
            dispute = listOfDisputes[0];

            expect(disputeHelper.formattedDispute(dispute))
                .that.deep.equals({
                    dispute_id: 'PP-R-LVV-10084826',
                    create_time: '9/22/23 8:53 am',
                    update_time: '9/22/23 8:53 am',
                    reason: 'UNAUTHORISED',
                    status: 'WAITING_FOR_SELLER_RESPONSE',
                    dispute_amount: { currency_code: 'USD', value: '34.48' },
                    amount: '$34.48'
                });
        });
    });

    describe('addOrderToDisputeTransactions', () => {
        let getOrderStub;
        let searchOrderStub;

        const dispute = {
            dispute_id: 'PP-R-EGT-10085693',
            status: 'OPEN',
            amount: '50.00',
            disputed_transactions: [{
                invoice_number: '00025112',
                seller_transaction_id: '2CH44550MJ846550B'
            }]
        };

        before(() => {
            getOrderStub = stub(dw.order.OrderMgr, 'getOrder');
            searchOrderStub = stub(dw.order.OrderMgr, 'searchOrder');

            getOrderStub.withArgs('00025111').returns(null);
            getOrderStub.withArgs('00025112').returns({
                orderNo: '00025112',
                custom: {
                    PP_API_TransactionID: '2CH44550MJ846550B'
                }
            });

            searchOrderStub.withArgs('custom.PP_API_TransactionID = {0}', '2CH44550MJ846550A').returns(null);
            searchOrderStub.withArgs('custom.PP_API_TransactionID = {0}', '2CH44550MJ846550B').returns({
                orderNo: '00025112',
                custom: {
                    PP_API_TransactionID: '2CH44550MJ846550B'
                }
            });
        });

        beforeEach(() => {
            if ('disputed_transactions' in dispute && dispute.disputed_transactions.length) {
                delete dispute.disputed_transactions[0].order;
            }
        });

        after(() => {
            getOrderStub.restore();
            searchOrderStub.restore();
        });

        it('should add order details to transaction object if the order is found by invoice_number', () => {
            expect(disputeHelper.addOrderToDisputeTransactions(dispute))
                .to.deep.equal(dispute);
        });

        it('should add order null to transaction object if the order is not found by invoice_number', () => {
            dispute.disputed_transactions[0].invoice_number = '00025111';

            expect(disputeHelper.addOrderToDisputeTransactions(dispute))
                .to.deep.equal(dispute);
        });

        it('should add order details to transaction object if the order is found by seller_transaction_id', () => {
            delete dispute.disputed_transactions[0].invoice_number;

            expect(disputeHelper.addOrderToDisputeTransactions(dispute))
                .to.deep.equal(dispute);
        });

        it('should add order null to transaction object if the order is not found by seller_transaction_id', () => {
            dispute.disputed_transactions[0].seller_transaction_id = '2CH44550MJ846550A';

            expect(disputeHelper.addOrderToDisputeTransactions(dispute))
                .to.deep.equal(dispute);
        });

        it('should return transaction object if not passed invoice_number or seller_transaction_id', () => {
            delete dispute.disputed_transactions[0].seller_transaction_id;

            expect(disputeHelper.addOrderToDisputeTransactions(dispute))
                .to.deep.equal(dispute);
        });

        it('should return the same object that was passed if disputed_transactions is an empty array list', () => {
            dispute.disputed_transactions = [];

            expect(disputeHelper.addOrderToDisputeTransactions(dispute)).to.deep.equal(dispute);
        });

        it('should return the same object that was passed if disputed_transactions not present in dispute details', () => {
            delete dispute.disputed_transactions;

            expect(disputeHelper.addOrderToDisputeTransactions(dispute)).to.deep.equal(dispute);
        });
    });

    describe('hasFullHistory', () => {
        const dispute = {
            dispute_id: 'PP-R-EGT-10085693',
            status: 'RESOLVED',
            messages: [],
            history: [{ status: 'OPEN' }, { status: 'RESOLVED' }]
        };

        it('should return true if OPEN status is found in history', () => {
            expect(disputeHelper.hasFullHistory(dispute)).to.be.true;
        });

        it('should return false if no OPEN status is found in history', () => {
            dispute.history[0].status = 'UNDER_REVIEW';

            expect(disputeHelper.hasFullHistory(dispute)).to.be.false;
        });
    });

    describe('getDispute', () => {
        before(() => {
            stub(disputeHelper, 'getDisputeFromPayPal').returns({
                dispute_id: 'PP-R-EGT-10085692',
                status: 'OPEN',
                dispute_amount: { currency_code: 'USD', value: '50.00' },
                messages: [],
                disputed_transactions: [{
                    invoice_number: '00025112',
                    seller_transaction_id: '2CH44550MJ846550B'
                }]
            });

            stub(disputeHelper, 'getDisputeFromCustomObject').returns({
                dispute_id: 'PP-R-EGT-10085692',
                status: 'OPEN',
                amount: '50.00',
                currency_code: 'USD',
                history: [],
                messages: []
            });
        });

        after(() => {
            disputeHelper.getDisputeFromPayPal.restore();
            disputeHelper.getDisputeFromCustomObject.restore();

            prefs.simplifiedDisputePage = false;
        });

        it('should return an object only from PayPal API if simplifiedDisputePage = true', () => {
            prefs.simplifiedDisputePage = true;

            expect(disputeHelper.getDispute('PP-R-EGT-10085692')).to.deep.equal({
                dispute_amount: {
                    currency_code: 'USD',
                    value: '50.00'
                },
                dispute_id: 'PP-R-EGT-10085692',
                disputed_transactions: [
                    {
                        invoice_number: '00025112',
                        order: undefined,
                        seller_transaction_id: '2CH44550MJ846550B'
                    }
                ],
                messages: [],
                status: 'OPEN'
            });
        });

        it('should return a mixed object of data from PayPal API and Custom Object if simplifiedDisputePage = false', () => {
            prefs.simplifiedDisputePage = false;

            expect(disputeHelper.getDispute('PP-R-EGT-10085692')).to.deep.equal({
                dispute_amount: {
                    currency_code: 'USD',
                    value: '50.00'
                },
                dispute_id: 'PP-R-EGT-10085692',
                disputed_transactions: [
                    {
                        invoice_number: '00025112',
                        order: undefined,
                        seller_transaction_id: '2CH44550MJ846550B'
                    }
                ],
                history: [],
                messages: [],
                status: 'OPEN'
            });
        });
    });

    describe('updateDisputeCO', () => {
        const disputePP = {
            update_time: '2023-11-01T15:51:33.886Z',
            reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
            status: 'WAITING_FOR_BUYER_RESPONSE'
        };

        const disputeCO = {
            custom: {
                update_time: '',
                reason: '',
                status: ''
            }
        };

        before(() => {
            getCustomObjectFake.withArgs('PayPalDisputes', disputePP.dispute_id).returns(disputeCO);
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            getCustomObjectFake.reset();
            dw.system.Transaction.wrap.restore();
        });

        afterEach(() => {
            dw.system.Transaction.wrap.reset();
            disputeCO.custom = {
                update_time: '',
                reason: '',
                status: ''
            };
        });

        it('should update dispute of Custom Object from PayPal dispute ', () => {
            expect(disputeHelper.updateDisputeCO(disputePP)).to.be.undefined;
            expect(dw.system.Transaction.wrap.calledOnce).to.be.true;
            expect(disputePP).to.deep.equal(disputeCO.custom);
        });

        it('should return undefined if no disputePP', () => {
            expect(disputeHelper.updateDisputeCO(undefined)).to.be.undefined;
            expect(dw.system.Transaction.wrap.calledOnce).to.be.false;
        });
    });

    describe('getDisputes', () => {
        let SeekableIteratorStub;
        let createDisputesStub;
        let getDisputesFromPayPalStub;
        let getDisputesFromCustomObjectStub;

        const hm = {
            disputeStatus: {
                submitted: false,
                stringValue: 'disputeStatus'
            },
            disputeReason: {
                submitted: false,
                stringValue: 'disputeReason'
            },
            disputeId: {
                submitted: false,
                stringValue: 'disputeId'
            }
        };

        before(() => {
            MoneyStub.withArgs('34.48', 'USD').returns({
                toFormattedString: () => '$34.48'
            });

            formattedDateFake.returns('9/22/23 8:53 am');

            createDisputesStub = stub(disputeHelper, 'createDisputes');
            getDisputesFromPayPalStub = stub(disputeHelper, 'getDisputesFromPayPal');
            getDisputesFromCustomObjectStub = stub(disputeHelper, 'getDisputesFromCustomObject');

            getDisputesFromPayPalStub.returns(listOfDisputes);

            SeekableIteratorStub = createStubInstance(dw.util.SeekableIterator);

            SeekableIteratorStub.asList.returns({
                toArray: () => [{
                    custom: {
                        dispute_id: 'PP-R-LVV-10084826',
                        create_time: '2023-09-22T08:53:53.000Z',
                        update_time: '2023-09-22T09:28:33.000Z',
                        reason: 'UNAUTHORISED',
                        status: 'WAITING_FOR_SELLER_RESPONSE',
                        currency_code: 'USD',
                        amount: '34.48'
                    }
                }]
            });

            getDisputesFromCustomObjectStub.returns(SeekableIteratorStub);
        });

        after(() => {
            formattedDateFake.reset();
            createDisputesStub.restore();
            getDisputesFromPayPalStub.restore();
            getDisputesFromCustomObjectStub.restore();

            MoneyStub.reset();
        });

        afterEach(() => {
            prefs.simplifiedDisputePage = false;
        });

        it('should return list of disputes from PayPal API', () => {
            prefs.simplifiedDisputePage = true;

            expect(disputeHelper.getDisputes(hm))
                .to.be.an('array')
                .that.deep.equals(listOfDisputes);
        });

        it('should return list of disputes from Custom Object', () => {
            prefs.simplifiedDisputePage = false;

            expect(disputeHelper.getDisputes(hm))
                .to.be.an('array')
                .that.deep.equals([
                    {
                        dispute_id: 'PP-R-LVV-10084826',
                        create_time: '9/22/23 8:53 am',
                        update_time: '9/22/23 8:53 am',
                        reason: 'UNAUTHORISED',
                        status: 'WAITING_FOR_SELLER_RESPONSE',
                        currency_code: 'USD',
                        amount: '$34.48'
                    }
                ]);
        });

        it('should return list of disputes from PayPal API if simplifiedDisputePage is disabled and count equal to (0) zero', () => {
            prefs.simplifiedDisputePage = false;

            getDisputesFromCustomObjectStub.returns({
                count: 0
            });

            expect(disputeHelper.getDisputes(hm))
                .to.be.an('array')
                .that.deep.equals([
                    {
                        dispute_id: 'PP-R-LVV-10084826',
                        create_time: '9/22/23 8:53 am',
                        update_time: '9/22/23 8:53 am',
                        reason: 'UNAUTHORISED',
                        status: 'WAITING_FOR_SELLER_RESPONSE',
                        dispute_amount: { currency_code: 'USD', value: '34.48' },
                        amount: '$34.48'
                    },
                    {
                        dispute_id: 'PP-R-ZZX-10084825',
                        create_time: '9/22/23 8:53 am',
                        update_time: '9/22/23 8:53 am',
                        reason: 'UNAUTHORISED',
                        status: 'WAITING_FOR_BUYER_RESPONSE',
                        dispute_amount: { currency_code: 'USD', value: '34.48' },
                        amount: '$34.48'
                    }
                ]);

            expect(createDisputesStub.calledOnce).to.be.true;
        });
    });

    describe('getUniqueStatuses', () => {
        let next;
        let hasNext;
        let iterator;

        before(() => {
            iterator = stub(disputeHelper, 'getDisputesFromCustomObject');
        });

        beforeEach(() => {
            next = stub();
            hasNext = stub();

            iterator.returns({
                next: next,
                hasNext: hasNext
            });
        });

        after(() => {
            iterator.restore();
        });

        it('should handle different statuses', () => {
            hasNext.onCall(0).returns(true).onCall(1).returns(true)
                .onCall(2)
                .returns(false);
            next.onCall(0).returns({ custom: { status: 'A' } });
            next.onCall(1).returns({ custom: { status: 'B' } });

            const val = disputeHelper.getUniqueStatuses();

            expect(val).to.deep.equal({
                'A': { count: 1, value: 'A', label: 'Parsed A' },
                'B': { count: 1, value: 'B', label: 'Parsed B' }
            });
        });

        it('should increment count for the same status', () => {
            hasNext.onCall(0).returns(true).onCall(1).returns(true)
                .onCall(2)
                .returns(false);
            next.onCall(0).returns({ custom: { status: 'A' } });
            next.onCall(1).returns({ custom: { status: 'A' } });

            const val = disputeHelper.getUniqueStatuses();

            expect(val).to.deep.equal({
                'A': { count: 2, value: 'A', label: 'Parsed A' }
            });
        });

        it('should handle dispute without status', () => {
            hasNext.onCall(0).returns(true).onCall(1).returns(false);
            next.onCall(0).returns({ custom: {} });

            const val = disputeHelper.getUniqueStatuses();

            expect(val).to.deep.equal({
                'undefined': { count: 1, value: undefined, label: 'N/A' }
            });
        });

        it('should handle empty iterator', () => {
            hasNext.returns(false);

            const val = disputeHelper.getUniqueStatuses();

            expect(val).to.deep.equal({});
        });
    });

    describe('getDiffsForUpdate', () => {
        before(() => {
            getCustomObjectFake.returns(null);

            getCustomObjectFake.withArgs('PayPalDisputes', 'PP-R-LVV-10084826').returns({
                custom: {
                    dispute_id: 'PP-R-LVV-10084826',
                    status: 'OPEN',
                    reason: 'UNAUTHORISED',
                    update_time: '25/10/2023 2:07 pm'
                }
            });

            getDisputeDetailsFake.withArgs('PP-R-LVV-10084826').returns({
                dispute_id: 'PP-R-LVV-10084826',
                status: 'OPEN',
                reason: 'UNAUTHORISED',
                update_time: '25/10/2023 2:07 pm'
            });
        });

        after(() => {
            formattedDateFake.reset();
            getCustomObjectFake.reset();
            getDisputeDetailsFake.reset();
        });

        it('should return an empty object if cannot find dispute from custom object', () => {
            expect(disputeHelper.getDiffsForUpdate('PP-R-LVV-10084825')).to.deep.equal({});
        });

        it('should return an empty object if no differences can be found between PayPal API and Custom Object data', () => {
            expect(disputeHelper.getDiffsForUpdate('PP-R-LVV-10084826')).to.deep.equal({});
        });

        it('should return an object with differences between PayPal API and Custom Object data', () => {
            getCustomObjectFake.withArgs('PayPalDisputes', 'PP-R-LVV-10084826').returns({
                custom: {
                    dispute_id: 'PP-R-LVV-10084826',
                    status: 'OPEN',
                    reason: 'UNAUTHORISED',
                    update_time: '25/10/2023 2:07 pm'
                }
            });

            getDisputeDetailsFake.withArgs('PP-R-LVV-10084826').returns({
                dispute_id: 'PP-R-LVV-10084826',
                status: 'UNDER_REVIEW',
                reason: 'INCORRECT_AMOUNT',
                update_time: '25/10/2023 3:07 pm'
            });

            formattedDateFake.withArgs('25/10/2023 2:07 pm').returnsArg(0);
            formattedDateFake.withArgs('25/10/2023 3:07 pm').returnsArg(0);

            expect(disputeHelper.getDiffsForUpdate('PP-R-LVV-10084826')).to.deep.equal({
                reason: 'INCORRECT_AMOUNT',
                status: 'UNDER_REVIEW',
                update_time: '25/10/2023 3:07 pm'
            });
        });
    });

    describe('getSearchParams', () => {
        let hm = {};

        it('should return object with empty searchType and searchQuery if no value was submitted', () => {
            hm = {
                disputeStatus: {
                    submitted: false,
                    stringValue: 'WAITING_FOR_SELLER_RESPONSE'
                },
                disputeReason: {
                    submitted: false,
                    stringValue: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
                },
                disputeId: {
                    submitted: false,
                    stringValue: 'PP-R-NGE-10085886'
                }
            };

            expect(disputeHelper.getSearchParams(hm)).to.deep.equal({
                searchType: undefined,
                searchQuery: undefined
            });
        });

        it('should return object with searchType and searchQuery for byDisputeStatus search', () => {
            hm = {
                disputeStatus: {
                    submitted: true,
                    stringValue: 'WAITING_FOR_SELLER_RESPONSE'
                },
                disputeReason: {
                    submitted: false,
                    stringValue: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
                },
                disputeId: {
                    submitted: false,
                    stringValue: 'PP-R-NGE-10085886'
                }
            };

            expect(disputeHelper.getSearchParams(hm)).to.deep.equal({
                searchType: 'custom.status',
                searchQuery: 'WAITING_FOR_SELLER_RESPONSE'
            });
        });

        it('should return object with searchType and searchQuery for byDisputeReason search', () => {
            hm = {
                disputeStatus: {
                    submitted: false,
                    stringValue: 'WAITING_FOR_SELLER_RESPONSE'
                },
                disputeReason: {
                    submitted: true,
                    stringValue: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
                },
                disputeId: {
                    submitted: false,
                    stringValue: 'PP-R-NGE-10085886'
                }
            };

            expect(disputeHelper.getSearchParams(hm)).to.deep.equal({
                searchType: 'custom.reason',
                searchQuery: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
            });
        });

        it('should return object with searchType and searchQuery for byDisputeID search', () => {
            hm = {
                disputeStatus: {
                    submitted: false,
                    stringValue: 'WAITING_FOR_SELLER_RESPONSE'
                },
                disputeReason: {
                    submitted: false,
                    stringValue: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
                },
                disputeId: {
                    submitted: true,
                    stringValue: 'PP-R-NGE-10085886'
                }
            };

            expect(disputeHelper.getSearchParams(hm)).to.deep.equal({
                searchType: 'custom.dispute_id',
                searchQuery: 'PP-R-NGE-10085886'
            });
        });
    });

    describe('getAvailableDisputeReasons ', () => {
        let next;
        let hasNext;
        let iterator;

        before(() => {
            iterator = stub(disputeHelper, 'getDisputesFromCustomObject');
        });

        beforeEach(() => {
            next = stub();
            hasNext = stub();

            iterator.returns({
                next: next,
                hasNext: hasNext
            });
        });

        after(() => {
            iterator.restore();
        });

        it('should handle empty iterator', () => {
            hasNext.returns(false);

            const val = disputeHelper.getAvailableDisputeReasons();

            expect(val).to.deep.equal([]);
        });

        it('should handle different reasons', () => {
            hasNext.onCall(0).returns(true).onCall(1).returns(true)
                .onCall(2)
                .returns(false);
            next.onCall(0).returns({ custom: { reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED' } });
            next.onCall(1).returns({ custom: { reason: 'UNAUTHORISED' } });

            const val = disputeHelper.getAvailableDisputeReasons();

            expect(val).to.deep.equal([{
                count: 1,
                value: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
                label: 'Parsed MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
            },
            {
                count: 1,
                value: 'UNAUTHORISED',
                label: 'Parsed UNAUTHORISED'
            }]);
        });

        it('should do nothing if reason is already written to the array', () => {
            hasNext.onCall(0).returns(true).onCall(1).returns(true)
                .onCall(2)
                .returns(false);
            next.onCall(0).returns({ custom: { reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED' } });
            next.onCall(1).returns({ custom: { reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED' } });

            const val = disputeHelper.getAvailableDisputeReasons();

            expect(val).to.deep.equal([{
                count: 1,
                value: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
                label: 'Parsed MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
            }]);
        });
    });

    describe('generateDisputeSearchOptions', () => {
        const listOfDisputeStates = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'OTHER'];
        const expectedOutput = [
            { value: 'OPEN', label: 'Parsed OPEN' },
            { value: 'OTHER', label: 'Parsed OTHER' },
            { value: 'RESOLVED', label: 'Parsed RESOLVED' },
            { value: 'UNDER_REVIEW', label: 'Parsed UNDER_REVIEW' }
        ];

        it('should return sorted list of parsed search queries', () => {
            const result = disputeHelper.generateDisputeSearchOptions(listOfDisputeStates);

            expect(result).to.deep.equal(expectedOutput);
        });

        it('should correctly handle an already sorted list', () => {
            const sortedStates = ['OPEN', 'OTHER', 'RESOLVED', 'UNDER_REVIEW'];
            const result = disputeHelper.generateDisputeSearchOptions(sortedStates);

            expect(result).to.deep.equal(expectedOutput);
        });

        it('should return an empty list for an empty input', () => {
            const result = disputeHelper.generateDisputeSearchOptions([]);

            expect(result).to.deep.equal([]);
        });
    });
});
