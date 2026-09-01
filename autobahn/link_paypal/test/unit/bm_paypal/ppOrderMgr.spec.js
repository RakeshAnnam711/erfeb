/* eslint-disable no-underscore-dangle */
const { bm_paypal: { ppOrderMgrPath } } = require('../path.json');

const { expect } = require('chai');
const {
    it, describe, before, after
} = require('mocha');

const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const getOrderDetails = stub();
const createErrorLog = stub();
const getPaymentStatus = stub();
const getPaymentMethodId = stub();
const getPaypalPaymentInstrument = stub();
const getOrder = stub();
const searchOrders = stub();
const getPaymentMethodsIdWithPaypalProcessor = stub();

let arrayList = {
    arr: [],
    push: (el) => arrayList.arr.push(el),
    sort: () => {},
    toArray: () => [{
        custom: { orderNo: '0000' },
        orderNo: '0000'
    }]
};

const ppOrderMgr = proxyquire(ppOrderMgrPath, {
    'dw/util/ArrayList': function() {
        return arrayList;
    },
    'dw/util/StringUtils': {
        formatCalendar: () => '09-11-2022'
    },
    'dw/util/PropertyComparator': function() {},
    'dw/value/Money': function() {
        return 5;
    },
    'dw/util/Calendar': function() {},
    'dw/order/Order': {
        PAYMENT_STATUS_PAID: 'PAID'
    },
    'dw/order/OrderMgr': {
        searchOrders,
        getOrder
    },
    'dw/system/Transaction': dw.system.Transaction,
    'dw/web/Resource': dw.web.Resource,
    'dw/order/PaymentInstrument': dw.order.PaymentInstrument,
    '~/cartridge/scripts/paypal/paymentInstrumentHelpers': {
        getPaymentMethodId,
        getPaypalPaymentInstrument,
        getPaymentMethodsIdWithPaypalProcessor
    },
    '~/cartridge/scripts/paypal/helpers': {
        getPaymentStatus,
        getReadablePaymentMethod: (val) => val
    },
    '~/cartridge/scripts/paypal/utils': {
        createErrorLog
    },
    '~/cartridge/config/constants': {
        STATUS_COMPLETED: 'COMPLETED',
        STATUS_REFUNDED: 'REFUNDED',
        ALLOWED_PROCESSORS_IDS: ['PAYPAL', 'PAYPAL_LOCAL'],
        LOCAL_PAYMENT_METHOD_ABBR: 'LPM',
        LIST_OF_LOCAL_PAYMENT_METHODS: ['bancontact', 'blik', 'eps', 'ideal', 'mybank', 'p24'],
        NOT_APPLICABLE_SHORT: 'N/A',
        ALL_STATUSES: 'ALL'
    },
    '~/cartridge/models/ppOrder': function() {
        return {
            getTransactionIdFromOrder: () => 'transaction-id'
        };
    },
    '~/cartridge/scripts/paypal/api/restApiWrapper': function() {
        return { getOrderDetails };
    }
});

