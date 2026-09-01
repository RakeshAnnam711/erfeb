/* eslint-disable object-curly-newline */

const { int_paypal: { paypalProcessorHelperPath } } = require('../path.json');

const sinon = require('sinon');
const sinonTest = require('sinon-test')(sinon);
const { stub } = sinon;
const { expect } = require('chai');
const { it, describe,
    before
} = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const createPaymentInstrument = stub();
const getPaypalPaymentInstrumentById = stub();
const getTransactionId = stub();
const getTransactionStatus = stub();
const prepareTransactionHistory = stub();
const createErrorLog = stub();
const getOrderDetails = stub();
const splitFullName = stub();
const updateOrderBillingAddress = stub();
const removePaymentInstrument = stub();
const parseBillingAddress = stub();
const isSessionCardSelected = stub();
const setCustomerEmailToBasket = stub();

const resources = {
    paypal: {
        error: {
            general: 'An error occurs, please try again'
        }
    }
};

const paypalProcessorHelper = proxyquire(paypalProcessorHelperPath, {
    '*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper': {
        createPaymentInstrument,
        getPaypalPaymentInstrumentById
    },
    '*/cartridge/config/constants': {
        CC_3DS_LIABILITY_SHIFT_STATUS_NO: 'NO',
        SCA_ALWAYS: 'SCA_ALWAYS',
        CC_3DS_ALLOWED_ENROLLMENT_STATUS_YES: 'Y',
        CC_3DS_LIABILITY_SHIFT_STATUS_UNKNOWN: 'UNKNOWN',
        CC_3DS_ALLOWED_ENROLLMENT_STATUS_UNAVAILABLE: 'U',
        PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
        PAYMENT_METHOD_ID_APPLE_PAY: 'APPLE_PAY',
        PAYMENT_METHOD_ID_VENMO: 'Venmo',
        PAYMENT_METHOD_ID_GOOGLE_PAY: 'GooglePay'
    },
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        getTransactionId,
        getTransactionStatus,
        prepareTransactionHistory,
        splitFullName
    },
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog
    },
    '*/cartridge/scripts/paypal/api': {
        getOrderDetails: getOrderDetails
    },
    '*/cartridge/scripts/paypal/helpers/addressHelper': {
        updateOrderBillingAddress: updateOrderBillingAddress,
        parseBillingAddress: parseBillingAddress,
        setCustomerEmailToBasket: setCustomerEmailToBasket
    },
    '*/cartridge/config/preferences': {
        isDigitalGoodsFlowEnabled: false,
        threeDSecureFlow: 'SCA_ALWAYS'
    },
    'dw/web/Resource': dw.web.Resource,
    '*/cartridge/scripts/paypal/helpers/fastlane': {
        isSessionCardSelected: isSessionCardSelected
    }
});

