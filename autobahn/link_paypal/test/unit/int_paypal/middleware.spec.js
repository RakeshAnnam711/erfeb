const { int_paypal: { middlewarePath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe, beforeEach } = require('mocha');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');

const removePaypalPaymentInstrument = stub();
const removeNonPayPalPaymentInstrument = stub();
const calculateNonGiftCertificateAmount = stub();
const isExpiredTransaction = stub();
const isPaypalButtonEnabled = stub();
const createErrorMsg = stub();
const getUrls = stub();
const createErrorLog = stub();
const getLoginRedirectURL = stub();
const isSavedCardFlow = stub();
const getPaypalPaymentInstrumentById = stub();
const getPaypalPaymentInstrument = stub();

const req = {
    form: {
        orderID: 'ID',
        orderToken: 'Token'
    },
    body: '{"someData":"Data"}',
    querystring: { state: null },
    session: {
        privacyCache: null,
        custom: {
            oauthLoginTargetEndPoint: null
        }
    }
};

const res = {
    parsedBody: {},
    setStatusCode: () => {},
    print: () => {},
    json: () => {},
    redirect: () => {}
};

const next = () => () => {};

const form = {
    paymentMethod: {
        htmlValue: 'paypal'
    },
    paypal: {
        usedPaymentMethod: ''
    }
};

const basket = {};
const currentOrNewBasket = {
    totalGrossPrice: {
        value: 0
    }
};

const middleware = require('proxyquire').noCallThru()(middlewarePath, {
    'server': {
        forms: {
            getForm: () => form
        }
    },
    'dw/order/BasketMgr': dw.order.BasketMgr,
    'dw/order/OrderMgr': dw.order.OrderMgr,
    'dw/order/PaymentMgr': dw.order.PaymentMgr,
    'dw/system/HookMgr': dw.system.HookMgr,
    'dw/web/Resource': dw.web.Resource,
    '*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper': {
        removePaypalPaymentInstrument,
        removeNonPayPalPaymentInstrument,
        calculateNonGiftCertificateAmount,
        getPaypalPaymentInstrumentById,
        getPaypalPaymentInstrument
    },
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        isExpiredTransaction,
        isPaypalButtonEnabled
    },
    '*/cartridge/scripts/paypal/utils': {
        createErrorMsg,
        getUrls,
        createErrorLog
    },
    '*/cartridge/scripts/helpers/accountHelpers': {
        getLoginRedirectURL
    },
    '*/cartridge/config/constants': {
        CONNECT_WITH_PAYPAL_CONSENT_DENIED: 'CONNECT_WITH_PAYPAL_CONSENT_DENIED',
        PAYMENT_METHOD_ID_PAYPAL: 'PayPal',
        AVAILABLE_PM_IDS: [
            'ApplePay',
            'PAYPAL_CREDIT_CARD',
            'PayPal'
        ],
        PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD'
    },
    '*/cartridge/config/urls': {},
    '*/cartridge/scripts/paypal/helpers/creditCardHelper': {
        isSavedCardFlow
    }
});

