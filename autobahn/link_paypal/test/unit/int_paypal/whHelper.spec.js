const { int_paypal: { whHelperPath } } = require('../path.json');

const { expect } = require('chai');
const {
    describe, it,
    before, after,
    beforeEach, afterEach
} = require('mocha');

const { stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const saveCreditCardToCustomerWallet = stub();
const querySystemObject = stub();
const getOrderByOrderNo = stub();
const getOrder = stub();
const getTransactionStatus = stub();

const getOrderDetails = () => {
    return {
        status: 'success',
        amount: 100
    };
};

const api = {
    getOrderDetails
};

const paymentInstrument = {
    custom: {},
    paymentTransaction: {
        custom: {}
    }
};

const paypalConstants = {
    CUSTOMER_DISPUTE_CREATED: 'CUSTOMER.DISPUTE.CREATED',
    CUSTOMER_DISPUTE_UPDATED: 'CUSTOMER.DISPUTE.UPDATED',
    CUSTOMER_DISPUTE_RESOLVED: 'CUSTOMER.DISPUTE.RESOLVED',
    PAYMENT_STATUS_REFUNDED: 'REFUNDED',
    PAYMENT_STATUS_PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
    PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
    PAYMENT_CAPTURE_REFUNDED: 'PAYMENT.CAPTURE.REFUNDED',
    PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED'
};

const prefs = {
    simplifiedDisputePage: false
};

let createdDispute = {
    custom: {}
};

const whHelper
    = proxyquire(whHelperPath, {
        'dw/system/Transaction': dw.system.Transaction,
        '*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper': {
            getPaypalPaymentInstrument: () => paymentInstrument
        },
        '*/cartridge/scripts/paypal/helpers/paypalHelper': {
            getOrderByOrderNo: getOrderByOrderNo,
            prepareTransactionHistory: () => ([]),
            getTransactionStatus
        },
        'dw/object/CustomObject': dw.object.CustomObject,
        'dw/web/Resource': dw.web.Resource,
        '*/cartridge/config/constants': paypalConstants,
        '*/cartridge/config/preferences': prefs,
        '*/cartridge/scripts/paypal/helpers/creditCardHelper': {
            saveCreditCardToCustomerWallet: saveCreditCardToCustomerWallet
        },
        'dw/object/CustomObjectMgr': {
            getCustomObject: () => null,
            createCustomObject: () => (createdDispute)
        },
        '*/cartridge/scripts/paypal/api': api,
        'dw/object/SystemObjectMgr': {
            querySystemObject
        },
        'dw/order/OrderMgr': {
            getOrder: getOrder
        },
        '*/cartridge/scripts/paypal/helpers/customerHelper': {
            deletePayPalSavedCardsPaymentToken: (profileCustom, creditCardToken) => {
                if (profileCustom.payPalSavedCardsPaymentTokens) {
                    profileCustom.payPalSavedCardsPaymentTokens = profileCustom.payPalSavedCardsPaymentTokens
                        .replace(creditCardToken, '').replace('**', '*');
                }
            }
        }
    });

describe('whHelper', () => {
    it('whHelper is object', () => {
        expect(whHelper).to.be.a('object');
    });

    it('whHelper has own property updateOrderPaymentStatus', () => {
        expect(whHelper).to.haveOwnProperty('updateOrderPaymentStatus');
    });

    it('whHelper.updateOrderPaymentStatus is a function', () => {
        expect(whHelper.updateOrderPaymentStatus).to.be.a('function');
    });

    describe('updateOrderPaymentStatus', () => {
        const responseData = {};

        let order = {};
        let paymentStatus = 'AUTHORIZED';

        before(() => {
            stub(dw.web.Resource, 'msg');

            dw.web.Resource.msg.withArgs('paypal.request.webhook.summary', 'locale', null).returns('The webhook for event notifications from the PayPal REST API has fired.');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('If order is not instance of CustomObject', () => {
            whHelper.updateOrderPaymentStatus(order, paymentStatus, responseData);

            expect(paymentInstrument.custom).to.have.all.keys('paypalPaymentStatus', 'paypalRequest', 'paypalResponse');
            expect(paymentInstrument.custom.paypalPaymentStatus).to.equal('AUTHORIZED');
        });

        it('paypalPaymentStatus should be REFUNDED', () => {
            order = {
                custom: {}
            };
            paymentStatus = 'REFUNDED';

            whHelper.updateOrderPaymentStatus(order, paymentStatus, responseData);

            expect(paymentInstrument.custom.paypalPaymentStatus).to.equal('REFUNDED');
        });

        it('paypalPaymentStatus should be PARTIALLY_REFUNDED', () => {
            order = {
                custom: {}
            };
            paymentStatus = 'PARTIALLY_REFUNDED';

            whHelper.updateOrderPaymentStatus(order, paymentStatus, responseData);

            expect(paymentInstrument.custom.paypalPaymentStatus).to.equal('PARTIALLY_REFUNDED');
        });
    });

    describe('updatePaymentOnDwSide', () => {
        let order;
        let updateOrderPaymentStatusStub;
        let getOrderDetailsStub;
        let getOrderByOrderNoStub;

        const status = 'REFUNDED';

        before(() => {
            updateOrderPaymentStatusStub = stub();
            getOrderDetailsStub = stub(api, 'getOrderDetails').returns({});
            getOrderByOrderNoStub = getOrderByOrderNo;
            getTransactionStatus.returns(status);
            whHelper.__set__('updateOrderPaymentStatus', updateOrderPaymentStatusStub);
        });

        afterEach(() => {
            getOrderDetailsStub.restore();
            getOrderByOrderNoStub.reset();
            getTransactionStatus.resetHistory();
        });

        after(() => {
            updateOrderPaymentStatusStub.reset();
            whHelper.__ResetDependency__('updateOrderPaymentStatus');
        });

        it('should return undefined if orderNo or paymentStatus is missing', () => {
            const eventResource = {};

            const result = whHelper.updatePaymentOnDwSide('event_type', eventResource);

            expect(result).to.be.undefined;
        });

        it('should refund the payment on demandware side', () => {
            const eventResource = {
                invoice_id: 'order_number',
                status: 'REFUNDED'
            };

            const eventType = paypalConstants.PAYMENT_CAPTURE_REFUNDED;

            whHelper.updatePaymentOnDwSide(eventType, eventResource);

            expect(getOrderByOrderNoStub).to.have.been.calledOnce;
        });

        it('should update payment status', () => {
            const eventResource = {
                invoice_id: 'order_number',
                status: 'NEW_STATUS'
            };

            const eventType = {};

            whHelper.updatePaymentOnDwSide(eventType, eventResource);
        });

        it('should call updateOrderPaymentStatus for PAYMENT_CAPTURE_REFUNDED event', () => {
            const eventResource = {
                invoice_id: 'order_number',
                status: 'REFUNDED'
            };

            order = {};

            getOrderByOrderNoStub.returns(order);

            const eventType = paypalConstants.PAYMENT_CAPTURE_REFUNDED;

            whHelper.updatePaymentOnDwSide(eventType, eventResource);

            expect(getOrderByOrderNoStub).to.have.been.calledOnce;
            expect(updateOrderPaymentStatusStub.calledWithExactly(order, status, eventResource)).to.be.true;
        });

        it('should call updateOrderPaymentStatus for other event types', () => {
            const eventResource = {
                invoice_id: 'order_number',
                status: 'COMPLETED'
            };

            const eventType = paypalConstants.PAYMENT_CAPTURE_COMPLETED;

            whHelper.updatePaymentOnDwSide(eventType, eventResource);

            expect(getOrderByOrderNoStub).to.have.been.calledOnce;
        });
    });

    describe('updateDisputeHistory', () => {
        const updateDisputeHistory = whHelper.__get__('updateDisputeHistory');

        it('should add a new entry to the history', () => {
            const history = '[{"status":"open","time":"2023-10-25T08:00:00","amount":100}]';
            const entry = {
                status: 'resolved',
                update_time: '2023-10-26T09:00:00',
                dispute_amount: { value: 200 }
            };

            const result = updateDisputeHistory(history, entry);
            const parsedResult = JSON.parse(result);

            expect(parsedResult.length).to.be.equal(2);
        });

        it('should return valid JSON', () => {
            const history = '[{"status":"open","time":"2023-10-25T08:00:00","amount":100}]';
            const entry = {
                status: 'resolved',
                update_time: '2023-10-26T09:00:00',
                dispute_amount: { value: 200 }
            };

            const result = updateDisputeHistory(history, entry);

            expect(() => JSON.parse(result)).to.not.throw();
        });
    });

    describe('updateDispute', () => {
        const updateDispute = whHelper.__get__('updateDispute');

        it('should create a new dispute object if eventType is CUSTOMER_DISPUTE_CREATED or dispute is null', () => {
            const eventType = 'CUSTOMER_DISPUTE_CREATED';
            const entry = {
                dispute_id: '123456',
                create_time: '2023-10-25T08:00:00',
                update_time: '2023-10-26T09:00:00',
                reason: 'Product not as described',
                status: 'OPEN',
                dispute_amount: {
                    currency_code: 'USD',
                    value: 100
                }
            };

            updateDispute(eventType, entry);

            expect(createdDispute.custom.create_time).to.be.equal(entry.create_time);
            expect(createdDispute.custom.update_time).to.be.equal(entry.update_time);
            expect(createdDispute.custom.reason).to.be.equal(entry.reason);
            expect(createdDispute.custom.status).to.be.equal(entry.status);
            expect(createdDispute.custom.currency_code).to.be.equal(entry.dispute_amount.currency_code);
            expect(createdDispute.custom.amount).to.be.equal(entry.dispute_amount.value);
            expect(createdDispute.custom.messages).to.be.equal(JSON.stringify(entry.messages || []));
        });

        it('should also update history if it exists', () => {
            const eventType = 'CUSTOMER_DISPUTE_UPDATED';
            const entry = {
                dispute_id: '123456',
                create_time: '2023-10-25T08:00:00',
                update_time: '2023-10-26T09:00:00',
                reason: 'Product not as described',
                status: 'OPEN',
                dispute_amount: {
                    currency_code: 'USD',
                    value: 100
                }
            };

            createdDispute = {
                custom: {
                    history: JSON.stringify([{
                        status: 'open',
                        time: '2023-10-25T08:00:00',
                        amount: 100
                    }])
                }
            };

            updateDispute(eventType, entry);

            expect(createdDispute.custom.create_time).to.be.equal(entry.create_time);
            expect(createdDispute.custom.update_time).to.be.equal(entry.update_time);
            expect(createdDispute.custom.reason).to.be.equal(entry.reason);
            expect(createdDispute.custom.status).to.be.equal(entry.status);
            expect(createdDispute.custom.currency_code).to.be.equal(entry.dispute_amount.currency_code);
            expect(createdDispute.custom.amount).to.be.equal(entry.dispute_amount.value);
            expect(createdDispute.custom.messages).to.be.equal(JSON.stringify(entry.messages || []));
            expect(createdDispute.custom.history).to.be.a('string');
        });
    });

    describe('isAppropriateEventType', () => {
        it('should return true', () => {
            const eventType = paypalConstants.CUSTOMER_DISPUTE_CREATED;

            expect(whHelper.isAppropriateEventType(eventType)).to.equal(true);
        });

        it('should return false', () => {
            const eventType = 'wrong';

            expect(whHelper.isAppropriateEventType(eventType)).to.equal(false);
        });
    });

    describe('removePaymentMethod', () => {
        const removePaymentMethod = whHelper.__get__('removePaymentMethod');

        let creditCardPaymentInstruments = [];

        let paymentToken;

        const paymentInstruments = {
            toArray: () => creditCardPaymentInstruments
        };

        const customerWallet = {
            getPaymentInstruments: stub(),
            removePaymentInstrument: stub()
        };

        const paymentInstrument1 = {
            paymentMethod: 'PAYPAL_CREDIT_CARD',
            creditCardToken: 'fcewijfw',
            custom: {
                payPalDefaultCard: true
            }
        };

        const paymentInstrument2 = {
            paymentMethod: 'PAYPAL_CREDIT_CARD',
            creditCardToken: 'mpytkmot',
            custom: {
                payPalDefaultCard: false
            }
        };

        const paymentInstrument3 = {
            paymentMethod: 'PAYPAL_CREDIT_CARD',
            creditCardToken: 'lbjwyos',
            custom: {
                payPalDefaultCard: false
            }
        };

        before(() => {
            customerWallet.getPaymentInstruments.returns(paymentInstruments);
        });

        afterEach(() => {
            customerWallet.getPaymentInstruments.resetHistory();
        });

        after(() => {
            customerWallet.getPaymentInstruments.reset();
        });

        it('should be a function', () => {
            expect(removePaymentMethod).to.be.a('function');
        });

        it('should remove card from customer payment instrument', () => {
            paymentToken = 'mpytkmot';
            creditCardPaymentInstruments = [paymentInstrument1, paymentInstrument2, paymentInstrument3];

            removePaymentMethod(customerWallet, paymentToken);

            expect(customerWallet.removePaymentInstrument.calledOnce).to.be.true;
            expect(customerWallet.removePaymentInstrument.calledWith(paymentInstrument2)).to.be.true;
        });

        it('should remove default card from customer payment instrument and make another card default', () => {
            paymentToken = 'fcewijfw';
            creditCardPaymentInstruments = [paymentInstrument1, paymentInstrument2, paymentInstrument3];

            removePaymentMethod(customerWallet, paymentToken);

            expect(paymentInstrument3.custom.payPalDefaultCard).to.be.true;
            expect(customerWallet.getPaymentInstruments.calledTwice).to.be.true;
        });

        it('should return from further execution if customerSavedCreditCards is empty', () => {
            paymentToken = 'mpytkmot';
            creditCardPaymentInstruments = [];

            const result = removePaymentMethod(customerWallet, paymentToken);

            expect(result).to.be.undefined;
        });

        it('should skip further execution if customerSavedCreditCards is undefined', () => {
            paymentToken = 'mpytkmot';
            creditCardPaymentInstruments = undefined;

            const result = removePaymentMethod(customerWallet, paymentToken);

            expect(result).to.be.undefined;
        });
    });

    describe('setDisputeIdForOrder function', () => {
        const setDisputeIdForOrder = whHelper.__get__('setDisputeIdForOrder');

        it('should set dispute ID for orders with matching invoice number', () => {
            const dispute = {
                dispute_id: 'some_dispute_id',
                disputed_transactions: [
                    { invoice_number: '1' },
                    { invoice_number: '2' },
                    { invoice_number: '3' }
                ]
            };

            getOrder.withArgs('1').returns({ custom: {} });
            getOrder.withArgs('2').returns(null);
            getOrder.withArgs('3').returns({ custom: {} });

            setDisputeIdForOrder(dispute);

            expect(getOrder.calledThrice).to.be.true;
            expect(getOrder.calledWith('1')).to.be.true;
            expect(getOrder.calledWith('2')).to.be.true;
            expect(getOrder.calledWith('3')).to.be.true;

            expect(getOrder.getCall(0).returnValue.custom.paypalDisputeId).to.equal('some_dispute_id');
            expect(getOrder.getCall(2).returnValue.custom.paypalDisputeId).to.equal('some_dispute_id');
        });
    });

    describe('disputeFlow function', () => {
        const eventType = 'CUSTOMER.DISPUTE.CREATED';
        const entry = { id: 1, eventType: 'CUSTOMER.DISPUTE.CREATED', status: 'pending' };

        let updateDisputeStub;
        let setDisputeIdForOrderStub;

        beforeEach(() => {
            updateDisputeStub = stub();
            setDisputeIdForOrderStub = stub();

            whHelper.__set__('updateDispute', updateDisputeStub);
            whHelper.__set__('setDisputeIdForOrder', setDisputeIdForOrderStub);
        });

        after(() => {
            whHelper.__ResetDependency__('updateDispute');
            whHelper.__ResetDependency__('setDisputeIdForOrder');
        });

        afterEach(() => {
            updateDisputeStub.reset();
            setDisputeIdForOrderStub.reset();
        });

        it('should call updateDispute and setDisputeIdForOrder if simplifiedDisputePage is false', () => {
            prefs.simplifiedDisputePage = false;

            whHelper.disputeFlow(eventType, entry);

            expect(updateDisputeStub.calledWithExactly(eventType, entry)).to.be.true;
            expect(setDisputeIdForOrderStub.calledWithExactly(entry)).to.be.true;
        });

        it('should call only setDisputeIdForOrder if simplifiedDisputePage is true', () => {
            prefs.simplifiedDisputePage = true;

            whHelper.disputeFlow(eventType, entry);

            expect(updateDisputeStub.called).to.be.false;
            expect(setDisputeIdForOrderStub.calledWithExactly(entry)).to.be.true;
        });
    });

    describe('removePaymentMethodOnDwSide', () => {
        const removePaymentMethodStub = stub();
        const whResource = {
            id: 'token'
        };

        const profile = {
            wallet: {},
            custom: {
                payPalSavedCardsPaymentTokens: whResource.id
            }
        };

        before(() => {
            whHelper.__set__('removePaymentMethod', removePaymentMethodStub);

            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());

            querySystemObject.returns(profile);
        });

        after(() => {
            whHelper.__ResetDependency__('removePaymentMethod');

            dw.system.Transaction.wrap.restore();

            querySystemObject.reset();
        });

        afterEach(() => {
            removePaymentMethodStub.reset();
            dw.system.Transaction.wrap.resetHistory();
        });

        it('should be a function', () => {
            expect(whHelper.removePaymentMethodOnDwSide).to.be.a('function');
        });

        it('should remove payment method and change payPalSavedCardsPaymentTokens', () => {
            const profileResult = profile.custom.payPalSavedCardsPaymentTokens.replace(whResource.id, '').replace('**', '*');

            whHelper.removePaymentMethodOnDwSide(whResource);

            expect(removePaymentMethodStub.calledWithExactly(profile.wallet, whResource.id)).to.be.true;
            expect(dw.system.Transaction.wrap.calledOnce).to.be.true;
            expect(profile.custom.payPalSavedCardsPaymentTokens).to.deep.equals(profileResult);
        });

        it('should not remove payment method and change payPalSavedCardsPaymentTokens if customer profile is not found', () => {
            querySystemObject.returns(undefined);

            whHelper.removePaymentMethodOnDwSide(whResource);

            expect(removePaymentMethodStub.calledOnce).to.be.false;
            expect(dw.system.Transaction.wrap.calledOnce).to.be.false;
        });
    });
});
