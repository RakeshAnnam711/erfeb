const { bm_paypal: { ppTransactionActionsPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const getOrder = stub().returns({
    currencyCode: 'USD',
    totalGrossPrice: {
        value: 100
    }
});

const addOrderNotes = stub();
const updateOrderData = stub();
const returnObject = (reqData) => {
    if (!reqData.err) {
        return {
            responseData: { transactionId: reqData.id }
        };
    }

    return {
        err: reqData.err,
        responseData: { errorMessage: 'There was some error' }
    };
};

const returnObjectAuthorize = (reqData) => {
    if (!reqData.err) {
        return {
            id: '5O190127TN364715T',
            purchase_units: [{
                id: 'O-9RR85649FD345344Y'
            }]
        };
    }

    return {
        err: reqData.err,
        responseData: { errorMessage: 'There was some error' }
    };
};

class MoneyMock {
    constructor(value, currency) {
        this.value = parseFloat(value);
        this.currency = currency;
    }

    add(money) {
        this.value += money.value;

        return this;
    }

    compareTo(money) {
        const round = value => parseFloat(Number(value).toFixed(2));

        return Math.sign(round(this.value) - round(money.value));
    }
}

const ppTransactionActions = proxyquire(ppTransactionActionsPath, {
    '*/cartridge/models/ppOrderMgr': function() {
        return {
            updateOrderData,
            addOrderNotes
        };
    },
    '~/cartridge/scripts/paypal/api/restApiWrapper': function() {
        return {
            doVoid: returnObject,
            doReauthorize: returnObject,
            doRefundTransaction: returnObject,
            doCapture: returnObject,
            doAuthorize: returnObjectAuthorize
        };
    },
    '*/cartridge/scripts/paypal/paymentInstrumentHelpers': {
        getPaypalPaymentInstrument: () => {
            return { custom: { paypalOrderID: '123456' } };
        }
    },
    'dw/order/OrderMgr': {
        getOrder: getOrder

    },
    'dw/web/Resource': {
        msg: () => '',
        msgf: () => ''
    },
    'dw/value/Money': MoneyMock
});

describe('ppTransactionActions file', () => {
    let dataErrorTrue = { err: true, id: 25, paymentSource: JSON.stringify({ paypal: false }) };
    let dataErrorFalse = { err: false, id: 25, paymentSource: JSON.stringify({ paypal: false }) };
    let expectedObj = { err: true, responseData: { errorMessage: 'There was some error' } };

    const expectedObjErrorFalse = { responseData: { transactionId: 25 } };

    const result = new ppTransactionActions();

    it('ppTransactionActions is a function', () => {
        expect(ppTransactionActions).to.be.an('function');
    });

    it('if the prototype of ppTransactionActions has property voidAction that is a function', () => {
        expect(new ppTransactionActions()).to.have.property('voidAction').to.be.a('function');
    });

    it('if the prototype of ppTransactionActions has property reauthorizeAction that is a function.', () => {
        expect(new ppTransactionActions()).to.have.property('reauthorizeAction').to.be.a('function');
    });

    it('if the prototype of ppTransactionActions has property refundTransactionAction that is a function.', () => {
        expect(new ppTransactionActions()).to.have.property('reauthorizeAction').to.be.a('function');
    });

    it('if the prototype of ppTransactionActions has property captureAction that is a function.', () => {
        expect(new ppTransactionActions()).to.have.property('captureAction').to.be.a('function');
    });

    describe('PPTransactionAction.voidAction', () => {
        it('if callApiResponse.err true should return { err: true, responseData: { errorMessage: \'There was some error\'  } }', () => {
            expect(result.voidAction(dataErrorTrue)).to.deep.equal(expectedObj);
        });

        it('if callApiResponse.err is true and orderTransactionResult is false should return { err: true}', () => {
            updateOrderData.returns(false);
            expect(result.voidAction(dataErrorFalse)).to.deep.equal({ err: true });
        });

        it('if callApiResponse.err is false and orderTransactionResult is true should return { err: true}', () => {
            updateOrderData.returns(true);
            expect(result.voidAction(dataErrorFalse)).to.deep.equal(expectedObjErrorFalse);
        });
    });

    describe('PPTransactionAction.reauthorizeAction', () => {
        it('if callApiResponse.err is true should return { err: true, responseData: { errorMessage: \'There was some error\' } }', () => {
            expect(result.reauthorizeAction(dataErrorTrue)).to.deep.equal(expectedObj);
        });

        it('if callApiResponse.err is false and orderTransactionResult is false should return { err: true}', () => {
            updateOrderData.returns(false);
            expect(result.reauthorizeAction(dataErrorFalse)).to.deep.equal({ err: true });
        });

        it('if callApiResponse.err is false and orderTransactionResult is true should return { responseData: { transactionId: 25 }}', () => {
            updateOrderData.returns(true);
            expect(result.reauthorizeAction(dataErrorFalse)).to.deep.equal(expectedObjErrorFalse);
        });
    });

    describe('PPTransactionAction.refundTransactionAction', () => {
        it('if callApiResponse.err is true should return { err: true, responseData: { errorMessage: \'There was some error\' } }', () => {
            expect(result.refundTransactionAction(dataErrorTrue)).to.deep.equal(expectedObj);
        });

        it('if callApiResponse.err is false and orderTransactionResult is false should return { err: true}', () => {
            updateOrderData.returns(false);
            expect(result.refundTransactionAction(dataErrorFalse)).to.deep.equal({ err: true });
        });

        it('if callApiResponse.err is false and orderTransactionResult is true should return { responseData: { transactionId: 25 } }', () => {
            updateOrderData.returns(true);
            expect(result.refundTransactionAction(dataErrorFalse)).to.deep.equal(expectedObjErrorFalse);
        });
    });

    describe('PPTransactionAction.captureAction', () => {
        it('if callApiResponse.err is true should return { err: true, responseData: { errorMessage: \'There was some error\' } }', () => {
            expect(result.captureAction(dataErrorTrue)).to.deep.equal(expectedObj);
        });

        it('if callApiResponse.err is false and orderTransactionResult is false should return { err: true}', () => {
            updateOrderData.returns(false);
            expect(result.captureAction(dataErrorFalse)).to.deep.equal({ err: true });
        });

        it('if callApiResponse.err is false and orderTransactionResult is true should return { responseData: { transactionId: 25 } }', () => {
            updateOrderData.returns(true);
            expect(result.captureAction(dataErrorFalse)).to.deep.equal(expectedObjErrorFalse);
        });

        it('if isCaptureMoreThanAuthorized is true and payment source is not Paypal, should return { err: true }', () => {
            updateOrderData.returns(true);
            dataErrorTrue = {
                err: false,
                amt: 70,
                capturedAmount: 50,
                id: 25,
                paymentSource: JSON.stringify({ paypal: false })
            };
            expectedObj = {
                err: true,
                responseData: {
                    l_longmessage0: ''
                }
            };

            expect(result.captureAction(dataErrorTrue)).to.deep.equal(expectedObj);
        });

        it('if isCaptureMoreThanAuthorized is true and payment source is Paypal, should call addOrderNotes', () => {
            updateOrderData.returns(true);
            dataErrorFalse = {
                err: false,
                amt: 70,
                capturedAmount: 50,
                id: 25,
                paymentSource: JSON.stringify({ paypal: true })
            };

            result.captureAction(dataErrorFalse);
            expect(addOrderNotes.calledOnce).to.be.true;
        });
    });
});
