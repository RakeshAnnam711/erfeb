/* eslint-disable object-curly-newline */

const { int_paypal: { processorPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const { describe, it, before, after } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const createPaymentInstrument = stub();
const getPaypalPaymentInstrument = stub();
const calculateNonGiftCertificateAmount = stub();
const handleBaShippingAddress = stub();
const clearCurrentPaypalEmail = stub();
const createBAReqBody = stub();
const getPurchaseUnit = stub();
const isPurchaseUnitChanged = stub();
const createErrorLog = stub();
const encodeString = stub();
const updateBillingInfoIfAccountChanged = stub();
const updateOrderBillingAddress = stub();
const updateBABillingAddress = stub();
const validateCheckoutOrdersPaypalAddresses = stub();
const validateBaPaypalAddresses = stub();
const getOrderDetails = stub();
const getBADetails = stub();
const updateOrderDetails = stub();
const createTransaction = stub();
const createOrder = stub();
const getTransactionId = stub();
const getTransactionStatus = stub();
const prepareTransactionHistory = stub();
const isSavedCardFlow = stub();
const stringifyBillingAddress = stub();
const saveCreditCardToCustomerWallet = stub();
const setBillingAddressFromPaypal = stub();
const handleGooglePayStub = stub();
const handleApplePayStub = stub();
const process3DSecureResponseMock = stub();
const isFastlaneUsed = stub();
const completeFastlaneOrder = stub();
const setCustomerEmailToBasket = stub();

const DEBIT_CREDIT_CARD_ID = 'PayPal Debit/Credit Card';

const paypalPreferences = {
    threeDSecureFlow: 'SCA_ALWAYS',
    isDigitalGoodsFlowEnabled: false
};

const resources = {
    paypal: {
        error: {
            general: 'An error occurs, please try again',
            zeroamount: 'Zero amount'
        }
    }
};

request.httpReferer = 'https://dx.commercecloud.salesforce.com/on/demandware.store/Sites-RefArch-Site/en_US/Cart-Show';

let paymentInstrumentName;

const processor = proxyquire(processorPath, {
    'dw/order/Order': dw.order.Order,
    'dw/system/Transaction': {
        wrap: (a) => a()
    },
    'dw/web/Resource': dw.web.Resource,
    '*/cartridge/config/preferences': paypalPreferences,
    '*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper': { createPaymentInstrument, getPaypalPaymentInstrument, calculateNonGiftCertificateAmount },
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        getPurchaseUnit,
        isPurchaseUnitChanged,
        getTransactionId,
        getTransactionStatus,
        prepareTransactionHistory,
        updateBillingInfoIfAccountChanged,
        stringifyBillingAddress,
        setBillingAddressFromPaypal,
        isFastlaneUsed
    },
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog,
        encodeString
    },
    '*/cartridge/scripts/paypal/helpers/addressHelper': {
        updateOrderBillingAddress,
        updateBABillingAddress,
        validateCheckoutOrdersPaypalAddresses,
        validateBaPaypalAddresses,
        setCustomerEmailToBasket
    },
    '*/cartridge/scripts/paypal/api': {
        getOrderDetails,
        getBADetails,
        updateOrderDetails,
        createTransaction,
        createOrder
    },
    '*/cartridge/config/constants': {
        PAYMENT_METHOD_ID_VENMO: 'venmo',
        PAYMENT_METHOD_ID_Debit_Credit_Card: DEBIT_CREDIT_CARD_ID,
        PAYMENT_METHOD_ID_PAYPAL: 'PayPal',
        PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
        PAYPAL_CARD_ERROR_STATUSES: [
            'DENIED',
            'DECLINED'
        ],
        SCA_ALWAYS: 'SCA_ALWAYS',
        CC_3DS_LIABILITY_SHIFT_STATUS_NO: 'NO',
        CC_3DS_ALLOWED_ENROLLMENT_STATUS_YES: 'Y',
        CC_3DS_LIABILITY_SHIFT_STATUS_UNKNOWN: 'UNKNOWN',
        PAYMENT_METHOD_ID_GOOGLE_PAY: 'GooglePay',
        PAYMENT_METHOD_ID_APPLE_PAY: 'ApplePay'
    },
    '*/cartridge/scripts/util/collections': {
        forEach: () => {}
    },
    '*/cartridge/scripts/paypal/helpers/googlePayHelper': {
        handleGooglePay: handleGooglePayStub
    },
    '*/cartridge/scripts/paypal/helpers/paypalProcessorHelper': {
        clearCurrentPaypalEmail,
        handleBaShippingAddress,
        handleApplePay: handleApplePayStub,
        handlePaymentInstrument: () => ({
            paymentMethod: paymentInstrumentName,
            UUID: 'ee6d20764050743b97cab7e8f6',
            custom: {
                paypalOrderID: '8UU486582S253361B'
            }
        }),
        process3DSecureResponse: process3DSecureResponseMock,
        saveGeneralTransactionData: () => {},
        handleOrderDetailsError: () => {
            return {
                error: true,
                fieldErrors: [],
                serverErrors: [
                    resources.paypal.error.general
                ]
            };
        }
    },
    '*/cartridge/scripts/paypal/helpers/creditCardHelper': {
        isSavedCardFlow: isSavedCardFlow,
        formatComplexCCBrandCode: () => {},
        saveCreditCardToCustomerWallet: saveCreditCardToCustomerWallet,
        completeFastlaneOrder: completeFastlaneOrder
    },
    '*/cartridge/models/orderDataHash': function() {
        return {
            get: () => '123',
            set: () => {},
            clear: () => {}
        };
    }
});