describe('middleware file', () => {
    after(() => {
        dw.order.PaymentMgr.getPaymentMethod = () => {};
    });

    describe('validatePaymentMethod function', () => {
        before(() => {
            basket.getPaymentInstruments = () => null;
        });

        after(() => {
            getPaypalPaymentInstrumentById.reset();
            isSavedCardFlow.reset();
        });

        it('if there is not basket', () => {
            dw.order.BasketMgr.getCurrentBasket = () => {};
            expect(middleware.validatePaymentMethod(req, res, next)).to.be.a('function');
        });

        it('if there is basket', () => {
            dw.order.BasketMgr.getCurrentBasket = () => basket;
            expect(middleware.validatePaymentMethod(req, res, next)).to.be.a('function');
        });

        it('if change payment method from different one to paypal we remove already existing payment instrument', () => {
            basket.getPaymentInstruments = () => 'paypal';
            dw.order.BasketMgr.getCurrentBasket = () => basket;
            getPaypalPaymentInstrumentById.returns(false);
            expect(middleware.validatePaymentMethod(req, res, next)).to.be.a('function');
        });

        it('if change payment from paypal to different one we remove paypal as payment instrument', () => {
            dw.order.BasketMgr.getCurrentBasket = () => basket;
            getPaypalPaymentInstrumentById.returns(true);
            expect(middleware.validatePaymentMethod(req, res, next)).to.be.a('function');
        });

        it('isSavedCardFlow is === true', () => {
            getPaypalPaymentInstrumentById.returns({
                paymentMethod: 'PAYPAL_CREDIT_CARD'
            });
            isSavedCardFlow.returns(true);

            expect(middleware.validatePaymentMethod(req, res, next)).to.be.a('function');
        });

        it('should remove non-PayPal payment instruments when paymentInstruments are not empty', () => {
            const paymentInstruments = [{ paymentMethod: 'SomePaymentMethod' }];

            basket.getPaymentInstruments = () => paymentInstruments;
            getPaypalPaymentInstrumentById.returns(null);

            middleware.validatePaymentMethod(req, res, next);

            expect(removeNonPayPalPaymentInstrument.calledWith(basket)).to.be.true;
        });

        it('should remove non-PayPal payment instruments when isSavedCreditCardFlow is true', () => {
            getPaypalPaymentInstrumentById.returns({
                paymentMethod: 'PAYPAL_CREDIT_CARD'
            });
            isSavedCardFlow.returns(true);
            basket.getPaymentInstruments = () => [{ paymentMethod: 'AnotherPaymentMethod' }];

            expect(middleware.validatePaymentMethod(req, res, next)).to.be.a('function');
        });
    });

    describe('parseBody function', () => {
        it('if there is no errors', () => {
            expect(middleware.parseBody(req, res, next)).to.be.undefined;
        });

        it('if there is an error', () => {
            req.body = 'data:data';
            expect(middleware.parseBody.call({ emit: () => {} }, req, res, next)).to.have.been.called;
        });
    });

    describe('validateProcessor function', () => {
        it('if there is no hook for processor', () => {
            dw.order.PaymentMgr.getPaymentMethod = () => ({ getPaymentProcessor: () => ({ ID: 'paypal' }) });
            expect(middleware.validateProcessor(req, res, next)).to.be.undefined;
        });

        it('if there is no errors', () => {
            dw.order.PaymentMgr.getPaymentMethod = () => ({ getPaymentProcessor: () => null });
            expect(middleware.validateProcessor.call({ emit: () => {} }, req, res, next)).to.have.been.called;
        });
    });

    describe('removeNonPaypalPayment function', () => {
        beforeEach(() => {
            dw.order.BasketMgr.getCurrentBasket = () => basket;
        });

        it('if there is no basket', () => {
            dw.order.BasketMgr.getCurrentBasket = () => {};
            expect(middleware.removeNonPaypalPayment(req, res, next)).to.be.a('function');
        });

        it('if there is basket without paymentInstruments', () => {
            expect(middleware.removeNonPaypalPayment(req, res, next)).to.be.a('function');
        });

        it('if there is basket wit paymentInstruments', () => {
            basket.paymentInstruments = 'paypal';
            expect(middleware.removeNonPaypalPayment(req, res, next)).to.be.a('function');
        });
    });

    describe('validateHandleHook function', () => {
        it('if there is no hook for processor', () => {
            dw.order.PaymentMgr.getPaymentMethod = () => ({ getPaymentProcessor: () => ({ ID: 'ID' }) });
            expect(middleware.validateHandleHook.call({ emit: () => {} }, req, res, next)).to.have.been.called;
        });

        it('if there is hook for processor', () => {
            dw.system.HookMgr.hasHook = () => true;
            expect(middleware.validateHandleHook(req, res, next)).to.be.undefined;
        });
    });

    describe('validateGiftCertificateAmount function', () => {
        before(() => {
            dw.order.BasketMgr.getCurrentBasket = () => basket;
        });

        it('if plugin payment method was not used', () => {
            getPaypalPaymentInstrument.returns(undefined);
            expect(middleware.validateGiftCertificateAmount(req, res, next)).to.be.a('function');
        });

        it('if plugin payment method is used', () => {
            getPaypalPaymentInstrument.returns({
                paymentMethod: 'PayPal'
            });
            calculateNonGiftCertificateAmount.returns({ value: 1 });
            expect(middleware.validateGiftCertificateAmount(req, res, next)).to.have.been.called;
        });

        it('if there is calculatedNonGiftCertificateAmount', () => {
            calculateNonGiftCertificateAmount.returns({ value: 1 });
            expect(middleware.validateGiftCertificateAmount(req, res, next)).to.be.a('function');
        });

        it('if there is no calculatedNonGiftCertificateAmount', () => {
            basket.giftCertificatePaymentInstruments = 'gift';
            calculateNonGiftCertificateAmount.returns({ value: 0 });
            expect(middleware.validateGiftCertificateAmount(req, res, next)).to.be.a('function');
        });

        describe('if there is giftCertificatePaymentInstruments but is no calculatedNonGiftCertificateAmount', () => {
            before(() => {
                basket.giftCertificatePaymentInstruments = '';
                calculateNonGiftCertificateAmount.returns({ value: 0 });
            });

            it('if there is no this.name', () => {
                expect(middleware.validateGiftCertificateAmount(req, res, next)).to.have.been.called;
            });

            it('if this.name is SubmitPayment', () => {
                expect(middleware.validateGiftCertificateAmount.call({ name: 'SubmitPayment', emit: () => {} }, req, res, next)).to.have.been.called;
            });

            it('if this.name is StreamlinedCheckout', () => {
                expect(middleware.validateGiftCertificateAmount.call({ name: 'StreamlinedCheckout', emit: () => {} }, req, res, next)).to.have.been.called;
            });
        });
    });

    describe('validateConnectWithPaypalUrl function', () => {
        const emit = stub();

        after(() => {
            req.httpParameterMap = null;
            getLoginRedirectURL.reset();
        });

        it('if there is no error value, next method should be called', () => {
            req.httpParameterMap = { get: () => ({ empty: true }) };

            expect(middleware.validateConnectWithPaypalUrl(req, res, next)).to.be.undefined;
        });

        it('if there is error value which equals CONNECT_WITH_PAYPAL_CONSENT_DENIED', () => {
            req.httpParameterMap = { get: () => ({ empty: false, value: 'CONNECT_WITH_PAYPAL_CONSENT_DENIED' }) };
            getLoginRedirectURL.returns(null);

            expect(middleware.validateConnectWithPaypalUrl.call({ emit }, req, res, next)).to.be.undefined;
        });

        it('if there is error value which doesn\'t equal CONNECT_WITH_PAYPAL_CONSENT_DENIED, next method should be called', () => {
            req.httpParameterMap = { get: () => ({ empty: false, value: '' }) };

            expect(middleware.validateConnectWithPaypalUrl(req, res, next)).to.be.undefined;
        });
    });

    describe('validateAmount function',() => {
        before(() => {
            dw.order.BasketMgr.currentOrNewBasket =  currentOrNewBasket;
        });

        it('if amount is zero', () => {
            expect(middleware.validateAmount(req, res, next)).to.have.been.called;
        });

        it('if amount is NOT zero', () => {
            dw.order.BasketMgr.currentOrNewBasket.totalGrossPrice.value = 10;

            expect(middleware.validateAmount(req, res, next)).to.have.been.called;
        });
    });
});
