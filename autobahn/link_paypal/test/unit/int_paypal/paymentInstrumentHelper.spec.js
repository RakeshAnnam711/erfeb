/* eslint-disable no-underscore-dangle */
const { int_paypal: { paymentInstrumentHelperPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { stub } = require('sinon');
const {
    describe, it, before, after, beforeEach, afterEach
} = require('mocha');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const isFastlaneUsed = stub();

const paymentInstrumentHelper = proxyquire(paymentInstrumentHelperPath, {
    '*/cartridge/config/constants': {
        PAYMENT_METHOD_ID_PAYPAL: 'PayPal',
        ALLOWED_PROCESSORS_IDS: 'PAYPAL, PAYPAL_LOCAL'
    },
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        getCustomAttributePaypalEmail: (pi) => pi.custom.currentPaypalEmail,
        isFastlaneUsed
    },
    '*/cartridge/scripts/paypal/helpers/creditCardHelper': {
        isSavedCardFlow: () => {}
    },
    'dw/order/PaymentMgr': dw.order.PaymentMgr
});

describe('paymentInstrmentHelper file', () => {
    before(() => {
        stub(dw.order.PaymentMgr, 'getActivePaymentMethods');
        dw.order.PaymentMgr.getActivePaymentMethods.returns([
            {
                paymentProcessor: {
                    ID: 'PAYPAL'
                },
                ID: 'PayPal'
            },
            {
                paymentProcessor: {
                    ID: 'PAYPAL'
                },
                ID: 'ApplePay'
            }
        ]);
    });

    after(() => {
        dw.order.PaymentMgr.getActivePaymentMethods.restore();
    });

    describe('getPaypalPaymentInstrument', () => {
        const getPaypalPaymentInstrument = paymentInstrumentHelper.__get__('getPaypalPaymentInstrument');

        let basket;
        let paymentInstruments;

        describe('if paymentInstrument with paypal as payment method id is not empty', () => {
            before(() => {
                paymentInstruments = [{ Array: {} }];
                basket = {
                    getPaymentInstruments: () => {
                        return paymentInstruments;
                    }
                };
            });

            after(() => {
                basket = {};
                paymentInstruments = null;
            });

            it('return paypal payment instrument', () => {
                expect(getPaypalPaymentInstrument(basket)).to.be.equal(paymentInstruments[0]);
            });
        });

        describe('if payment instrument is empty', () => {
            before(() => {
                paymentInstruments = [];
                basket = {
                    getPaymentInstruments: () => paymentInstruments
                };
            });
            after(() => {
                basket = {};
                paymentInstruments = null;
            });
            it('return undefined', () => {
                expect(getPaypalPaymentInstrument(basket)).to.be.equal(undefined);
            });
        });
    });

    describe('calculateNonGiftCertificateAmount', () => {
        const calculateNonGiftCertificateAmount = paymentInstrumentHelper.__get__('calculateNonGiftCertificateAmount');

        const Decimal = function(value) {
            this.value = value;
        };

        Decimal.prototype.subtract = function(money) {
            return new Decimal(this.value - money.value);
        };

        Decimal.prototype.value = null;

        const getAmount = new dw.value.Money(20);

        const gcPaymentInstrs = {
            iterator: () => {
                return new dw.util.Iterator([{
                    getPaymentTransaction: () => ({
                        getAmount: () => {
                            return getAmount;
                        }
                    })
                }]);
            }
        };

        const lineItemCtnr = {
            currencyCode: 'USD',
            getGiftCertificatePaymentInstruments: () => gcPaymentInstrs,
            totalGrossPrice: new dw.value.Money(100)
        };

        it('should return amount after discount', () => {
            expect(calculateNonGiftCertificateAmount(lineItemCtnr).value).to.be.equal(80);
        });
    });

    describe('removePaypalPaymentInstrument', () => {
        const basket = {
            getPaymentInstruments: stub(),
            removePaymentInstrument: stub()
        };

        describe('if paypalPaymentInstrument was not passed and also payment instrument doesn`t exist in basket', () => {
            before(() => {
                basket.getPaymentInstruments.returns(null);
            });

            it('should return undefined', () => {
                expect(paymentInstrumentHelper.removePaypalPaymentInstrument(basket, undefined)).to.be.undefined;
            });
        });

        describe('if paypalPaymentInstrument was not passed and payment instrument exists in basket', () => {
            before(() => {
                basket.getPaymentInstruments.returns({});
            });

            it('should remove basket payment instrument from basket', () => {
                expect(paymentInstrumentHelper.removePaypalPaymentInstrument(basket, undefined)).to.be.undefined;
                expect(basket.removePaymentInstrument.calledOnce).to.be.true;
            });
        });

        describe('if paypalPaymentInstrument was passed', () => {
            it('should remove passed payment instrument from basket', () => {
                const paypalInstr = ['paypal'];

                expect(paymentInstrumentHelper.removePaypalPaymentInstrument(basket, paypalInstr)).to.be.undefined;
                expect(basket.removePaymentInstrument.calledWith(paypalInstr)).to.be.true;
            });
        });
    });

    describe('removePayPalPaymentInstrumentByEmail', () => {
        const paymentInstruments = [{
            custom: {
                currentPaypalEmail: 'paypal@email.com'
            }
        }];

        const basket = {
            getPaymentInstruments: () => ({
                toArray: () => paymentInstruments
            }),
            removePaymentInstrument: stub()
        };

        let email = 'paypal@email.com';

        afterEach(() => {
            basket.removePaymentInstrument.reset();
        });

        it('should find payment instrument and remove it', () => {
            paymentInstrumentHelper.removePayPalPaymentInstrumentByEmail(basket, email);

            expect(basket.removePaymentInstrument.calledOnce).to.be.true;
            expect(basket.removePaymentInstrument.calledWith(paymentInstruments[0])).to.be.true;
        });

        it('should not find payment instrument and not remove it', () => {
            email = 'fake@email.com';

            paymentInstrumentHelper.removePayPalPaymentInstrumentByEmail(basket, email);

            expect(basket.removePaymentInstrument.calledOnce).to.be.false;
        });
    });

    describe('getPaymentInstrumentAction', () => {
        const responseKeys = ['noOrderIdChange', 'isOrderIdChanged'];
        const paymentInstrument = {
            custom: {
                paypalOrderID: 'paypal-order-id'
            }
        };

        before(() => {
            session.privacy = {};
            session.privacy.paypalOrderID = 'paypal-order-id';
        });

        after(() => {
            delete session.privacy.paypalOrderID;
        });

        it('should return an object', () => {
            expect(paymentInstrumentHelper.getPaymentInstrumentAction(paymentInstrument)).to.be.a('object');
        });

        it('should return not empty object', () => {
            expect(paymentInstrumentHelper.getPaymentInstrumentAction(paymentInstrument)).to.not.be.empty;
        });

        it('should return object with isOrderIdChanged key and false value', () => {
            expect(paymentInstrumentHelper.getPaymentInstrumentAction(paymentInstrument).isOrderIdChanged).to.be.false;
        });

        responseKeys.forEach((key) => {
            it(`should return ${key} key`, () => {
                expect(paymentInstrumentHelper.getPaymentInstrumentAction(paymentInstrument)).to.contain.key(key);
            });
        });

        describe('if id of payment instrument and form is different', () => {
            before(() => {
                paymentInstrument.custom.paypalOrderID = 'newId';
            });

            it('should return object with isOrderIdChanged key and true value', () => {
                expect(paymentInstrumentHelper.getPaymentInstrumentAction(paymentInstrument).isOrderIdChanged).to.be.true;
            });
        });

        describe('createPaymentInstrument', () => {
            let getPaymentMethod;

            const amount = new dw.value.Money(10);

            const instrument = {
                paymentTransaction: {
                    setPaymentProcessor: stub()
                }
            };

            const basket = {
                totalGrossPrice: new dw.value.Money(20),
                getGiftCertificatePaymentInstruments: () => ({
                    iterator: () => {
                        return new dw.util.Iterator([{
                            getPaymentTransaction: () => ({
                                getAmount: () => {
                                    return amount;
                                }
                            })
                        }]);
                    }
                }),
                createPaymentInstrument: () => (instrument),
                createPaymentInstrumentFromWallet: () => (instrument)
            };

            const paymentType = 'PayPal';

            before(() => {
                getPaymentMethod = stub(dw.order.PaymentMgr, 'getPaymentMethod');
                getPaymentMethod.returns({
                    getPaymentProcessor: () => ({})
                });

                Object.assign(global.customer, {
                    authenticated: true,
                    profile: {
                        wallet: {
                            paymentInstruments: {
                                toArray: () => [{ custom: { currentPaypalEmail: 'Vinogradov@gmail.com' } }, { custom: { currentPaypalEmail: 'OtherEmail@example.com' } }]
                            }
                        }
                    }
                });

                request.httpParameterMap = {
                    restPaypalAccountsList: {
                        stringValue: 'paypal'
                    }
                };
            });

            after(() => {
                getPaymentMethod.reset();
            });

            it('should be an object', () => {
                expect(paymentInstrumentHelper.createPaymentInstrument(basket, paymentType)).to.be.a('object');
            });

            it('should return not empty object', () => {
                expect(paymentInstrumentHelper.getPaymentInstrumentAction(paymentInstrument)).to.not.be.empty;
            });

            it('should create and return payment instruments', () => {
                expect(paymentInstrumentHelper.createPaymentInstrument(basket, paymentType)).to.deep.equal(instrument);
            });
        });

        describe('removeNonPayPalPaymentInstrument', () => {
            let paymentInstruments = [
                {
                    paymentMethod: 'PayPal'
                },
                {
                    paymentMethod: 'CREDIT_CARD'
                },
                {
                    paymentMethod: 'GIFT_CERTIFICATE'
                }
            ];

            const basket = {
                getPaymentInstruments: () => ({
                    iterator: (() => {
                        let index = 0;
                        let prevLength = paymentInstruments.length;

                        return () => ({
                            hasNext: () => index < paymentInstruments.length,
                            next: () => {
                                if (prevLength !== paymentInstruments.length) {
                                    prevLength = paymentInstruments.length;

                                    return paymentInstruments[index - 1];
                                }

                                return paymentInstruments[index++];
                            }
                        });
                    })()
                }),
                removePaymentInstrument: (instrument) => {
                    paymentInstruments = paymentInstruments.filter((inst) => {
                        return inst.paymentMethod !== instrument.paymentMethod;
                    });
                }
            };

            beforeEach(() => {
                paymentInstrumentHelper.removeNonPayPalPaymentInstrument(basket);
            });

            afterEach(() => {
                paymentInstruments = [
                    {
                        paymentMethod: 'PayPal'
                    },
                    {
                        paymentMethod: 'CREDIT_CARD'
                    },
                    {
                        paymentMethod: 'GIFT_CERTIFICATE'
                    }
                ];
            });

            describe('should delete instruments except \'GIFT_CERTIFICATE\'', () => {
                it('should return true', () => {
                    paymentInstrumentHelper.removeNonPayPalPaymentInstrument(basket);

                    expect(paymentInstruments.length === 1).to.be.true;
                });
            });

            describe('should delete all instruments if \'GIFT_CERTIFICATE\' was not provided', () => {
                before(() => {
                    paymentInstruments = [
                        {
                            paymentMethod: 'PayPal'
                        },
                        {
                            paymentMethod: 'CREDIT_CARD'
                        }
                    ];
                    paymentInstrumentHelper.removeNonPayPalPaymentInstrument(basket);
                });

                it('should return true', () => {
                    expect(paymentInstruments.length === 0).to.be.true;
                });
            });
        });
    });

    describe('getCustomerPiByCreditCardToken', () => {
        const originalCustomer = customer;

        before(() => {
            customer = {
                profile: {
                    wallet: {
                        paymentInstruments: {
                            toArray: () => [{ creditCardToken: '1111' }, { creditCardToken: '2222' }]
                        }
                    }
                }
            };
        });

        after(() => {
            customer = originalCustomer;
        });

        it('customer payment instrument should be returned', () => {
            const result = paymentInstrumentHelper.getCustomerPiByCreditCardToken('1111');

            expect(result).to.be.an('object');
            expect(result.creditCardToken).to.equal('1111');
        });

        it('if there is no pi with such credit card token, undefined should be returned', () => {
            const result = paymentInstrumentHelper.getCustomerPiByCreditCardToken('3333');

            expect(result).to.be.undefined;
        });

        it('should return payment instrument in case if function is called with profile as argument', () => {
            const mockedProfile = customer.profile;

            customer.profile = null;

            const result = paymentInstrumentHelper.getCustomerPiByCreditCardToken('1111', mockedProfile);

            expect(result).to.be.an('object');
            expect(result.creditCardToken).to.equal('1111');
        });
    });

    describe('getCustomerPiByUUID', () => {
        const originalCustomer = customer;
        const paymentInstrument = {
            getUUID: () => '001'
        };

        before(() => {
            customer = {
                profile: {
                    wallet: {
                        paymentInstruments: {
                            toArray: () => {
                                return [paymentInstrument];
                            }
                        }
                    }
                }
            };
        });

        after(() => {
            customer = originalCustomer;
        });

        it('should be a function', () => {
            expect(paymentInstrumentHelper.getCustomerPiByUUID).to.be.a('function');
        });

        it('should return a customer payment instrument', () => {
            expect(paymentInstrumentHelper.getCustomerPiByUUID('001')).that.deep.equal(paymentInstrument);
        });

        it('should not return a customer payment instrument', () => {
            expect(paymentInstrumentHelper.getCustomerPiByUUID('002')).to.be.an('undefined');
        });
    });

    describe('getPaymentMethodsIdWithPaypalProcessor', () => {
        const getPaymentMethodsIdWithPaypalProcessor = paymentInstrumentHelper.__get__('getPaymentMethodsIdWithPaypalProcessor');

        it('should be an array', () => {
            expect(getPaymentMethodsIdWithPaypalProcessor()).to.be.an('array');
        });

        it('should be an array that contains PayPal payment method', () => {
            expect(getPaymentMethodsIdWithPaypalProcessor()).to.be.an('array').that.include('PayPal');
        });

        it('should be an array that contains ApplePay payment method', () => {
            expect(getPaymentMethodsIdWithPaypalProcessor()).to.be.an('array').that.include('ApplePay');
        });
    });

    describe('getPaypalPaymentInstrumentById', () => {
        const pi = [
            {
                Array: {
                    paymentMethod: 'PayPal'
                }
            }
        ];

        const lineItemCtnr = {
            getPaymentInstruments: () => pi
        };

        it('should return a payment instrument PayPal', () => {
            expect(paymentInstrumentHelper.getPaypalPaymentInstrumentById(lineItemCtnr, 'PayPal')).to.be.equal(pi[0]);
        });
    });

    describe('getLastAddedPaypalPaymentInstrument', () => {
        it('should return undefined if paypalPaymentInstruments variable is empty', () => {
            expect(paymentInstrumentHelper.getLastAddedPaypalPaymentInstrument([])).to.be.undefined;
        });

        it('should return last added paypal payment instrument', () => {
            const paypalPaymentInstruments = [
                { creationDate: new Date('2024', '1', '20') },
                { creationDate: new Date('2024', '7', '17') },
                { creationDate: new Date('2024', '6', '29') }
            ];

            const result = paymentInstrumentHelper.getLastAddedPaypalPaymentInstrument(paypalPaymentInstruments);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({ creationDate: new Date('2024', '7', '17') });
        });
    });
});