describe('processor file', () => {
    before(() => {
        session.privacy = {
            paypalOrderID: '54678y9uiokl'
        };
    });

    describe('handleCreditCardFlow', () => {
        const basket = {
            billingAddress: {}
        };

        const billingForm = {
            paypal: {
                usedPaymentMethod: {
                    htmlValue: 'PAYPAL_CREDIT_CARD'
                },
                saveCreditCardAccount: {
                    checked: true
                },
                creditCardHolderName: {
                    htmlValue: ''
                }
            }
        };

        const paymentInstrument = {
            custom: {
                paypalOrderID: null,
                paymentId: null,
                payPalSaveCreditCard: null,
                paypalCreditCardBillingAddress: null
            },
            creditCardType: null,
            creditCardNumber: null,
            creditCardHolder: null,
            setCreditCardExpirationMonth: () => 'expirationMonth',
            setCreditCardExpirationYear: () => 'expirationYear'
        };

        const orderDetails = {
            payment_source: {
                card: {
                    brand: {
                        toLowerCase: () => ''
                    },
                    last_digits: '0001',
                    authentication_result: {
                        liability_shift: 'YES',
                        three_d_secure: {}
                    }
                }
            },
            purchase_units: [{
                shipping: {
                    address: {}
                }
            }]
        };

        const handleCreditCardFlow = processor.__get__('handleCreditCardFlow');

        before(() => {
            stub(dw.web.Resource, 'msg');
            stringifyBillingAddress.returns({});
        });

        after(() => {
            stringifyBillingAddress.reset();
            isSavedCardFlow.reset();
            getOrderDetails.reset();
            dw.web.Resource.msg.restore();
            createErrorLog.reset();
        });

        it('if isSavedCardFlow is true', () => {
            isSavedCardFlow.returns(true);

            expect(handleCreditCardFlow).to.be.a('function');
            expect(handleCreditCardFlow(basket, billingForm, paymentInstrument))
                .to.be.an('object')
                .that.deep.equal({
                    shippingAddress: null
                });
        });

        it('if isSavedCardFlow is false', () => {
            isSavedCardFlow.returns(false);
            getOrderDetails.returns(orderDetails);

            expect(handleCreditCardFlow(basket, billingForm, paymentInstrument))
                .that.deep.equal({
                    shippingAddress: {}
                });
        });

        it('if isSavedCardFlow is false and orderDetails contains the expiry object', () => {
            orderDetails.payment_source.card.expiry = '01-25';

            isSavedCardFlow.returns(false);
            getOrderDetails.returns(orderDetails);

            expect(handleCreditCardFlow(basket, billingForm, paymentInstrument))
                .that.deep.equal({
                    shippingAddress: {}
                });
        });

        it('if getOrderDetails returns an error', () => {
            getOrderDetails.returns({
                err: resources.paypal.error.general
            });
            isSavedCardFlow.returns(false);
            dw.web.Resource.msg.returns(resources.paypal.error.general);

            expect(handleCreditCardFlow(basket, billingForm, paymentInstrument))
                .that.deep.equal({
                    error: true,
                    fieldErrors: [],
                    serverErrors: [resources.paypal.error.general]
                });
        });

        describe('should return object with error', () => {
            session.privacy = {
                paypalOrderID: 'vuyiojkml'
            };

            const error = {
                error: true,
                message: '3DS Check failed'
            };

            process3DSecureResponseMock.returns(error);
            getOrderDetails.returns(orderDetails);

            expect(handleCreditCardFlow(basket, billingForm, paymentInstrument)).that.deep.equal(error);

            process3DSecureResponseMock.returns({});
        });
    });

    describe('handleOrderIdFlow', () => {
        const basket = {};
        const paymentInstrument = { custom: {} };
        const billingForm = { paypal: { usedPaymentMethod: { value: 'PayPal' } } };

        const payer = {
            address: {},
            email_address: 'I.VinogradovVN@gmail.com',
            name: {},
            payer_id: 'QMG34HJTGX6NU',
            phone_number: {
                national_number: '4084607119',
                phone_type: 'HOME'
            },
            phone: '4084607119'
        };

        const purchaseUnits = [{
            amount: {},
            description: 'Casual Spring Easy Jacket',
            invoice_id: '00003402',
            payee: {
                email_address: 'user@business.example.com',
                merchant_id: 'BZKDAFFRXNJ7G'
            },
            shipping: {
                phone_number: {
                    national_number: '555555555'
                },
                address: {
                    postal_code: '79071'
                },
                name: {
                    full_name: 'Jon Weak'
                }
            }
        }];
        const mockPurchaseUnits = [].concat(purchaseUnits);

        const handleOrderIdFlow = processor.__get__('handleOrderIdFlow');

        before(() => {
            stub(dw.web.Resource, 'msg');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('should return an object with shipping address property', () => {
            getOrderDetails.returns({ payer, purchase_units: purchaseUnits });
            validateCheckoutOrdersPaypalAddresses.returns({ error: false });

            expect(handleOrderIdFlow).to.be.a('function');

            expect(handleOrderIdFlow(basket, billingForm, paymentInstrument))
                .to.be.an('object')
                .that.deep.equal({
                    shippingAddress: purchaseUnits[0].shipping
                });
        });

        it('should return an object where shipping address property contains phone instead of phone_number', () => {
            mockPurchaseUnits[0].shipping.phone_number = null;
            getOrderDetails.returns({ payer, purchase_units: mockPurchaseUnits });
            validateCheckoutOrdersPaypalAddresses.returns({ error: false });

            expect(handleOrderIdFlow(basket, billingForm, paymentInstrument))
                .to.be.an('object')
                .that.deep.equal({
                    shippingAddress: Object.assign(mockPurchaseUnits[0].shipping, { phone: payer.phone })
                });
        });

        it('should return an object with email_address in case if shipping address has no email address', () => {
            mockPurchaseUnits[0].shipping.email_address = null;
            getOrderDetails.returns({ payer, purchase_units: mockPurchaseUnits });

            expect(handleOrderIdFlow(basket, billingForm, paymentInstrument))
                .to.be.an('object')
                .that.deep.equal({
                    shippingAddress: Object.assign(mockPurchaseUnits[0].shipping, { email_address: payer.email_address })
                });
        });

        it('should return an object with error if validation for checkout orders paypal addresses is failed', () => {
            validateCheckoutOrdersPaypalAddresses.returns({
                error: true,
                errorName: 'shipping.address.invalid',
                fields: { country: 'Invalid field' },
                message: 'Shipping address validation is failure'
            });

            expect(handleOrderIdFlow(basket, billingForm, paymentInstrument))
                .to.deep.equal({
                    error: true,
                    errorName: 'shipping.address.invalid',
                    statusCode: 422,
                    fieldErrors: [{ country: 'Invalid field' }],
                    serverErrors: ['Shipping address validation is failure']
                });
        });

        it('should return an object with error if getOrderDetails is failed', () => {
            getOrderDetails.returns({ payer, purchase_units: purchaseUnits, err: {} });
            dw.web.Resource.msg.returns(resources.paypal.error.general);

            expect(handleOrderIdFlow(basket, billingForm, paymentInstrument))
                .to.deep.equal({
                    error: true,
                    fieldErrors: [],
                    serverErrors: [resources.paypal.error.general]
                });
        });

        it('should return empty shipping address object if digital goods flow is enabled', () => {
            paypalPreferences.isDigitalGoodsFlowEnabled = true;
            purchaseUnits[0].shipping = null;
            getOrderDetails.returns({ payer, purchase_units: purchaseUnits });
            validateCheckoutOrdersPaypalAddresses.returns({ error: false });

            expect(handleOrderIdFlow(basket, billingForm, paymentInstrument))
                .to.be.an('object')
                .that.deep.equal({
                    shippingAddress: purchaseUnits[0].shipping
                });

            expect(setCustomerEmailToBasket.calledOnce).to.be.true;
        });
    });

    describe('checkOrderValidity', () => {
        const order = { status: 'new' };
        const paymentInstrument = {
            paymentTransaction: {
                amount: { value: 10 }
            }
        };

        const checkOrderValidity = processor.__get__('checkOrderValidity');

        before(() => {
            stub(dw.web.Resource, 'msg');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('should return an object with property error equal to false', () => {
            expect(checkOrderValidity).to.be.a('function');

            expect(checkOrderValidity(order, paymentInstrument))
                .to.be.an('object')
                .that.deep.equal({
                    error: false
                });
        });

        it('should return an object with property error equal to true if payment transaction abount is zero', () => {
            dw.web.Resource.msg.returns('Order total 0 is not allowed for PayPal');
            paymentInstrument.paymentTransaction.amount.value = 0;

            expect(checkOrderValidity(order, paymentInstrument))
                .that.deep.equal({
                    error: true,
                    errorMessage: 'Order total 0 is not allowed for PayPal'
                });
        });

        it('should return an object with property error equal to true if paymentInstrument is empty', () => {
            dw.web.Resource.msg.returns(resources.paypal.error.general);
            order.status = 8;

            expect(checkOrderValidity(order, paymentInstrument))
                .that.deep.equal({
                    error: true,
                    errorMessage: resources.paypal.error.general
                });
        });

        it('should return an object with property error equal to true if order is empty', () => {
            delete order.status;

            expect(checkOrderValidity(order, paymentInstrument))
                .that.deep.equal({
                    error: true,
                    errorMessage: resources.paypal.error.general
                });
        });

        it('should return an object with property error equal to true if order status is failed', () => {
            delete paymentInstrument.paymentTransaction;

            expect(checkOrderValidity(order, paymentInstrument))
                .that.deep.equal({
                    error: true,
                    errorMessage: resources.paypal.error.general
                });
        });
    });

    describe('handle', () => {
        const basket = {};
        const shippingAddress = {
            city: 'Pond',
            country_code: 'US',
            line1: '4866 Rodney Street',
            postal_code: '63040',
            state: 'MO',
            recipient_name: 'Ivan C Vinogradov',
            phone: '408-922-3384'
        };

        let paymentInformation = {
            billingForm: {
                paypal: {
                    usedPaymentMethod: {
                        value: 'paypal'
                    }
                }
            }
        };

        beforeEach(() => {
            paymentInstrumentName = 'PayPal';
            processor.__set__('handleOrderIdFlow', () => ({ shippingAddress: shippingAddress }));
            paymentInformation = {
                billingForm: {
                    paypal: {
                        usedPaymentMethod: {
                            value: 'paypal'
                        }
                    }
                }
            };
        });

        after(() => {
            processor.__ResetDependency__('handleOrderIdFlow');
            isFastlaneUsed.reset();
        });

        it('should return an object for order id flow', () => {
            expect(processor.handle(basket, paymentInformation, shippingAddress))
                .to.deep.equal({
                    success: true,
                    shippingAddress: shippingAddress,
                    paymentInstrument: {
                        paymentMethod: 'PayPal',
                        UUID: 'ee6d20764050743b97cab7e8f6',
                        custom: {
                            paypalOrderID: '8UU486582S253361B'
                        }
                    }
                });
        });

        it('should return an object for google pay flow', () => {
            paymentInstrumentName = 'GooglePay';
            paymentInformation.billingForm.paypal.usedPaymentMethod.value = 'GooglePay';
            handleGooglePayStub.returns({ shippingAddress: shippingAddress });

            expect(processor.handle(basket, paymentInformation))
                .to.deep.equal({
                    success: true,
                    shippingAddress: shippingAddress,
                    paymentInstrument: {
                        paymentMethod: 'GooglePay',
                        UUID: 'ee6d20764050743b97cab7e8f6',
                        custom: {
                            paypalOrderID: '8UU486582S253361B'
                        }
                    }
                });
        });

        it('should return an object for apple pay flow', () => {
            paymentInstrumentName = 'ApplePay';
            paymentInformation.billingForm.paypal.usedPaymentMethod.value = 'ApplePay';
            handleApplePayStub.returns({ shippingAddress: shippingAddress });

            expect(processor.handle(basket, paymentInformation))
                .to.deep.equal({
                    success: true,
                    shippingAddress: shippingAddress,
                    paymentInstrument: {
                        paymentMethod: 'ApplePay',
                        UUID: 'ee6d20764050743b97cab7e8f6',
                        custom: {
                            paypalOrderID: '8UU486582S253361B'
                        }
                    }
                });
        });

        it('should return an object for credit card flow', () => {
            isFastlaneUsed.returns(false);
            paymentInstrumentName = 'PAYPAL_CREDIT_CARD';
            paymentInformation.billingForm.paypal.usedPaymentMethod.value = 'PAYPAL_CREDIT_CARD';
            processor.__set__('handleCreditCardFlow', () => ({ shippingAddress: shippingAddress }));

            expect(processor.handle(basket, paymentInformation))
                .to.deep.equal({
                    success: true,
                    shippingAddress: shippingAddress,
                    paymentInstrument: {
                        paymentMethod: 'PAYPAL_CREDIT_CARD',
                        UUID: 'ee6d20764050743b97cab7e8f6',
                        custom: {
                            paypalOrderID: '8UU486582S253361B'
                        }
                    }
                });
        });

        it('should return an object for Fastlane flow', () => {
            isFastlaneUsed.returns(true);
            paymentInstrumentName = 'PAYPAL_CREDIT_CARD';
            paymentInformation.billingForm.paypal.usedPaymentMethod.value = 'PAYPAL_CREDIT_CARD';
            processor.__set__('handleFastlaneFlow', () => ({ shippingAddress: shippingAddress }));

            expect(processor.handle(basket, paymentInformation))
                .to.deep.equal({
                    success: true,
                    shippingAddress: shippingAddress,
                    paymentInstrument: {
                        paymentMethod: 'PAYPAL_CREDIT_CARD',
                        UUID: 'ee6d20764050743b97cab7e8f6',
                        custom: {
                            paypalOrderID: '8UU486582S253361B'
                        }
                    }
                });
        });

        it('should return an object with error', () => {
            processor.__set__('handleOrderIdFlow', () => ({
                error: true,
                fieldErrors: [],
                serverErrors: []
            }));

            expect(processor.handle(basket, paymentInformation, shippingAddress))
                .to.deep.equal({
                    error: true,
                    fieldErrors: [],
                    serverErrors: []
                });
        });
    });

    describe('handleCreateTransaction', () => {
        const paymentInstrument = {
            paymentTransaction: { amount: { value: 47.23 }, custom: {} },
            paymentMethod: 'PAYPAL_CREDIT_CARD',
            creditCardHolder: 'Card Holder',
            creditCardToken: null,
            custom: {
                currentPayPalEmail: 'I.VinogradovVN@gmail.com',
                payPalOrderStatus: '',
                payPalSaveCreditCard: true,
                paypalCreditCardBillingAddress: 'billingAddress'
            },
            getPaymentTransaction: () => {
                return {
                    setTransactionID: () => {
                    }
                };
            }
        };

        const handleCreateTransaction = processor.__get__('handleCreateTransaction');

        before(() => {
            stub(dw.web.Resource, 'msg');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        afterEach(() => {
            updateOrderDetails.reset();
            createTransaction.resetHistory();
        });

        it('should return error object if paypal transaction status is denied', () => {
            dw.web.Resource.msg.returns('Transaction denied');
            updateOrderDetails.returns({});

            createTransaction.returns({
                response: {
                    status: 'DENIED'
                }
            });

            getTransactionStatus.returns('DENIED');

            expect(handleCreateTransaction(paymentInstrument, {})).to.deep.equal({
                error: true,
                errorMessage: 'Transaction denied'
            });
        });

        it('should return response object if paypal transaction status is not denied', () => {
            dw.web.Resource.msg.returns('Transaction denied');
            updateOrderDetails.returns({});

            createTransaction.returns({
                response: {
                    status: 'Authorized',
                    payment_source: {
                        paypal: {
                            attributes: {
                                vault: true
                            }
                        }
                    }
                }
            });

            getTransactionStatus.returns('Authorized');

            expect(handleCreateTransaction(paymentInstrument, {})).to.deep.equal({
                status: 'Authorized',
                payment_source: {
                    paypal: {
                        attributes: {
                            vault: true
                        }
                    }
                }
            });
        });
    });

    describe('authorize', () => {
        const purchaseUnit = {
            amount: {},
            description: 'Long Sleeve Crew Neck',
            invoice_id: '00003603',
            shipping: {}
        };

        const order = {};
        const paymentInstrument = {
            custom: {}
        };

        isPurchaseUnitChanged.returns(true);
        getPurchaseUnit.returns(purchaseUnit);

        before(() => {
            stub(dw.web.Resource, 'msg');

            createBAReqBody.returns({
                payment_source: {
                    token: {
                        id: 'B-7J122468JR707841D',
                        type: 'BILLING_AGREEMENT'
                    }
                }
            });

            getTransactionId.returns('7ML06956NU4656408');
            getTransactionStatus.returns('COMPLETED');
            prepareTransactionHistory.returns([]);
        });

        after(() => {
            dw.web.Resource.msg.restore();

            getTransactionId.reset();
            getTransactionStatus.reset();
            prepareTransactionHistory.reset();
            isFastlaneUsed.reset();
            completeFastlaneOrder.reset();
        });

        afterEach(() => {
            createErrorLog.reset();
            updateOrderDetails.resetHistory();
            createOrder.reset();
            createTransaction.resetHistory();
            saveCreditCardToCustomerWallet.reset();
        });

        it('should return object {error: true} if paymentInstrument or order is empty', () => {
            dw.web.Resource.msg.returns(resources.paypal.error.general);

            expect(processor.authorize(order, paymentInstrument)).to.deep.equal({
                error: true,
                errorMessage: resources.paypal.error.general
            });
        });

        it('should return object {error: true} if paymentInstrument.paymentTransaction.amount.value is 0', () => {
            dw.web.Resource.msg.returns(resources.paypal.error.zeroamount);

            const paymentInstrument2 = {
                paymentTransaction: {
                    amount: {
                        value: 0
                    }
                },
                custom: {
                    payPalOrderStatus: ''
                }
            };

            const order2 = {
                status: {
                    displayValue: 'CREATED',
                    value: 0
                }
            };

            expect(processor.authorize(order2, paymentInstrument2)).to.deep.equal({
                error: true,
                errorMessage: resources.paypal.error.zeroamount
            });
        });

        it('shoud return {authorized: true} if BA is active', () => {
            const paymentInstrument3 = {
                paymentTransaction: { amount: { value: 47.23 }, custom: {} },
                paymentMethod: 'PAYPAL_CREDIT_CARD',
                creditCardHolder: 'Card Holder',
                creditCardToken: null,
                custom: {
                    currentPayPalEmail: 'I.VinogradovVN@gmail.com',
                    payPalOrderStatus: '',
                    payPalSaveCreditCard: true,
                    paypalCreditCardBillingAddress: 'billingAddress'
                },
                getPaymentTransaction: () => {
                    return { setTransactionID: () => { } };
                }
            };

            const order3 = {
                createdBy: 'Customer',
                currencyCode: 'USD',
                currentOrderNo: '00003605',
                customerEmail: 'I.VinogradovVN@gmail.com',
                customerLocaleID: 'en_US',
                customerName: 'Ivan C Vinofradov',
                status: {
                    displayValue: 'CREATED',
                    value: 0
                },
                custom: {}
            };

            const resp = {
                id: '7ML06956NU4656408',
                links: [
                    {
                        href: 'https://api.sandbox.paypal.com/v2/checkout/orders/7ML06956NU4656408',
                        method: 'GET',
                        rel: 'self'
                    },
                    {
                        href: 'https://www.sandbox.paypal.com/checkoutnow?token=7ML06956NU4656408',
                        method: 'GET',
                        rel: 'approve'
                    },
                    {
                        href: 'https://api.sandbox.paypal.com/v2/checkout/orders/7ML06956NU4656408',
                        method: 'PATCH',
                        rel: 'update'
                    },
                    {
                        href: 'https://api.sandbox.paypal.com/v2/checkout/orders/7ML06956NU4656408',
                        method: 'POST',
                        rel: 'authorize'
                    }
                ],
                status: 'CREATED'
            };

            updateOrderDetails.returns({});
            createOrder.returns({ resp });
            createTransaction.returns({
                response: {
                    status: 'COMPLETED',
                    payment_source: {
                        paypal: {
                            attributes: {
                                vault: true
                            }
                        }
                    }
                }
            });

            expect(processor.authorize(order3, paymentInstrument3)).to.deep.equal({ error: false });

            expect(saveCreditCardToCustomerWallet.calledOnce).to.be.true;
        });

        it('If on order details update error was thrown', () => {
            const paymentInstrument4 = {
                custom: { paypalOrderID: 'id' },
                paymentTransaction: {
                    amount: { value: 100 }
                }
            };

            const order4 = { status: 'AUTHORIZED' };

            updateOrderDetails.returns({ err: 'updateOrderDetailsError' });

            const result = processor.authorize(order4, paymentInstrument4);

            expect(result).to.be.an('object');
            expect(result.errorMessage).to.equal('updateOrderDetailsError');
            expect(result.serverErrors).to.be.deep.equal(['updateOrderDetailsError']);
        });

        it('If order details were successfully updated', () => {
            const paymentInstrument4 = {
                custom: {
                    paypalOrderID: 'id',
                    payPalOrderStatus: ''
                },
                paymentTransaction: {
                    custom: {},
                    amount: { value: 100 }
                },
                getPaymentTransaction: () => {
                    return { setTransactionID: () => { } };
                }
            };

            const order4 = {
                status: 'AUTHORIZED',
                custom: {}
            };

            updateOrderDetails.returns({});

            createTransaction.returns({
                response: {
                    status: 'COMPLETED',
                    payment_source: {
                        paypal: {
                            attributes: {
                                vault: null
                            }
                        }
                    }
                }
            });

            const result = processor.authorize(order4, paymentInstrument4);

            expect(result).to.be.an('object');
            expect(result.error).to.be.false;
        });

        it('If on transaction creation error was thrown', () => {
            const paymentInstrument5 = {
                custom: {
                    paypalOrderID: 'id'
                },
                paymentTransaction: {
                    amount: { value: 100 }
                }
            };

            const order5 = { status: 'AUTHORIZED', custom: {} };

            createTransaction.returns({ err: 'Error' });

            const result = processor.authorize(order5, paymentInstrument5);

            expect(result).to.be.an('object');
            expect(result.error).to.be.true;
            expect(result.serverErrors).to.be.deep.equal(['Error']);
        });

        it('shoud return {authorized: true} if fastlane is used', () => {
            const paymentInstrument6 = {
                custom: {
                    paypalOrderID: 'id',
                    payPalOrderStatus: ''
                },
                paymentTransaction: {
                    custom: {},
                    amount: { value: 100 }
                },
                getPaymentTransaction: () => {
                    return { setTransactionID: () => { } };
                }
            };

            const order6 = {
                status: 'AUTHORIZED',
                custom: {}
            };

            isFastlaneUsed.returns(true);
            completeFastlaneOrder.returns({ authorized: true });

            const result = processor.authorize(order6, paymentInstrument6);

            expect(result).to.be.deep.equal({ authorized: true });
        });
    });

    describe('handleFastlaneFlow', () => {
        const basket = {
            billingAddress: {}
        };

        const billingForm = {
            paypal: {
                usedPaymentMethod: {
                    htmlValue: 'PAYPAL_CREDIT_CARD'
                },
                fastlaneCardLastDigits: {
                    htmlValue: '1234'
                },
                fastlaneExpiry: {
                    htmlValue: '01-2030'
                },
                fastlaneCardType: {
                    htmlValue: 'visa'
                },
                fastlanePaymentToken: {
                    htmlValue: 'fewcfwek'
                },
                creditCardHolderName: {
                    htmlValue: 'Jon Doe'
                }
            }
        };

        const paymentInstrument = {
            custom: {
                paypalOrderID: null,
                paymentId: null,
                paypalCreditCardBillingAddress: null
            },
            creditCardType: null,
            creditCardNumber: null,
            creditCardHolder: null,
            setCreditCardExpirationMonth: () => 'expirationMonth',
            setCreditCardExpirationYear: () => 'expirationYear'
        };

        const handleFastlaneFlow = processor.__get__('handleFastlaneFlow');

        before(() => {
            stub(dw.web.Resource, 'msg');
            stringifyBillingAddress.returns({});
        });

        after(() => {
            stringifyBillingAddress.reset();
            dw.web.Resource.msg.restore();
            createErrorLog.reset();
        });

        it('if form contains the expiry object', () => {
            expect(handleFastlaneFlow(basket, billingForm, paymentInstrument))
                .that.deep.equal({
                    shippingAddress: {}
                });
        });

        it('if form does not contain expiry object', () => {
            billingForm.paypal.fastlaneExpiry.htmlValue = null;

            expect(handleFastlaneFlow(basket, billingForm, paymentInstrument))
                .that.deep.equal({
                    shippingAddress: {}
                });
        });
    });
});