describe('paypalProcessorHelper file', () => {
    const apShippingAddress = {
        name: '',
        givenName: '',
        familyName: '',
        countryCode: '',
        addressLines: [''],
        postalCode: '',
        administrativeArea: '',
        locality: '',
        phoneNumber: ''
    };

    describe('handlePaymentInstrument', () => {
        const basket = {
            removePaymentInstrument: removePaymentInstrument
        };

        const billingForm = {
            paymentMethod: {
                value: 'PayPal'
            },
            paypal: {
                usedPaymentMethod: {
                    value: ''
                }
            }
        };

        it('should return session payment instrument from basket if isSessionCardSelected true', sinonTest(() => {
            isSessionCardSelected.returns(true);
            getPaypalPaymentInstrumentById.returns({ paymentMethod: 'PAYPAL_CREDIT_CARD' });

            expect(paypalProcessorHelper.handlePaymentInstrument(basket, billingForm)).to.deep.equal({
                paymentMethod: 'PAYPAL_CREDIT_CARD'
            });
        }));

        it('should return paypal payment instrument from basket', sinonTest(() => {
            isSessionCardSelected.returns(false);
            getPaypalPaymentInstrumentById.returns({
                paymentMethod: 'PayPal',
                paymentTransaction: {}
            });

            expect(paypalProcessorHelper.handlePaymentInstrument).to.be.a('function');
            expect(paypalProcessorHelper.handlePaymentInstrument(basket, billingForm)).to.be.an('object').that.deep.equal({
                paymentMethod: 'PayPal',
                paymentTransaction: {}
            });
        }));

        it('should create paypal payment instrument if it is not found in basket', sinonTest(() => {
            getPaypalPaymentInstrumentById.returns(null);
            createPaymentInstrument.returns({
                paymentMethod: 'PayPal',
                paymentTransaction: {}
            });

            expect(paypalProcessorHelper.handlePaymentInstrument(basket, billingForm));
        }));

        it('should create paypal payment instrument and delete existed if it is PAYPAL_CREDIT_CARD', sinonTest(() => {
            getPaypalPaymentInstrumentById.returns({
                paymentMethod: 'PAYPAL_CREDIT_CARD',
                paymentTransaction: {}
            });

            createPaymentInstrument.returns({
                paymentMethod: 'PAYPAL_CREDIT_CARD',
                paymentTransaction: {}
            });

            expect(paypalProcessorHelper.handlePaymentInstrument(basket, billingForm)).to.be.an('object').that.deep.equal({
                paymentMethod: 'PAYPAL_CREDIT_CARD',
                paymentTransaction: {}
            });
            expect(removePaymentInstrument.calledOnce).to.be.true;
        }));
    });

    describe('clearCurrentPaypalEmail', () => {
        it('should remove currentPaypalEmail value from paymentInstrument', sinonTest(() => {
            const paymentInstrument = { custom: { currentPaypalEmail: 'test@paypal.com' } };

            expect(paypalProcessorHelper.clearCurrentPaypalEmail).to.be.a('function');

            stub(dw.system.Transaction, 'wrap').callsArg(0);

            expect(paypalProcessorHelper.clearCurrentPaypalEmail(paymentInstrument)).to.be.an('undefined');
            expect(dw.system.Transaction.wrap.calledOnce).to.be.true;
            expect(paymentInstrument.custom.currentPaypalEmail).to.be.null;

            dw.system.Transaction.wrap.restore();
        }));
    });

    describe('saveGeneralTransactionData', () => {
        const paymentInstrument = {
            paymentTransaction: {
                custom: {}
            },
            getPaymentTransaction: () => {
                return {
                    setTransactionID: () => {}
                };
            },
            custom: {}
        };

        it('should be a function', () => {
            expect(paypalProcessorHelper.saveGeneralTransactionData).to.be.a('function');
        });

        it('should save a general transaction data', () => {
            expect(paypalProcessorHelper.saveGeneralTransactionData(paymentInstrument, {}, {})).to.be.an('undefined');
        });
    });

    describe('getPaymentMethodId', () => {
        const billingForm = {
            paypal: {
                usedPaymentMethod: {
                    value: 'PAYPAL_CREDIT_CARD'
                }
            }
        };

        it('should be a function', () => {
            expect(paypalProcessorHelper.getPaymentMethodId).to.be.a('function');
        });

        it('should return PAYPAL_CREDIT_CARD string', () => {
            expect(paypalProcessorHelper.getPaymentMethodId(billingForm)).to.be.deep.equal('PAYPAL_CREDIT_CARD');
        });

        it('should return PayPal string', () => {
            const PAYMENT_METHOD_PAYPAL = 'PayPal';

            billingForm.paypal.usedPaymentMethod.value = PAYMENT_METHOD_PAYPAL;
            billingForm.paymentMethod = {
                value: PAYMENT_METHOD_PAYPAL
            };

            expect(paypalProcessorHelper.getPaymentMethodId(billingForm)).to.be.deep.equal(PAYMENT_METHOD_PAYPAL);
        });

        it('should return PAYMENT_METHOD_ID_APPLE_PAY string', () => {
            const PAYMENT_METHOD_ID_APPLE_PAY = 'APPLE_PAY';

            billingForm.paypal.usedPaymentMethod.value = PAYMENT_METHOD_ID_APPLE_PAY;
            billingForm.paymentMethod = {
                value: PAYMENT_METHOD_ID_APPLE_PAY
            };

            expect(paypalProcessorHelper.getPaymentMethodId(billingForm)).to.be.equal(PAYMENT_METHOD_ID_APPLE_PAY);
        });

        it('should return PAYMENT_METHOD_ID_Venmo string', () => {
            const PAYMENT_METHOD_ID_VENMO = 'Venmo';

            billingForm.paypal.usedPaymentMethod.value = PAYMENT_METHOD_ID_VENMO;
            billingForm.paymentMethod = {
                value: PAYMENT_METHOD_ID_VENMO
            };

            expect(paypalProcessorHelper.getPaymentMethodId(billingForm)).to.be.equal(PAYMENT_METHOD_ID_VENMO);
        });

        it('should return PAYMENT_METHOD_ID_GOOGLE_PAY string', () => {
            const PAYMENT_METHOD_ID_GOOGLE_PAY = 'GooglePay';

            billingForm.paypal.usedPaymentMethod.value = PAYMENT_METHOD_ID_GOOGLE_PAY;
            billingForm.paymentMethod = {
                value: PAYMENT_METHOD_ID_GOOGLE_PAY
            };

            expect(paypalProcessorHelper.getPaymentMethodId(billingForm)).to.be.equal(PAYMENT_METHOD_ID_GOOGLE_PAY);
        });
    });

    describe('handleOrderDetailsError', () => {
        before(() => {
            stub(dw.web.Resource, 'msg');
        });

        after(() => {
            createErrorLog.reset();
            dw.web.Resource.msg.restore();
        });

        it('should return an error object', () => {
            dw.web.Resource.msg.returns(resources.paypal.error.general);

            expect(paypalProcessorHelper.handleOrderDetailsError(resources.paypal.error.general))
                .that.deep.equal({
                    error: true,
                    fieldErrors: [],
                    serverErrors: [resources.paypal.error.general]
                });

            expect(createErrorLog.calledOnce).to.be.true;
        });
    });

    describe('handleApplePay', () => {
        const billingForm = {
            paymentMethod: {
                value: 'PayPal'
            },
            paypal: {
                usedPaymentMethod: {
                    value: ''
                },
                applePay: {
                    applePayEmailAddress: {
                        value: 'email'
                    },
                    applePayPaymentSource: {
                        value: JSON.stringify({
                            apple_pay: {
                                name: 'name',
                                card: {
                                    billing_address: {}
                                }
                            }
                        })
                    },
                    applePayShippingAddressAsString: {
                        value: null
                    },
                    applePayPhoneNumber: {
                        value: 'phone'
                    }
                }
            }
        };

        const paymentInstrument = {
            custom: {
                paypalOrderID: '',
                currentPaypalEmail: '',
                paymentId: ''
            }
        };

        const getOrderDetailsSuccess = {
            purchase_units: [{
                shipping: {
                    address: {}
                }
            }]
        };

        let basket;

        before(() => {
            stub(dw.system.Transaction, 'wrap').callsArg(0);
            stub(dw.web.Resource, 'msg');

            splitFullName.returns({
                firstName: 'firstName',
                lastName: 'lastName'
            });

            session.privacy.paypalOrderID = 'orderId';
        });

        after(() => {
            splitFullName.reset();

            session.privacy.paypalOrderID = null;

            dw.system.Transaction.wrap.restore();
            dw.web.Resource.msg.restore();
        });

        it('should return an object', () => {
            getOrderDetails.returns(getOrderDetailsSuccess);

            expect(paypalProcessorHelper.handleApplePay(basket, billingForm, paymentInstrument))
                .to.be.an('object');
        });

        it('should return an object if applePayShippingAddressAsString is not passed', () => {
            getOrderDetails.returns(getOrderDetailsSuccess);

            expect(paypalProcessorHelper.handleApplePay(basket, billingForm, paymentInstrument))
                .to.be.an('object');
            expect(paypalProcessorHelper.handleApplePay(basket, billingForm, paymentInstrument)).has.property('shippingAddress');
            expect(setCustomerEmailToBasket.called).to.be.true;
        });

        it('should return an object if purchase unit does not contains this shipping address', () => {
            billingForm.paypal.applePay.applePayShippingAddressAsString.value = JSON.stringify(apShippingAddress);

            getOrderDetails.returns({
                purchase_units: []
            });

            expect(paypalProcessorHelper.handleApplePay(basket, billingForm, paymentInstrument))
                .to.be.an('object');
            expect(paypalProcessorHelper.handleApplePay(basket, billingForm, paymentInstrument)).has.property('shippingAddress');
            expect(setCustomerEmailToBasket.called).to.be.true;
        });

        it('if getOrderDetails returns an error', () => {
            getOrderDetails.returns({
                err: resources.paypal.error.general
            });

            dw.web.Resource.msg.returns(resources.paypal.error.general);

            expect(paypalProcessorHelper.handleApplePay(basket, billingForm, paymentInstrument))
                .that.deep.equal({
                    error: true,
                    fieldErrors: [],
                    serverErrors: [resources.paypal.error.general]
                });

            expect(createErrorLog.calledOnce).to.be.true;
        });
    });

    describe('prepareShippingAddressFromApplePay', () => {
        it('should return an object', () => {
            expect(paypalProcessorHelper.prepareShippingAddressFromApplePay(apShippingAddress)).to.be.an('object');
        });

        it('should contains the shipping key', () => {
            expect(paypalProcessorHelper.prepareShippingAddressFromApplePay(apShippingAddress)).has.property('address');
        });

        it('should contains the phone key', () => {
            expect(paypalProcessorHelper.prepareShippingAddressFromApplePay(apShippingAddress)).has.property('phone');
        });

        it('should contain the email', () => {
            expect(paypalProcessorHelper.prepareShippingAddressFromApplePay(apShippingAddress)).has.property('email_address');
        });
    });

    describe('process3DSecureResponse', () => {
        const orderDetails = {
            authentication_result: {
                liability_shift: 'YES',
                three_d_secure: {}
            }
        };

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.withArgs('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null);
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it ('should return error if 3DS SCA Always but no authentication result', () => {
            orderDetails.authentication_result = null;
            getOrderDetails.returns(orderDetails);

            expect(paypalProcessorHelper.process3DSecureResponse(orderDetails))
                .to.have.property('error');
        });

        it('should return error if 3DS enrollment status YES and liability shift status is NO', () => {
            orderDetails.authentication_result = {
                liability_shift: 'NO',
                three_d_secure: {
                    enrollment_status: 'Y'
                }
            };
            getOrderDetails.returns(orderDetails);

            expect(paypalProcessorHelper.process3DSecureResponse(orderDetails))
                .to.have.property('error');
        });

        it('should return error if 3DS enrollment status is missing from 3DS authentication result', () => {
            orderDetails.authentication_result = {
                liability_shift: 'NO'
            };
            getOrderDetails.returns(orderDetails);

            expect(paypalProcessorHelper.process3DSecureResponse(orderDetails))
                .to.have.property('error');
        });

        it('should return error if liability shift status is UNKNOWN', () => {
            orderDetails.authentication_result = {
                liability_shift: 'UNKNOWN'
            };
            getOrderDetails.returns(orderDetails);

            expect(paypalProcessorHelper.process3DSecureResponse(orderDetails))
                .to.have.property('error');
        });
    });
});