describe('ppOrderMgr file', function() {
    describe('getOrders', () => {
        const getOrders = ppOrderMgr.__get__('getOrders');

        const hasNextSystem = stub();
        const hasNextPP = stub();
        const close = stub();

        hasNextSystem.onFirstCall().returns(true);
        hasNextPP.onFirstCall().returns(true);
        hasNextSystem.onSecondCall().returns(false);
        hasNextPP.onSecondCall().returns(false);

        before(() => {
            searchOrders.returns({
                hasNext: hasNextSystem,
                next: () => ({
                    creationDate: '2022-11-09',
                    orderToken: 'token',
                    orderNo: '0000',
                    createdBy: 'test',
                    customer: { registered: true },
                    customerName: 'name',
                    customerEmail: 'email',
                    totalGrossPrice: 100,
                    status: { displayValue: 'CANCELLED' },
                    custom: {},
                    externalOrderNo: 'O-9RR85649FD345344Y',
                    getCurrencyCode: () => 'USD',
                    getPaymentInstruments: () => {}
                }),
                close: close
            });

            getPaypalPaymentInstrument.returns({
                custom: { paypalPaymentStatus: 'VOIDED' },
                getPaymentTransaction: () => ({ getAmount: () => 100 }),
                paymentMethod: 'PayPal'
            });

            getPaymentMethodsIdWithPaypalProcessor.returns([
                'PayPal', 'PAYPAL_CREDIT_CARD'
            ]);
        });

        after(() => {
            searchOrders.reset();
            getPaypalPaymentInstrument.reset();
            getPaymentMethodsIdWithPaypalProcessor.reset();
        });

        afterEach(() => {
            hasNextSystem.reset();

            arrayList = {
                arr: [],
                push: (el) => arrayList.arr.push(el),
                sort: () => { },
                toArray: () => [{
                    custom: { orderNo: '0000' },
                    orderNo: '0000'
                }]
            };
        });

        it('if paypalOrdersCount < maxPaypalOrdersCount and orders returned', () => {
            const result = getOrders();

            expect(result.arr).to.be.an('array');
            expect(result.arr).to.have.length(1);
            expect(result.arr[0]).to.have.all.keys('orderToken', 'orderNo', 'orderDate', 'createdBy', 'isRegistered', 'customer', 'email', 'orderTotal', 'currencyCode', 'paypalAmount', 'paymentMethod', 'status', 'dateCompare', 'disputeId', 'UUID');
        });

        it('if no orders returned', () => {
            hasNextSystem.onSecondCall().returns(true);
            hasNextSystem.onThirdCall().returns(false);

            const result = getOrders('000', 'N/A');

            expect(result.arr).to.be.an('array');
            expect(result.arr).to.have.length(0);
        });

        it('should skip orders with unsupported payment method', () => {
            getPaypalPaymentInstrument.returns({
                custom: { paypalPaymentStatus: 'VOIDED' },
                paymentMethod: 'CreditCard'
            });

            const result = getOrders();

            expect(result.arr).to.be.an('array');
            expect(result.arr).to.have.length(0);
        });

        it('should skip orders with a different payment status', () => {
            getPaypalPaymentInstrument.returns({
                custom: { paypalPaymentStatus: 'AUTHORIZED' },
                paymentMethod: 'PayPal'
            });

            const result = getOrders('000', 'COMPLETED');

            expect(result.arr).to.be.an('array');
            expect(result.arr).to.have.length(0);
        });

        it('should set paymentStatus to null if paymentStatus is NOT_APPLICABLE_SHORT', () => {
            getPaypalPaymentInstrument.returns({
                custom: { paypalPaymentStatus: null },
                getPaymentTransaction: () => ({ getAmount: () => 100 }),
                paymentMethod: 'PayPal'
            });

            const result = getOrders('PayPal', 'N/A');

            expect(result.arr).to.be.an('array');
        });

        it('should skip order if no paymentInstrument returned', () => {
            getPaypalPaymentInstrument.returns(undefined);

            const result = getOrders();

            expect(result.arr).to.be.an('array').that.is.empty;
        });

        it('should skip order if payment status does not match and !== ALL_STATUSES', () => {
            getPaypalPaymentInstrument.returns({
                custom: { paypalPaymentStatus: 'COMPLETED' },
                getPaymentTransaction: () => ({ getAmount: () => 100 }),
                paymentMethod: 'PayPal'
            });

            const result = getOrders('PayPal', 'REFUNDED');

            expect(result.arr).to.be.an('array').that.is.empty;
        });

        it('should skip order if paymentStatus does not match and !== ALL_STATUSES', () => {
            getPaypalPaymentInstrument.returns({
                custom: { paypalPaymentStatus: 'AUTHORIZED' },
                paymentMethod: 'PayPal',
                getPaymentTransaction: () => ({ getAmount: () => 100 })
            });

            const result = getOrders('0000', 'COMPLETED');

            expect(result.arr).to.be.an('array').that.is.empty;
        });
    });

    describe('updateOrderStatus', () => {
        const updateOrderStatus = ppOrderMgr.__get__('updateOrderStatus');
        const setPaymentStatus = stub();

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.withArgs('transaction.details.error', 'errors', null).returns('Details error');

            getPaypalPaymentInstrument.returns({
                custom: {},
                getCustom: () => ({
                    paypalOrderID: 'id'
                })
            });
            getOrder.returns({
                setPaymentStatus
            });
        });

        after(() => {
            getOrder.reset();
            getPaypalPaymentInstrument.reset();
            getPaymentStatus.reset();

            dw.web.Resource.msg.restore();
        });

        afterEach(() => {
            createErrorLog.reset();
            getOrderDetails.reset();
            setPaymentStatus.reset();
        });

        it('if error was thrown', () => {
            getOrderDetails.returns({
                err: true
            });

            expect(() => updateOrderStatus()).to.throw(Error, 'Details error');
            expect(createErrorLog.calledOnce).to.be.true;
        });

        it('if order status was successfully updated and payment status was set', () => {
            getOrderDetails.returns({
                err: false
            });
            getPaymentStatus.returns('REFUNDED');

            updateOrderStatus();

            expect(createErrorLog.calledOnce).to.be.false;
            expect(setPaymentStatus.calledWith('PAID')).to.be.true;
        });

        it('if order status was successfully updated', () => {
            getOrderDetails.returns({
                err: false
            });
            getPaymentStatus.returns('VOIDED');

            updateOrderStatus();

            expect(createErrorLog.calledOnce).to.be.false;
            expect(setPaymentStatus.calledOnce).to.be.false;
        });
    });

    describe('OrderMgrModel', () => {
        it('OrderMgrModel should be a function', () => {
            expect(ppOrderMgr).to.be.a('function');
            expect(ppOrderMgr()).to.equal(undefined);
        });
    });

    describe('getOrderByOrderNo', () => {
        before(() => {
            ppOrderMgr.__set__('getOrders', () => ({}));
        });

        after(() => {
            ppOrderMgr.__ResetDependency__('getOrders');
        });

        it('if orders was successfully returned', () => {
            expect(ppOrderMgr.prototype.getOrderByOrderNo()).to.deep.equal({});
        });
    });

    describe('getOrderByTransactionId', () => {
        before(() => {
            ppOrderMgr.__set__('getOrders', () => ({}));
        });

        after(() => {
            searchOrders.reset();
            ppOrderMgr.__ResetDependency__('getOrders');
        });

        it('if orderNo got from paypalOrder', () => {
            searchOrders.returns({
                count: 0
            });

            expect(ppOrderMgr.prototype.getOrderByTransactionId()).to.deep.equal({});
        });

        it('if orderNo got from systemOrder', () => {
            searchOrders.returns({
                count: 1
            });

            expect(ppOrderMgr.prototype.getOrderByTransactionId()).to.deep.equal({});
        });
    });

    describe('getAllOrders', () => {
        before(() => {
            ppOrderMgr.__set__('getOrders', () => ({}));
        });

        after(() => {
            ppOrderMgr.__ResetDependency__('getOrders');
        });

        it('if all orders successfully returned', () => {
            expect(ppOrderMgr.prototype.getAllOrders()).to.deep.equal({});
        });
    });

    describe('getOrderByPaymentStatus', () => {
        before(() => {
            ppOrderMgr.__set__('getOrders', () => ({}));
        });

        after(() => {
            ppOrderMgr.__ResetDependency__('getOrders');
        });

        it('if all orders successfully returned', () => {
            expect(ppOrderMgr.prototype.getOrderByPaymentStatus()).to.deep.equal({});
        });
    });

    describe('getOrderData', () => {
        const orderNo = '000001';
        const orderToken = 'token';

        const originalGetCustomOrderInfo = ppOrderMgr.prototype.getCustomOrderInfo;

        before(() => {
            ppOrderMgr.prototype.getCustomOrderInfo = () => ({
                order: {}
            });
            getOrder.returns({});
        });

        after(() => {
            ppOrderMgr.prototype.getCustomOrderInfo = originalGetCustomOrderInfo;
            getOrder.reset();
        });

        afterEach(() => {
            createErrorLog.reset();
        });

        it('if order data returned successfully', () => {
            const result = ppOrderMgr.prototype.getOrderData(orderNo, orderToken);

            expect(result).to.be.an('object');
            expect(result.transactionIdFromOrder).to.equal('transaction-id');
            expect(result.order).to.deep.equal({});
        });

        it('if no transaction id from order returned and error was thrown', () => {
            getOrder.returns(undefined);
            expect(() => ppOrderMgr.prototype.getOrderData(orderNo, orderToken)).to.throw(Error);
            expect(createErrorLog.calledOnce).to.be.true;
        });
    });

    describe('updateOrderData', () => {
        const orderNo = '000001';
        const orderToken = 'token';

        before(() => {
            ppOrderMgr.__set__('updateCustomOrderStatus', () => {
                throw new Error();
            });
            ppOrderMgr.__set__('updateOrderStatus', () => { });
        });

        after(() => {
            ppOrderMgr.__ResetDependency__('updateCustomOrderStatus');
            ppOrderMgr.__ResetDependency__('updateOrderStatus');
        });

        afterEach(() => {
            createErrorLog.reset();
        });

        it('if order data successfully updated', () => {
            expect(ppOrderMgr.prototype.updateOrderData(orderNo, orderToken)).to.be.true;
            expect(createErrorLog.calledOnce).to.be.false;
        });
    });

    describe('getPayPalOrdersByQuery', () => {
        const getPayPalOrdersByQuery = ppOrderMgr.__get__('getPayPalOrdersByQuery');

        before(() => {
            searchOrders.returns(dw.util.SeekableIterator);
        });

        after(() => {
            searchOrders.reset();
        });

        it('should return a special iterator, which is returned by the system to iterate through large sets of data', () => {
            expect(getPayPalOrdersByQuery()).that.deep.equal(dw.util.SeekableIterator);
        });
    });

    describe('getSystemOrderFinalObject', () => {
        const getSystemOrderFinalObject = ppOrderMgr.__get__('getSystemOrderFinalObject');
        const order = {
            customer: {
                registered: true
            },
            customerName: 'name',
            customerEmail: 'email',
            totalGrossPrice: {},
            getCurrencyCode: () => '',
            custom: {},
            createdBy: '',
            orderToken: 'token',
            orderDate: 'Z',
            orderNo: '001',
            UUID: 'UUID'
        };

        const paymentInstrument = {
            getPaymentTransaction: () => {
                return {
                    getAmount: () => {
                        return {};
                    }
                };
            },
            paymentMethod: 'PayPal',
            custom: {
                paypalPaymentStatus: 'status'
            }
        };

        before(() => {
            getPaymentMethodId.returns('PayPal');
        });

        after(() => {
            getPaymentMethodId.reset();
        });

        it('should return an object with Paypal system orders', () => {
            expect(getSystemOrderFinalObject(order, paymentInstrument)).that.deep.equal({
                orderToken: order.orderToken,
                orderNo: order.orderNo,
                orderDate: '09-11-2022',
                createdBy: order.createdBy,
                isRegistered: order.customer.registered,
                customer: order.customerName,
                email: order.customerEmail,
                orderTotal: order.totalGrossPrice,
                currencyCode: order.getCurrencyCode(),
                paypalAmount: paymentInstrument.getPaymentTransaction().getAmount(),
                paymentMethod: paymentInstrument.paymentMethod,
                status: paymentInstrument.custom.paypalPaymentStatus,
                dateCompare: NaN,
                disputeId: order.paypalDisputeId,
                UUID: order.UUID
            });
        });
    });

    describe('addOrderNotes', () => {
        const addNote = stub();

        it('should add a note to the order', () => {
            const order = {
                addNote: addNote,
                totalGrossPrice: {
                    value: '35'
                }
            };

            const capturedAmount = 40;

            ppOrderMgr.prototype.addOrderNotes(order, capturedAmount);

            expect(order.addNote.calledOnce).to.be.true;
        });
    });

    describe('getOrdersByPaymentMethod', () => {
        let paymentMethod = 'PayPal';

        const date = new Date();

        const paymentInstrument = {
            custom: {},
            paymentMethod: paymentMethod,
            getPaymentTransaction: () => ({
                getAmount: () => ({
                    value: '40',
                    currencyCode: 'USD'
                })
            })
        };

        const dateRange = { from: date, to: date };
        const next = stub();
        const hasNext = stub();
        const close = stub();
        const getPayPalOrdersByQuery = stub();
        const getPaymentInstruments = stub();

        before(() => {
            ppOrderMgr.__set__('getPayPalOrdersByQuery', getPayPalOrdersByQuery);

            getPayPalOrdersByQuery.returns({
                hasNext: hasNext,
                next: next,
                close: close
            });

            // for LPM
            getPaymentInstruments.returns({
                toArray: () => ([paymentInstrument])
            });

            // for others payment
            getPaymentInstruments.withArgs(paymentMethod).returns({
                toArray: () => ([paymentInstrument])
            });

            hasNext
                .onFirstCall()
                .returns(true)
                .onSecondCall()
                .returns(false);

            next.returns({
                custom: {},
                customer: {
                    registered: false
                },
                creationDate: date,
                getCurrencyCode: () => 'USD',
                getPaymentInstruments
            });
        });

        after(() => {
            ppOrderMgr.__ResetDependency__('getPayPalOrdersByQuery');
            next.reset();
            hasNext.reset();
            getPayPalOrdersByQuery.reset();
            getPaymentInstruments.reset();
            getPaymentMethodId.reset();
        });

        it('should return a list of dw.util.ArrayList instance with specific payment method (Example: PayPal)', () => {
            getPaymentMethodId.returns(paymentMethod);

            expect(ppOrderMgr.prototype.getOrdersByPaymentMethod(paymentMethod, dateRange).arr).to.be.length(1);
        });

        it('should return a list of dw.util.ArrayList instance with specific local payment method (Example: MyBank)', () => {
            paymentMethod = 'LPM';
            paymentInstrument.custom.paymentId = 'mybank';

            arrayList.arr = [];
            hasNext.resetHistory();

            getPaymentMethodId.returns(paymentInstrument.custom.paymentId);

            expect(ppOrderMgr.prototype.getOrdersByPaymentMethod(paymentMethod, dateRange).arr).to.be.length(1);
        });

        it('should return an empty list of dw.util.ArrayList instance', () => {
            arrayList.arr = [];
            hasNext.resetHistory();
            getPaymentInstruments.returns({ toArray: () => ([]) });

            expect(ppOrderMgr.prototype.getOrdersByPaymentMethod(paymentMethod, dateRange).arr).to.be.length(0);
        });
    });
});
