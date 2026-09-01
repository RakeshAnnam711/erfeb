/* eslint-disable no-underscore-dangle */
const { int_paypal: { paypalHelperPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const {
    describe, it, before, after, beforeEach, afterEach
} = require('mocha');

const { stub, assert } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const encodeString = stub();
const getShippingAddress = stub();
const createShippingAddress = stub();
const getBAShippingAddress = stub();
const toBase64 = stub();
const Bytes = stub();
const isJson = stub();
const searchOrder = stub();
const updateBABillingAddress = stub();
const getClientId = stub();
const getLocale = stub();
const customerStub = stub();
const createErrorLog = stub();
const createOrderStub = stub();
const createPaymentToken = stub();
const getCustomerPaymentInstruments = stub();
const isElementEnabled = stub();
const removePaypalPaymentInstrument = stub();
const createErrorMsg = stub();
const getCustomerPiByCreditCardToken = stub();
const deletePaymentToken = stub();
const sortPaymentInstrumentsByLastModifiedDesc = stub();
const getOnlinePickupShippingMethod = stub();
const getCurrentBasket = stub();

const customerPaymentInstruments = [
    { custom: { currentPaypalEmail: 'email1@example.com' } },
    { custom: { currentPaypalEmail: 'email2@example.com' } }
];

const paypalPreferences = {
    paypalButtonLocation: 'MiniCart,Cart',
    ppPayLaterCrossBorderMessagingEnabled: false,
    partnerAttributionId: 'SFCC_EC_B2C_25_3_0',
    isApplePayPmActive: true,
    l2l3DataEnabled: true,
    paypalVaultModeDisabled: false,
    returningCustomerExperienceEnabled: true,
    isPayPalPmActive: true,
    isGooglePayActive: true,
    paypalButtonMessagesLocation: 'PDP,MiciCart,Cart',
    isFastlaneEnabled: true,
    isDigitalGoodsFlowEnabled: false,
    buttonMessageConfig: {
        billing: { align: 'center', color: 'black', position: 'bottom' },
        pdp: { align: 'left', color: 'black', position: 'bottom' },
        pvp: { align: 'right', color: 'black', position: 'bottom' }
    }
};

const req = {
    locale: {
        id: 'en-US'
    },
    session: {
        currency: {
            currencyCode: 'USD'
        }
    }
};

let res = {
    json: () => {},
    viewData: {
        paylaterMessaging: {
            locale: '',
            currencyCode: '',
            config: ''
        },
        paylaterMessagingAvailable: false,
        bannerSdkUrl: ''
    },
    fieldErrors: []
};

const BasketMgr = {
    currentBasket: {
        getDefaultShipment: () => ({
            getShippingAddress
        }),
        giftCertificateLineItems: [],
        productLineItems: {}
    },
    currentOrNewBasket: {
        totalGrossPrice: { value: 0 }
    },
    getCurrentBasket: getCurrentBasket
};

const mockResponse = {
    viewData: {
        paypal: {},
        order: {
            shipping: [
                {
                    UUID: 'test_shipment'
                }
            ]
        }
    }
};

const getOrderDetails = () => {
    return {
        purchase_units: [{
            amount: {
                value: '244.23'
            }
        }]
    };
};

function getEmptyResponse() {
    return {
        viewData: {
            creditMessage: {
                locale: '',
                currencyCode: '',
                bannerConfig: ''
            },
            creditMessageAvailable: false,
            bannerSdkUrl: '',
            product: {
                price: {
                    sales: {
                        value: 0,
                        currency: 'USD'
                    }
                },
                productType: 'set',
                individualProducts: [],
                selectedQuantity: 1
            }
        }
    };
}

const mockPaypalConstants = {
    PAYMENT_METHOD_ID_VENMO: 'Venmo',
    PAYMENT_METHOD_ID_PAYPAL: 'PayPal',
    PAGE_FLOW_CART: 'cart',
    PAGE_FLOW_PDP: 'pdp',
    PAGE_FLOW_PVP: 'pvp',
    PAGE_FLOW_PRODUCT: 'product',
    PAGE_FLOW_PRODUCT_PREVIEW: 'product_preview',
    PAGE_FLOW_MINICART: 'minicart',
    PAYPAL_BUTTON_LOCATION: 'paypal',
    STATUS_ENABLED: 'enabled',
    VENMO_BUTTON_LOCATION: 'venmo',
    PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD'
};

const paypalHelper = proxyquire(paypalHelperPath, {
    '*/cartridge/config/preferences': paypalPreferences,
    '*/cartridge/scripts/paypal/utils': {
        encodeString,
        getClientId,
        createErrorLog,
        createErrorMsg
    },
    '*/cartridge/scripts/util/basicHelpers': {
        isJson,
        getPpClientMetadataId: () => ('7Df6GhUjK8l9M5nB4vC3xZ2cV1bNmQa')
    },
    '*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper': {
        calculateNonGiftCertificateAmount: () => ({
            toNumberString: () => '111.00'
        }),
        removePaypalPaymentInstrument,
        getCustomerPiByCreditCardToken
    },
    'dw/order/TaxMgr': dw.order.TaxMgr,
    'dw.customer.Customer': customerStub,
    '*/cartridge/scripts/paypal/helpers/addressHelper': {
        getBAShippingAddress,
        updateBABillingAddress,
        createShippingAddress
    },
    'dw/order/BasketMgr': BasketMgr,
    'dw/order/OrderMgr': {
        createOrderNo: () => '002001',
        searchOrder
    },
    'dw/value/Money': function(value, currencyCode) {
        this.value = value;
        this.currencyCode = currencyCode;

        this.multiply = function(quantity) {
            this.value *= quantity;

            return {
                decimalValue: {
                    toString: () => this.value.toFixed(2)
                }
            };
        };
    },
    'server': {
        forms: {
            getForm: () => ({
                clear: () => {
                },
                paypal: {
                    usedPaymentMethod: { htmlName: 'PayPal' },
                    makeDefaultPaypalAccount: {
                        htmlName: 'name'
                    },
                    applePay: {
                        applePayEmailAddress: 'applePayEmailAddress',
                        applePayPaymentSource: 'applePayPaymentSource',
                        applePayPhoneNumber: 'applePayPhoneNumber',
                        applePayShippingAddressAsString: 'applePayShippingAddressAsString'
                    }
                },
                paymentMethod: { htmlName: 'PayPal' }
            })
        }
    },
    '*/cartridge/config/constants': mockPaypalConstants,
    'dw/crypto/Encoding': { toBase64 },
    'dw/util/Bytes': Bytes,
    '*/cartridge/scripts/paypal/api': {
        getOrderDetails: getOrderDetails,
        createOrder: createOrderStub,
        deletePaymentToken: deletePaymentToken,
        createPaymentToken: createPaymentToken
    },
    '*/cartridge/config/sdkConfig': {
        paypalFraudNetScriptLink: 'https://c.paypal.com/da/r/fb.js'
    },
    '*/cartridge/config/sdk': {
        fraudNetNoScriptURL: (fraudNetUID) => {
            return ['https://c.paypal.com/v1/r/d/b/ns?f=', fraudNetUID, '&js=0&r=1'].join('');
        },
        cartSdkUrl: 'https://c.paypal.com/v1/sdk'
    },
    'dw/util/Locale': {
        getLocale: getLocale
    },
    '*/cartridge/config/payLaterMessagingConfig': {
        cart: { layout: 'text', ['text-color']: 'gray', placement: 'cart', status: 'enabled' },
        product: { layout: 'text', ['text-color']: 'gray', placement: 'product', status: 'enabled' },
        category: { layout: 'flex', color: 'gray', placement: 'category', status: 'enabled' }
    },
    'dw/web/Resource': {
        msgf: () => 'Option for Name1',
        msg: () => 'This PayPal account is already saved'
    },
    '*/cartridge/scripts/paypal/helpers/paypalProcessorHelper': {
        saveGeneralTransactionData: stub()
    },
    '*/cartridge/scripts/paypal/helpers/customerHelper': {
        getCustomerPaymentInstruments: getCustomerPaymentInstruments,
        setPayPalSavedCardsPaymentToken: (profileCustom, creditCardToken) => {
            if (!profileCustom.payPalSavedCardsPaymentTokens) {
                profileCustom.payPalSavedCardsPaymentTokens = '*'.concat(creditCardToken, '*');
            } else {
                profileCustom.payPalSavedCardsPaymentTokens += creditCardToken.concat('*');
            }
        }
    },
    '*/cartridge/scripts/paypal/helpers/paymentHelper': {
        isElementEnabled: isElementEnabled,
        sortPaymentInstrumentsByLastModifiedDesc: sortPaymentInstrumentsByLastModifiedDesc
    },
    '*/cartridge/config/urls': {
        paymentStage: '/paypal/payment-stage'
    },
    '*/cartridge/scripts/paypal/helpers/paymentSourcePaypal': {
        addContactInfoToPurchaseUnit: data => {
            if (!data.purchaseUnit.shipping) {
                data.purchaseUnit.shipping = {};
            }

            data.purchaseUnit.shipping.email_address = 'test@g.com';
            data.purchaseUnit.shipping.phone_number = {
                country_code: '1',
                national_number: '55555555'
            };
        }
    },
    '*/cartridge/scripts/checkout/shippingHelpers': {
        getOnlinePickupShippingMethod: getOnlinePickupShippingMethod
    }
});

describe('paypalHelper file', () => {
    const clientId = '12345abc';
    const sdkUrlResult = 'https://www.paypal.com/sdk/js?client-id=' + clientId + '&components=messages';

    describe('getTransactionId function', () => {
        const getTransactionId = paypalHelper.__get__('getTransactionId');
        const transactionResponseAuthorization = {
            purchase_units: [{
                payments: {
                    authorizations: [{ id: '3E179939TX5111812E' }]
                }
            }]
        };

        const transactionResponseCapture = {
            purchase_units: [{
                payments: {
                    captures: [{ id: '3E179939TX5111812E' }]
                }
            }]
        };

        it('should return payments.authorizations[0].id ', () => {
            expect(getTransactionId(transactionResponseAuthorization)).equal('3E179939TX5111812E');
        });
        it('should return payments.captures[0].id ', () => {
            expect(getTransactionId(transactionResponseCapture)).equal('3E179939TX5111812E');
        });
    });

    describe('getTransactionStatus function', () => {
        const getTransactionStatus = paypalHelper.__get__('getTransactionStatus');
        const transactionResponse = {
            purchase_units: [{
                payments: {
                    authorizations: [{
                        id: '3E179939TX5111812E',
                        status: 'CREATED'
                    }]
                }
            }]
        };

        const transactionResponseCaptures = {
            purchase_units: [{
                payments: {
                    captures: [{
                        id: '3E179939TX5111812E',
                        status: 'CAPTURED'
                    }]
                }
            }]
        };

        it('getTransactionStatus should return CREATED', () => {
            expect(getTransactionStatus(transactionResponse)).equal('CREATED');
        });
        it('getTransactionStatus should return CAPTURED', () => {
            expect(getTransactionStatus(transactionResponseCaptures)).equal('CAPTURED');
        });
        it('getTransactionStatus should return CAPTURED if payments.refunds is empty ', () => {
            const transactionResponse_ = {
                purchase_units: [{
                    payments: {
                        authorizations: [{
                            id: '3E179939TX5111812E',
                            status: 'CAPTURED'
                        }]
                    }
                }]
            };

            expect(getTransactionStatus(transactionResponse_)).equal('CAPTURED');
        });
    });

    describe('isExpiredTransaction', () => {
        const isExpiredTransaction = paypalHelper.__get__('isExpiredTransaction');

        let creationDate;

        const dateNow = Date.parse(new Date());

        let getTime = 1584088139000;

        before(() => {
            stub(Date, 'now');
            stub(Date, 'parse');
            stub(Date.prototype, 'getTime');
        });

        beforeEach(() => {
            Date.now.returns(dateNow);
            Date.parse.returns(creationDate);
            Date.prototype.getTime.returns(getTime);
        });

        after(() => {
            Date.now.restore();
            Date.parse.restore();
            Date.prototype.getTime.restore();
        });

        describe('Transaction Expired', () => {
            before(() => {
                creationDate = 1584087421000;
            });

            it('returns true', () => {
                expect(isExpiredTransaction(creationDate)).to.be.equals(true);
            });
        });

        describe('Transaction Valid', () => {
            before(() => {
                creationDate = dateNow;
                getTime = dateNow + 1584347339000;
            });

            it('returns false', () => {
                expect(isExpiredTransaction(creationDate)).to.be.equals(false);
            });
        });

        it('If payment instrument was not provided', () => {
            expect(isExpiredTransaction()).to.be.false;
        });
    });

    describe('isPurchaseUnitChanged', () => {
        const isPurchaseUnitChanged = paypalHelper.__get__('isPurchaseUnitChanged');
        const paymentInstrument = {};

        let purchaseUnit;

        beforeEach(() => {
            purchaseUnit = {
                amount: {
                    currecy_code: 'USD',
                    value: '244.23'
                },
                address: {}
            };
        });

        describe('if Credit Card is used', () => {
            paymentInstrument.paymentMethod = mockPaypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;

            it('should return false', () => {
                expect(isPurchaseUnitChanged(purchaseUnit, paymentInstrument)).to.be.false;

                paymentInstrument.paymentMethod = mockPaypalConstants.PAYMENT_METHOD_ID_PAYPAL;
            });
        });

        describe('if orderDataHash is undefined', () => {
            before(() => {
                encodeString.withArgs(purchaseUnit).returns('123');
            });

            after(() => {
                encodeString.reset();
            });

            it('should return true', () => {
                expect(isPurchaseUnitChanged(purchaseUnit, paymentInstrument)).to.be.equals(true);
            });
        });

        describe('if encoded purchaseUnit equals to orderDataHash', () => {
            before(() => {
                encodeString.withArgs(purchaseUnit).returns('123');
            });

            after(() => {
                encodeString.reset();
            });

            it('should return false', () => {
                expect(isPurchaseUnitChanged(purchaseUnit, paymentInstrument, '123')).to.be.equals(false);
            });
        });

        describe('if encoded purchaseUnit is not equal to orderDataHash', () => {
            before(() => {
                encodeString.withArgs(purchaseUnit).returns('123');
            });

            after(() => {
                encodeString.reset();
            });

            it('should return true', () => {
                expect(isPurchaseUnitChanged(purchaseUnit, paymentInstrument, '321')).to.be.equals(true);
            });
        });

        it('should return true when purchase_units is missing', () => {
            const result = isPurchaseUnitChanged(purchaseUnit, {});

            expect(result).to.be.true;
        });

        it('should return true when purchase_units amount is not equal to orderDetail value', () => {
            purchaseUnit.amount.value = 100.00;

            const result = isPurchaseUnitChanged(purchaseUnit, {});

            expect(result).to.be.true;
        });
    });

    describe('updatePayPalEmail', () => {
        const updatePayPalEmail = paypalHelper.__get__('updatePayPalEmail');

        describe('if paypalPayerEmail exists in session and is equal to currentPaypalEmail', () => {
            before(() => {
                session.privacy.paypalPayerEmail = 'test@salesforce.com';
            });

            after(() => {
                session.privacy.paypalPayerEmail = null;
            });

            it('should be written to basketModel from session', () => {
                const params = {
                    paypalPI: {
                        custom: {
                            currentPaypalEmail: 'test@salesforce.com'
                        }
                    },
                    basketModel: {}
                };

                updatePayPalEmail(params);
                expect(params.basketModel.paypalPayerEmail).to.equals('test@salesforce.com');
            });
        });

        describe('if paypalPayerEmail exists in session and is not equal to currentPaypalEmail', () => {
            before(() => {
                session.privacy.paypalPayerEmail = 'test@salesforce.com';
            });

            after(() => {
                session.privacy.paypalPayerEmail = null;
            });

            it('should be written to basketModel and paypal email should be changed in payment instrument', () => {
                const params = {
                    paypalPI: {
                        custom: {
                            currentPaypalEmail: 'test@test.com'
                        }
                    },
                    basketModel: {}
                };

                updatePayPalEmail(params);
                expect(params.paypalPI.custom.currentPaypalEmail).to.equals('test@salesforce.com');
            });
        });

        describe('if paypalPayerEmail does not exist in session', () => {
            it('should be written to basketModel from params', () => {
                const params = {
                    paypalPI: {
                        custom: {
                            currentPaypalEmail: 'test@test.com'
                        }
                    },
                    basketModel: {}
                };

                updatePayPalEmail(params);
                expect(params.basketModel.paypalPayerEmail).to.equals('test@test.com');
            });
        });
        describe('if paypalPayerEmail does not exist in session and in params', () => {
            it('should be written to basketModel as empty string', () => {
                const params = {
                    paypalPI: {
                        custom: {}
                    },
                    basketModel: {}
                };

                updatePayPalEmail(params);
                expect(params.basketModel.paypalPayerEmail).to.equals('');
            });
        });
    });

    describe('getItemsDescription', () => {
        const getItemsDescription = paypalHelper.__get__('getItemsDescription');
        const nameLength = 127;

        let productLineItems = [];

        describe('if was provided empty array', () => {
            it('should return empty string', () => {
                expect(getItemsDescription(productLineItems)).to.equals('');
            });
        });

        describe('if provided array with products', () => {
            before(() => {
                Array.map = function(a, b) {
                    return Array.prototype.map.call(a, b);
                };

                productLineItems = [
                    {
                        productName: 'name'
                    },
                    {
                        productName: 'longName'.repeat(nameLength)
                    }
                ];
            });

            it(`should return string of length not more than ${nameLength}`, () => {
                expect(getItemsDescription(productLineItems).length <= nameLength).to.be.true;
            });
        });
    });

    describe('hasGiftCertificates', () => {
        BasketMgr.currentBasket.giftCertificateLineItems = [
            {
                giftCertificateID: 'id'
            }
        ];

        it('should return true if basket includes one or more certificate', () => {
            expect(paypalHelper.hasGiftCertificates(BasketMgr.currentBasket)).to.be.true;
        });

        describe('if gift certificate was not found in basket', () => {
            before(() => {
                BasketMgr.currentBasket.giftCertificateLineItems.length = 0;
            });

            it('should return false', () => {
                expect(paypalHelper.hasGiftCertificates(BasketMgr.currentBasket)).to.be.false;
            });
        });
    });

    describe('getPreparedBillingFormFields', () => {
        const paypalPaymentInstrument = {
            custom: { currentPaypalEmail: 'paypal@email.com' }
        };

        it('should return prepared billing form fields', () => {
            const result = paypalHelper.getPreparedBillingFormFields(paypalPaymentInstrument);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                paymentMethod: {
                    name: 'PayPal',
                    value: 'PayPal'
                },
                usedPaymentMethod: {
                    name: 'PayPal',
                    value: ''
                }
            });
        });
    });

    describe('getGiftCertificateDescription', () => {
        const getGiftCertificateDescription = paypalHelper.__get__('getGiftCertificateDescription');
        const giftCertificateLineItems = [
            {
                lineItemText: 'text',
                recipientEmail: 'customer@mail.com'
            },
            {
                lineItemText: 'text'.repeat(200),
                recipientEmail: 'customer@mail.com'
            }
        ];

        const descriptionLength = 127;

        it('should return string', () => {
            expect(getGiftCertificateDescription(giftCertificateLineItems)).to.be.a('string');
        });

        it(`should return description string not longer than ${descriptionLength}`, () => {
            expect(getGiftCertificateDescription(giftCertificateLineItems).length <= descriptionLength).to.be.true;
        });

        describe('if provided empty certificate description', () => {
            it('should return empty string', () => {
                giftCertificateLineItems.length = 0;
                expect(getGiftCertificateDescription(giftCertificateLineItems)).to.deep.equal('');
            });
        });
    });

    describe('getAppliedGiftCertificateTotal', () => {
        const getAppliedGiftCertificateTotal = paypalHelper.__get__('getAppliedGiftCertificateTotal');

        const acc = {
            arr: [],
            add: (el) => acc.arr.push(el)
        };

        const giftCertificate = {
            paymentTransaction: { amount: 100 }
        };

        it('should add amount to acc', () => {
            const result = getAppliedGiftCertificateTotal(acc, giftCertificate);

            expect(result).to.be.an('number');
            expect(result).to.equal(1);

            expect(acc.arr[0]).to.equal(100);
        });
    });

    describe('getItemsForPurchaseUnit', () => {
        const getItemsForPurchaseUnit = paypalHelper.__get__('getItemsForPurchaseUnit');

        const allProductLineItems = {
            toArray: () => ([
                {
                    quantityValue: '1',
                    productName: 'Name1',
                    productID: '1',
                    basePrice: {
                        value: '100'
                    },
                    adjustedNetPrice: {
                        value: '100'
                    },
                    adjustedTax: {
                        value: '10'
                    },
                    product: {
                        ID: '1',
                        UPC: '123',
                        name: 'Name1',
                        pageURL: 'Url1',
                        priceModel: {
                            price: {
                                value: '100'
                            }
                        }
                    },
                    price: {
                        subtract: () => ({
                            decimalValue: 0
                        }),
                        value: '100'
                    },
                    proratedPrice: 0
                },
                {
                    quantityValue: '1',
                    productName: 'Option1',
                    productID: '01',
                    basePrice: {
                        value: '10'
                    },
                    adjustedNetPrice: {
                        value: '10'
                    },
                    adjustedTax: {
                        value: '1'
                    },
                    parent: {
                        ID: '1',
                        productName: 'Name1'
                    },
                    price: {
                        subtract: () => ({
                            decimalValue: 0
                        }),
                        value: '10'
                    },
                    proratedPrice: 0
                },
                {
                    quantityValue: '1',
                    productName: 'Name2',
                    productID: '2',
                    basePrice: {
                        value: '200'
                    },
                    adjustedNetPrice: {
                        value: '200'
                    },
                    adjustedTax: {
                        value: '20'
                    },
                    product: {
                        ID: '2',
                        UPC: '',
                        name: 'Name2',
                        pageURL: 'Url2',
                        priceModel: {
                            price: {
                                value: '200'
                            }
                        }
                    },
                    price: {
                        subtract: () => ({
                            decimalValue: 0
                        }),
                        value: '200'
                    },
                    proratedPrice: 0
                }
            ])
        };

        it('should create items value for purchase unit ', () => {
            const expectedItems = [
                {
                    name: 'Name1',
                    quantity: '1',
                    sku: '1',
                    unit_amount: {
                        currency_code: 'USD',
                        value: '100'
                    },
                    upc: {
                        code: '123',
                        type: 'UPC-A'
                    },
                    url: 'Url1'
                },
                {
                    name: 'Option1',
                    quantity: '1',
                    sku: '01',
                    description: 'Option for Name1',
                    unit_amount: {
                        currency_code: 'USD',
                        value: '10'
                    },
                    url: null
                },
                {
                    name: 'Name2',
                    quantity: '1',
                    sku: '2',
                    unit_amount: {
                        currency_code: 'USD',
                        value: '200'
                    },
                    url: 'Url2'
                }

            ];

            const result = getItemsForPurchaseUnit(allProductLineItems, 'USD');

            expect(result).to.be.deep.equal(expectedItems);
        });

        it('should create lineItems with additional fields if L2 L3 is enabled', () => {
            const expectedItems = [
                {
                    name: 'Name1',
                    quantity: '1',
                    sku: '1',
                    unit_amount: {
                        currency_code: 'USD',
                        value: '100'
                    },
                    upc: {
                        code: '123',
                        type: 'UPC-A'
                    },
                    url: 'Url1',
                    total_amount: {
                        currency_code: 'USD',
                        value: '100'
                    },
                    tax: {
                        currency_code: 'USD',
                        value: '10'
                    },
                    discount_amount: {
                        currency_code: 'USD',
                        value: '0'
                    }
                },
                {
                    name: 'Option1',
                    quantity: '1',
                    sku: '01',
                    description: 'Option for Name1',
                    unit_amount: {
                        currency_code: 'USD',
                        value: '10'
                    },
                    url: null,
                    total_amount: {
                        currency_code: 'USD',
                        value: '10'
                    },
                    tax: {
                        currency_code: 'USD',
                        value: '1'
                    },
                    discount_amount: {
                        currency_code: 'USD',
                        value: '0'
                    }
                },
                {
                    name: 'Name2',
                    quantity: '1',
                    sku: '2',
                    unit_amount: {
                        currency_code: 'USD',
                        value: '200'
                    },
                    url: 'Url2',
                    total_amount: {
                        currency_code: 'USD',
                        value: '200'
                    },
                    tax: {
                        currency_code: 'USD',
                        value: '20'
                    },
                    discount_amount: {
                        currency_code: 'USD',
                        value: '0'
                    }
                }
            ];

            const result = getItemsForPurchaseUnit(allProductLineItems, 'USD', true);

            expect(result).to.be.deep.equal(expectedItems);
        });
    });

    describe('getPurchaseUnit', () => {
        const preferredAddress = { address: 'Preferred Address' };

        const basket = {
            currencyCode: 'USD',
            defaultShipment: {
                getShippingAddress: stub()
            },
            customer: {
                addressBook: {
                    preferredAddress: preferredAddress
                }
            },
            shipments: stub(),
            productLineItems: {
                empty: false,
                toArray: () => []
            },
            allProductLineItems: {
                empty: false,
                toArray: () => []
            },
            shippingTotalPrice: {
                subtract: () => ({
                    value: { toString: () => 40 }
                }),
                value: { toString: () => 45 }
            },
            adjustedShippingTotalPrice: 100,
            merchandizeTotalPrice: {
                subtract: () => ({
                    value: { toString: () => 100 }
                }),
                add: () => ({
                    value: { toString: () => 123 }
                })
            },
            adjustedMerchandizeTotalPrice: 100,
            giftCertificateLineItems: {
                empty: true,
                toArray: () => []
            },
            giftCertificateTotalPrice: 100,
            totalTax: {
                value: { toString: () => 0 }
            },
            giftCertificatePaymentInstruments: [{ value: 0 }]
        };

        const purchaseUnitProps = ['description', 'amount', 'invoice_id', 'soft_descriptor', 'items'];

        beforeEach(() => {
            Object.assign(global.customer, {
                authenticated: true,
                profile: {
                    wallet: {
                        getPaymentInstruments: () => ({
                            toArray: () => creditCardPaymentInstruments
                        })
                    }
                },
                addressBook: {
                    preferredAddress: 'Preffered Address'
                }
            });
        });

        before(() => {
            Array.reduce = (a, b) => Array.prototype.reduce.call(a, b);
            Object.assign(dw.order.TaxMgr,
                { TAX_POLICY_GROSS: 5 });

            stub(dw.order.TaxMgr, 'getTaxationPolicy');

            createShippingAddress.returns('shipping address');
            dw.order.TaxMgr.getTaxationPolicy.returns(5);
        });

        after(() => {
            Array.reduce = () => ({});
            dw.order.TaxMgr.getTaxationPolicy.restore();

            delete dw.order.TaxMgr.TAX_POLICY_GROSS;
        });

        afterEach(() => {
            createShippingAddress.reset();
            basket.productLineItems = {
                empty: false,
                toArray: () => []
            };
            global.customer = new dw.customer.Customer();
        });

        it('If shipping address created and purchase unit returned', () => {
            basket.defaultShipment.getShippingAddress.returns('defaultShipment');
            getCustomerPaymentInstruments.returns([{ custom: { currentPaypalEmail: 'jdoe@gmail.com' } }]);

            const result = paypalHelper.getPurchaseUnit(basket);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('supplementary_data', 'shipping', ...purchaseUnitProps);

            expect(createShippingAddress.calledOnce).to.be.true;
        });

        it('If L2 and L3 disabled', () => {
            paypalPreferences.l2l3DataEnabled = false;
            getCustomerPaymentInstruments.returns([{ custom: { currentPaypalEmail: 'jdoe@gmail.com' } }]);

            const result = paypalHelper.getPurchaseUnit(basket);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('shipping', ...purchaseUnitProps);
        });

        it('should add contact information if payment source is paypal', () => {
            const isExpressCheckout = false;
            const paymentSource = {
                paypal: {}
            };

            const result = paypalHelper.getPurchaseUnit(basket, isExpressCheckout, paymentSource);

            expect(result.shipping.email_address).to.equal('test@g.com');
            expect(result.shipping.phone_number).to.deep.equals({
                country_code: '1',
                national_number: '55555555'
            });
        });

        it('should add contact information if payment source is venmo', () => {
            const isExpressCheckout = false;
            const paymentSource = {
                venmo: {}
            };

            const result = paypalHelper.getPurchaseUnit(basket, isExpressCheckout, paymentSource);

            expect(result.shipping.email_address).to.equal('test@g.com');
            expect(result.shipping.phone_number).to.deep.equals({
                country_code: '1',
                national_number: '55555555'
            });
        });
    });

    describe('basketModelHack', () => {
        let selectedPaymentInstruments = [
            {
                paymentMethod: 'PayPal'
            },
            {
                paymentMethod: 'Venmo'
            }
        ];

        const basketModel = {
            resources: {},
            billing: {
                payment: {
                    selectedPaymentInstruments
                }
            }
        };

        const currencyCode = 'USD';
        const ppPaymentInstrumentCustomProps = { paymentId: 'PayPal' };

        afterEach(() => {
            selectedPaymentInstruments = [
                {
                    paymentMethod: 'PayPal'
                },
                {
                    paymentMethod: 'Venmo'
                }
            ];
        });

        it('If ppPaymentInstrumentCustomProps.paymentId === \'PayPal\'', () => {
            paypalHelper.basketModelHack(basketModel, currencyCode, ppPaymentInstrumentCustomProps);

            expect(basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth).to.equal('PayPal ');
        });

        it('If ppPaymentInstrumentCustomProps.paymentId === \'Venmo\'', () => {
            ppPaymentInstrumentCustomProps.paymentId = 'Venmo';

            paypalHelper.basketModelHack(basketModel, currencyCode, ppPaymentInstrumentCustomProps);
            expect(basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth).to.equal('Venmo ');
        });
    });

    describe('getUrlPath', () => {
        const credential = {
            URL: 'url/'
        };

        const path = 'path';

        it('should not add / to url', () => {
            expect(paypalHelper.getUrlPath(credential, path)).to.equal('url/path');
        });

        it('should add / to url', () => {
            credential.URL = 'url';
            expect(paypalHelper.getUrlPath(credential, path)).to.equal('url/path');
        });
    });

    describe('getAccessToken', () => {
        const credentials = {
            user: 'user',
            password: 'password'
        };

        it('should call toBase64 and Bytes', () => {
            paypalHelper.getAccessToken(credentials);

            assert.calledOnce(toBase64);
            assert.calledWith(Bytes, 'user:password');
        });
    });

    describe('getOrderByOrderNo', () => {
        const orderNo = 1;

        after(() => {
            searchOrder.reset();
        });

        it('should return system object', () => {
            searchOrder.returns({});

            expect(paypalHelper.getOrderByOrderNo(orderNo)).to.deep.equal({});
        });
    });

    describe('updatePaymentId', () => {
        let paypalPaymentInstrument;
        let billingForm;

        beforeEach(() => {
            paypalPaymentInstrument = {
                custom: {
                    paymentId: 'Venmo'
                }
            };

            billingForm = {
                paypal: {
                    usedPaymentMethod: {
                        htmlValue: 'PayPal'
                    }
                }
            };
        });

        it('If paymentId is Venmo, but used payment method is not', () => {
            paypalHelper.updatePaymentId(paypalPaymentInstrument, billingForm);

            expect(paypalPaymentInstrument.custom.paymentId).to.equal(null);
        });

        it('If paymentId is not Venmo, but used payment method is Venmo', () => {
            billingForm.paypal.usedPaymentMethod.htmlValue = 'Venmo';
            paypalPaymentInstrument.custom.paymentId = 'PayPal';

            paypalHelper.updatePaymentId(paypalPaymentInstrument, billingForm);

            expect(paypalPaymentInstrument.custom.paymentId).to.equal('Venmo');
        });

        it('If paymentInstrument was not updated', () => {
            paypalPaymentInstrument.custom.paymentId = 'PayPal';

            paypalHelper.updatePaymentId(paypalPaymentInstrument, billingForm);

            expect(paypalPaymentInstrument.custom.paymentId).to.equal('PayPal');
        });
    });

    describe('getTransactionHistory', () => {
        const dateTime = '2023-02-28T12:00:00.000Z';

        before(() => {
            stub(Date.prototype, 'toISOString').returns(dateTime);
        });

        after(() => {
            Date.prototype.toISOString.restore();
        });

        const getTransactionHistory = paypalHelper.__get__('getTransactionHistory');

        const transactionResponse = {
            status: 'REFUND',
            create_time: dateTime,
            amount: { value: '50.00' },
            purchase_units: [{
                payments: {
                    captures: [{ create_time: dateTime, amount: { value: '50.00' }, status: 'CAPTURE' }],
                    authorizations: [{ create_time: dateTime, amount: { value: '50.00' }, status: 'CREATED' }]
                }
            }],
            paymentStatus: 'REFUND'
        };

        it('should returns an object (purchase_units captures)', () => {
            const val = getTransactionHistory(transactionResponse);

            expect(val).to.be.an('object').that.has.all.keys([
                'amount', 'timestamp', 'status'
            ]);

            expect(val).to.include({
                amount: '50.00',
                status: 'CAPTURE',
                timestamp: dateTime
            });
        });

        it('should returns an object (purchase_units authorizations)', () => {
            delete transactionResponse.purchase_units[0].payments.captures;

            const val = getTransactionHistory(transactionResponse);

            expect(val).to.be.an('object').that.has.all.keys([
                'amount', 'timestamp', 'status'
            ]);

            expect(val).to.include({
                amount: '50.00',
                status: 'CREATED',
                timestamp: dateTime
            });
        });

        it('should returns an object (resource for WebHook) paymentStatus', () => {
            delete transactionResponse.purchase_units;

            const val = getTransactionHistory(transactionResponse);

            expect(val).to.be.an('object').that.has.all.keys([
                'amount', 'timestamp', 'status'
            ]);

            expect(val).to.include({
                amount: '50.00',
                status: 'REFUND',
                timestamp: dateTime
            });
        });

        it('should returns an object (resource for WebHook) resourse status', () => {
            delete transactionResponse.paymentStatus;

            const val = getTransactionHistory(transactionResponse);

            expect(val).to.be.an('object').that.has.all.keys([
                'amount', 'timestamp', 'status'
            ]);

            expect(val).to.include({
                amount: '50.00',
                status: 'REFUND',
                timestamp: dateTime
            });
        });
    });

    describe('prepareTransactionHistory', () => {
        const responseData = {};
        const objectType = { custom: { paypalTransactionHistory: null } };

        before(() => {
            isJson.returns(false);

            paypalHelper.__set__('getTransactionHistory', () => ({
                amount: '40.00',
                status: 'Capture',
                timestamp: '2023-02-28T12:00:00.000Z'
            }));
        });

        after(() => {
            isJson.reset();
            paypalHelper.__ResetDependency__('getTransactionHistory');
        });

        it('should returns one item of transaction history in json format', () => {
            const val = paypalHelper.prepareTransactionHistory(objectType, responseData);

            expect(val).to.be.a('string').that.is.not.empty;
            expect(JSON.parse(val)).to.have.lengthOf(1);
        });

        it('should returns a list of transaction history in json format', () => {
            isJson.returns(true);

            objectType.custom.paypalTransactionHistory = JSON.stringify([{
                amount: '40.00',
                status: 'Created',
                timestamp: '2023-02-28T10:00:00.000Z'
            }]);

            const val = paypalHelper.prepareTransactionHistory(objectType, responseData);

            expect(val).to.be.a('string').that.is.not.empty;
            expect(JSON.parse(val)).to.have.lengthOf(2);
        });
    });

    describe('updateViewDataForFraudNet', () => {
        const expectedUID = '7Df6GhUjK8l9M5nB4vC3xZ2cV1bNmQa';

        let response;

        beforeEach(() => {
            response = {
                viewData: {
                    paypal: {
                        fraudNet: {}
                    }
                }
            };
        });

        it('should update viewData for FraudNet integration', () => {
            paypalPreferences.isFraudNetEnabled = true;

            paypalHelper.updateViewDataForFraudNet(response);

            expect(response.viewData.paypal.fraudNet.fraudNetUID).to.equal(expectedUID);
            expect(response.viewData.paypal.fraudNet.paypalFraudNetScriptLink).to.equal('https://c.paypal.com/da/r/fb.js');
            expect(response.viewData.paypal.fraudNet.fraudNetNoScriptURL).to.equal('https://c.paypal.com/v1/r/d/b/ns?f=' + expectedUID + '&js=0&r=1');
        });

        it('should not update viewData for FraudNet integration if isFraudNetEnabled is set to false', () => {
            paypalPreferences.isFraudNetEnabled = false;

            paypalHelper.updateViewDataForFraudNet(response);

            expect(response.viewData.paypal.fraudNet).to.deep.equal({});
        });
    });

    describe('stringifyBillingAddress', () => {
        it('billing address string representation should be returned', () => {
            const billingAddress = {
                firstName: 'firstName',
                lastName: 'lastName',
                address1: 'address1',
                city: 'city',
                stateCode: 'TXS',
                postalCode: '82100',
                countryCode: { value: 'US' },
                phone: '00000000000'
            };

            const expectedResult = '{"firstName":"firstName","lastName":"lastName","address1":"address1","address2":"","city":"city","stateCode":"TXS","postalCode":"82100","countryCode":{"value":"US"},"phone":"00000000000"}';

            const result = paypalHelper.stringifyBillingAddress(billingAddress);

            expect(result).to.be.an('string');
            expect(result).to.equal(expectedResult);
        });
    });

    describe('getApplePayFormFields', () => {
        it('should be an object', () => {
            expect(paypalHelper.getApplePayFormFields()).to.be.an('object');
        });

        it('should contains the applePayEmailAddress field', () => {
            expect(paypalHelper.getApplePayFormFields()).has.property('applePayEmailAddress');
        });

        it('should contains the applePayPaymentSource field', () => {
            expect(paypalHelper.getApplePayFormFields()).has.property('applePayPaymentSource');
        });

        it('should contains the applePayPhoneNumber field', () => {
            expect(paypalHelper.getApplePayFormFields()).has.property('applePayPhoneNumber');
        });

        it('should contains the applePayShippingAddressAsString field', () => {
            expect(paypalHelper.getApplePayFormFields()).has.property('applePayShippingAddressAsString');
        });
    });

    describe('splitFullName', () => {
        it('should return a splitted full name object', () => {
            expect(paypalHelper.splitFullName('Joy Gray')).to.deep.equal({
                firstName: 'Joy',
                lastName: 'Gray'
            });
        });
    });

    describe('createCreditMessageSdkUrl', () => {
        before(() => {
            getClientId.returns(clientId);
        });

        it('should be a function', () => {
            expect(paypalHelper.createCreditMessageSdkUrl).to.be.a('function');
        });

        it('should return valid credit message SDK url', () => {
            expect(paypalHelper.createCreditMessageSdkUrl()).to.deep.equal(sdkUrlResult);
        });
    });

    describe('updateViewDataForPayLaterCrossBorderMessaging', () => {
        const countryUS = 'US';
        const locale = {
            country: countryUS
        };

        before(() => {
            getLocale.withArgs(req.locale.id).returns(locale);
        });

        it('should be a function', () => {
            expect(paypalHelper.updateViewDataForPayLaterCrossBorderMessaging).to.be.a('function');
        });

        it('should skip updating view data', () => {
            paypalPreferences.ppPayLaterCrossBorderMessagingEnabled = false;
            paypalHelper.updateViewDataForPayLaterCrossBorderMessaging(res, req);
            expect(res.viewData.paylaterMessaging.locale).to.be.empty;
            expect(res.viewData.paylaterMessaging.currencyCode).to.be.empty;
        });

        it('should update view data', () => {
            paypalPreferences.ppPayLaterCrossBorderMessagingEnabled = true;
            paypalHelper.updateViewDataForPayLaterCrossBorderMessaging(res, req);
            expect(res.viewData.paylaterMessaging.locale).to.deep.equals(countryUS);
            expect(res.viewData.paylaterMessaging.currencyCode).to.deep.equals(req.session.currency.currencyCode);
        });
    });

    describe('updateViewDataForPayLaterMessaging', () => {
        const cartBannerStyles = { layout: 'text', 'text-color': 'gray', placement: 'cart', amount: 100.00, status: 'enabled' };

        before(() => {
            getClientId.returns(clientId);
            BasketMgr.currentOrNewBasket.totalGrossPrice.value = 100.00;
        });

        beforeEach(() => {
            res = getEmptyResponse();
        });

        after(() => {
            paypalPreferences.paypalButtonLocation = 'MiniCart,Cart';
        });

        it('should be a function', () => {
            expect(paypalHelper.updateViewDataForPayLaterMessaging).to.be.a('function');
        });

        it('should update view data without bannerSdkUrl', () => {
            isElementEnabled.returns(true);
            paypalPreferences.paypalButtonLocation = 'MiniCart,Cart';
            paypalHelper.updateViewDataForPayLaterMessaging(res, 'cart');

            expect(res.viewData.paylaterMessagingAvailable).to.be.true;
            expect(res.viewData.paylaterMessaging.config).to.deep.equal(cartBannerStyles);
            expect(res.viewData.bannerSdkUrl).to.be.empty;
        });

        it('should update view data with bannerSdkUrl', () => {
            isElementEnabled.returns(false);
            paypalPreferences.paypalButtonLocation = 'billing';
            paypalHelper.updateViewDataForPayLaterMessaging(res, 'cart');

            expect(res.viewData.paylaterMessagingAvailable).to.be.true;
            expect(res.viewData.paylaterMessaging.config).to.deep.equal(cartBannerStyles);
            expect(res.viewData.bannerSdkUrl).to.deep.equal(sdkUrlResult);
        });
    });

    describe('updateProductViewDataForPayLaterMessaging', () => {
        const sdkUrl = 'https://www.paypal.com/sdk/js?client-id=12345abc&components=messages';
        const productBannerStyles = { layout: 'text', ['text-color']: 'gray', placement: 'product', amount: '0.00', status: 'enabled' };

        before(() => {
            getClientId.returns(clientId);
        });

        beforeEach(() => {
            res = getEmptyResponse();
        });

        after(() => {
            paypalPreferences.paypalButtonLocation = 'MiniCart,Cart';
        });

        it('should be a function', () => {
            expect(paypalHelper.updateProductViewDataForPayLaterMessaging).to.be.a('function');
        });

        it('should update view data without bannerSdkUrl', () => {
            paypalPreferences.paypalButtonLocation = 'pdp';
            isElementEnabled.returns(true);
            paypalHelper.updateProductViewDataForPayLaterMessaging(res, 'product');

            expect(res.viewData.paylaterMessagingAvailable).to.be.true;
            expect(res.viewData.paylaterMessaging.config.product).to.deep.equal(productBannerStyles);
            expect(res.viewData.bannerSdkUrl).to.be.empty;
        });

        it('should update view data using paypalSDK', () => {
            paypalPreferences.paypalButtonLocation = 'MiniCart,Cart';
            isElementEnabled.withArgs(mockPaypalConstants.PAGE_FLOW_PDP, mockPaypalConstants.PAYPAL_BUTTON_LOCATION).returns(false);
            isElementEnabled.withArgs(mockPaypalConstants.PAGE_FLOW_PDP, mockPaypalConstants.VENMO_BUTTON_LOCATION).returns(false);
            paypalHelper.updateProductViewDataForPayLaterMessaging(res, 'product');

            expect(res.viewData.paylaterMessagingAvailable).to.be.true;
            expect(res.viewData.paylaterMessaging.config.product).to.deep.equal(productBannerStyles);
            expect(res.viewData.bannerSdkUrl).to.deep.equal(sdkUrl);
        });

        it('should update view data using created sdkUrl', () => {
            isElementEnabled.withArgs(mockPaypalConstants.PAGE_FLOW_PDP, mockPaypalConstants.PAYPAL_BUTTON_LOCATION).returns(false);
            paypalPreferences.paypalButtonLocation = 'Cart';
            paypalHelper.updateProductViewDataForPayLaterMessaging(res, 'product');

            expect(res.viewData.paylaterMessagingAvailable).to.be.true;
            expect(res.viewData.paylaterMessaging.config.product).to.deep.equal(productBannerStyles);
            expect(res.viewData.bannerSdkUrl).to.deep.equal(sdkUrlResult);
        });
    });

    describe('savePaypalToCustomerWallet', () => {
        let isDuplicate = false;

        before(() => {
            getCustomerPaymentInstruments.returns(customerPaymentInstruments);

            paypalHelper.__set__('isDuplicatedPpAccount', () => (isDuplicate));
        });

        after(() => {
            getCustomerPaymentInstruments.reset();

            paypalHelper.__ResetDependency__('isDuplicatedPpAccount');
        });

        const responseDataMyAccount = {
            id: '12345',
            customer: { id: '54321' },
            payment_source: {
                paypal: {
                    email_address: 'user@domain.com',
                    address: {},
                    name: {},
                    phone: { phone_number: '123-456-7890' }
                }
            }
        };

        const responseDataCheckout = {
            payment_source: {
                paypal: {
                    attributes: {
                        vault: {
                            id: '12345',
                            customer: {
                                id: '54321'
                            }
                        }
                    },
                    email_address: 'user@domain.com',
                    address: {},
                    name: {},
                    phone: { phone_number: '123-456-7890' }
                }
            }
        };

        it('should save paypal on my account', () => {
            customer = {
                profile: {
                    custom: {
                        payPalCustomerId: '00110011'
                    },
                    wallet: {
                        createPaymentInstrument: () => ({
                            setCreditCardType: stub(),
                            custom: {},
                            creditCardToken: null
                        })
                    }
                }
            };

            const result = paypalHelper.savePaypalToCustomerWallet(responseDataMyAccount);

            expect(result.error).to.be.false;
        });

        it('should save paypal account on Checkout', () => {
            customer = {
                profile: {
                    custom: {
                        payPalCustomerId: '00110011'
                    },
                    wallet: {
                        createPaymentInstrument: () => ({
                            setCreditCardType: stub(),
                            custom: {},
                            creditCardToken: null
                        })
                    }
                }
            };

            const result = paypalHelper.savePaypalToCustomerWallet(responseDataCheckout);

            expect(result.error).to.be.false;
        });

        it('should return an error if PayPal account is duplicated', () => {
            isDuplicate = true;

            const result = paypalHelper.savePaypalToCustomerWallet(responseDataMyAccount);

            expect(result).that.deep.equal({
                error: true,
                msg: 'This PayPal account is already saved'
            });
            expect(deletePaymentToken.calledOnce).to.be.true;
        });

        it('should set payPalCustomerId if it is empty', () => {
            customer.profile.custom.payPalCustomerId = undefined;

            paypalHelper.savePaypalToCustomerWallet(responseDataCheckout);

            expect(customer.profile.custom.payPalCustomerId).to.deep.equal('54321');
        });

        it('should return null if profile is null', () => {
            customer.profile = null;

            const result = paypalHelper.savePaypalToCustomerWallet(responseDataMyAccount);

            expect(result).to.be.null;
        });
    });

    describe('setBillingAddressFromPaypal', () => {
        const paypalBillingAddress = {
            address_line_1: '123 Main St',
            admin_area_2: 'CityName',
            country_code: 'US',
            given_name: 'John',
            surname: 'Doe',
            postal_code: '12345',
            admin_area_1: 'CA',
            national_number: '18001234567'
        };

        let basket = {
            billingAddress: null,
            createBillingAddress: function() {
                basket.billingAddress = {
                    address1: '',
                    city: '',
                    countryCode: '',
                    firstName: '',
                    lastName: '',
                    postalCode: '',
                    stateCode: '',
                    phone: ''
                };
            }
        };

        it('should create billing address if one does not exist', () => {
            paypalHelper.setBillingAddressFromPaypal(basket, paypalBillingAddress);
            expect(basket.billingAddress).to.exist;
        });

        it('should correctly set billing address from PayPal data', () => {
            basket = {
                createBillingAddress: () => ({
                    address1: '',
                    city: '',
                    countryCode: '',
                    firstName: '',
                    lastName: '',
                    postalCode: '',
                    stateCode: '',
                    phone: ''
                }),
                billingAddress: {
                    address1: '',
                    city: '',
                    countryCode: '',
                    firstName: '',
                    lastName: '',
                    postalCode: '',
                    stateCode: '',
                    phone: ''
                }
            };

            paypalHelper.setBillingAddressFromPaypal(basket, paypalBillingAddress);

            const { billingAddress } = basket;

            expect(billingAddress.address1).to.equal(paypalBillingAddress.address_line_1);
            expect(billingAddress.city).to.equal(paypalBillingAddress.admin_area_2);
            expect(billingAddress.countryCode).to.equal(paypalBillingAddress.country_code);
            expect(billingAddress.firstName).to.equal(paypalBillingAddress.given_name);
            expect(billingAddress.lastName).to.equal(paypalBillingAddress.surname);
            expect(billingAddress.postalCode).to.equal(paypalBillingAddress.postal_code);
            expect(billingAddress.stateCode).to.equal(paypalBillingAddress.admin_area_1);
            expect(billingAddress.phone).to.equal(paypalBillingAddress.national_number);
        });
    });

    describe('completeSavedPaypalOrder', () => {
        const purchaseUnit = {};
        const order = {
            custom: {}
        };

        const billingAddress = {
            givenName: 'John',
            surname: 'Doe',
            addressLine1: '1234 Main St',
            adminArea2: 'Anytown',
            adminArea1: 'CA',
            postalCode: '12345',
            countryCode: 'US',
            nationalNumber: '5551234567'
        };

        const paymentInstrument = {
            creditCardToken: '',
            custom: {
                paypalBillingAddress: JSON.stringify(billingAddress)
            },
            paymentTransaction: {
                transactionID: ''
            }
        };

        paypalHelper.__set__('setBillingAddressFromPaypal', () => ({}));

        it('should handle successful order creation', () => {
            createOrderStub.returns({ err: null, resp: { id: '1234' } });

            const result = paypalHelper.completeSavedPaypalOrder(purchaseUnit, order, paymentInstrument);

            expect(result.authorized).to.be.true;
        });

        it('should handle failed order creation', () => {
            createOrderStub.returns({ err: 'Order not created', resp: {} });

            const result = paypalHelper.completeSavedPaypalOrder(purchaseUnit, order, paymentInstrument);

            expect(result.authorized).to.be.false;
        });
    });

    describe('getCustomAttributePaypalEmail', () => {
        const email = 'user@paypal.email';

        let paymentInstrument = {
            custom: { paypalVaultEmail: email }
        };

        it('should return PayPal email value from paypalVaultEmail field', () => {
            expect(paypalHelper.getCustomAttributePaypalEmail(paymentInstrument)).to.be.equal(email);
        });

        it('should return PayPal email value from currentPaypalEmail field', () => {
            paymentInstrument.custom.currentPaypalEmail = email;

            expect(paypalHelper.getCustomAttributePaypalEmail(paymentInstrument)).to.be.equal(email);
        });

        it('should return null if paymentInstrument does not have a data', () => {
            paymentInstrument = null;

            expect(paypalHelper.getCustomAttributePaypalEmail(paymentInstrument)).to.be.null;
        });
    });

    describe('isDuplicatedPpAccount', () => {
        before(() => {
            getCustomerPaymentInstruments.returns(customerPaymentInstruments);
        });

        after(() => {
            getCustomerPaymentInstruments.reset();
        });

        const isDuplicatedPpAccount = paypalHelper.__get__('isDuplicatedPpAccount');

        it('should return true if the account already exists', () => {
            const result = isDuplicatedPpAccount('email1@example.com');

            expect(result).to.be.true;
        });

        it('should return false if the account does not exist', () => {
            const result = isDuplicatedPpAccount('email3@example.com');

            expect(result).to.be.false;
        });
    });

    describe('convertBillingAgreements', () => {
        beforeEach(() => {
            createPaymentToken.reset();
            getCustomerPaymentInstruments.reset();
        });

        it('should successfully convert all billing agreements and rewrite profile custom attribute with empty array', () => {
            createPaymentToken.returns({
                id: 'aor2m1Ola',
                customer: {
                    id: 'kodaoks1j3'
                },
                payment_source: {
                    paypal: {
                        email_address: 'test@test.com',
                        address: {
                            address_line_1: '1 Test road',
                            admin_area_1: 'PX',
                            admin_area_2: 'TestCity',
                            country_code: 'OM',
                            postal_code: '4521622',
                            given_name: 'Test',
                            surname: 'User'
                        },
                        name: 'Test User',
                        phone: {
                            phone_number: '3013-41-441-31'
                        }
                    }
                }
            });

            const testBillingAgreements = [{ baID: 'AO-PFDPFOAK4O21O1M' }, { baID: 'JO-OEM3J1ODNAE3KLA' }];
            const testPaymentInstrument = { custom: {}, setCreditCardType: () => {} };
            const profile = {
                custom: {},
                wallet: {
                    createPaymentInstrument: () => testPaymentInstrument
                }
            };

            paypalHelper.convertBillingAgreements(testBillingAgreements, profile);

            expect(createPaymentToken.calledTwice).to.be.true;
            expect(profile.custom.payPalCustomerId).to.equal('kodaoks1j3');
            expect(profile.custom.PP_API_billingAgreement).to.be.null;
            expect(testPaymentInstrument.creditCardToken).to.equal('aor2m1Ola');
        });
    });

    it('should rewrite the billing agreements in custom attribute with those that were not converted', () => {
        createPaymentToken.returns({
            err: true
        });

        const testBillingAgreements = [{ baID: 'AO-PFDPFOAK4O21O1M' }];
        const profile = {
            custom: { payPalCustomerId: 'kodaoks1j3' }
        };

        paypalHelper.convertBillingAgreements(testBillingAgreements, profile);

        expect(createPaymentToken.calledOnce).to.be.true;
        expect(getCustomerPaymentInstruments.calledOnce).to.be.false;
        expect(profile.custom.PP_API_billingAgreement).to.equal(JSON.stringify([{ baID: 'AO-PFDPFOAK4O21O1M' }]));
    });

    describe('isReturningCustomerExperienceEnabled', () => {

        beforeEach(() => {
            Object.assign(global.customer, {
                authenticated: true,
                profile: {
                    wallet: {
                        getPaymentInstruments: () => ({
                            toArray: () => creditCardPaymentInstruments
                        })
                    }
                },
                addressBook: {
                    preferredAddress: 'Preffered Address'
                }
            });
        });

        afterEach(() => {
            global.customer = new dw.customer.Customer();
        });

        it('should return true if all conditions are met', () => {
            getCustomerPaymentInstruments.returns([{ custom: { currentPaypalEmail: 'jdoe@gmail.com' } }]);

            const result = paypalHelper.isReturningCustomerExperienceEnabled();

            expect(result).to.be.true;
        });

        it('should return true if all conditions are met for express checkout', () => {
            getCustomerPaymentInstruments.returns([{ custom: { currentPaypalEmail: 'jdoe@gmail.com' } }]);

            const result = paypalHelper.isReturningCustomerExperienceEnabled(true);

            expect(result).to.be.true;
        });

        it('should return false if customer is not authenticated', () => {
            global.customer.authenticated = false;

            const result = paypalHelper.isReturningCustomerExperienceEnabled();

            expect(result).to.be.false;
        });

        it('should return false if there are no saved PayPal accounts', () => {
            getCustomerPaymentInstruments.returns([]);

            const result = paypalHelper.isReturningCustomerExperienceEnabled();

            expect(result).to.be.false;
        });

        it('should return false if returning customer experience is not enabled', () => {
            getCustomerPaymentInstruments.returns([{ custom: { currentPaypalEmail: 'email@example.com' } }]);
            paypalPreferences.returningCustomerExperienceEnabled = false;

            const result = paypalHelper.isReturningCustomerExperienceEnabled();

            expect(result).to.be.false;
        });

        it('should return false if PayPal payment method is not active', () => {
            getCustomerPaymentInstruments.returns([{ custom: { currentPaypalEmail: 'email@example.com' } }]);
            paypalPreferences.isPayPalPmActive = false;

            const result = paypalHelper.isReturningCustomerExperienceEnabled();

            expect(result).to.be.false;
        });
    });

    describe('getShippingDetails', () => {
        const getShippingDetails = paypalHelper.__get__('getShippingDetails');
        const preferredAddress = { address: 'Preferred Address' };

        const basket = {
            currencyCode: 'USD',
            defaultShipment: {
                getShippingAddress: stub()
            },
            customer: {
                addressBook: {
                    preferredAddress: preferredAddress
                }
            },
            shipments: stub(),
            productLineItems: {
                empty: false,
                toArray: () => []
            },
            allProductLineItems: {
                empty: false,
                toArray: () => []
            },
            shippingTotalPrice: {
                subtract: () => ({
                    value: { toString: () => 40 }
                }),
                value: { toString: () => 45 }
            },
            adjustedShippingTotalPrice: 100,
            merchandizeTotalPrice: {
                subtract: () => ({
                    value: { toString: () => 100 }
                }),
                add: () => ({
                    value: { toString: () => 123 }
                })
            },
            adjustedMerchandizeTotalPrice: 100,
            giftCertificateLineItems: {
                empty: true,
                toArray: () => []
            },
            giftCertificateTotalPrice: 100,
            totalTax: {
                value: { toString: () => 0 }
            },
            giftCertificatePaymentInstruments: [{ value: 0 }]
        };

        const purchaseUnit = {
            shipping_preference: '',
            shipping: {}
        };

        it('should create purchase unit if no shipping address created', () => {
            basket.defaultShipment.getShippingAddress.returns(null);
            basket.giftCertificateLineItems.empty = false;
            basket.productLineItems.empty = true;

            const result = getShippingDetails(basket, false, purchaseUnit);

            expect(result).to.be.an('object');
            expect(result.shipping).to.be.an('object');

            expect(createShippingAddress.calledOnce).to.be.false;
        });

        it('should set preferred address if returning customer experience is enabled', () => {
            basket.shipments = [{ shippingAddress: null }];
            basket.productLineItems.empty = false;

            const isReturningCustomerExperienceEnabledStub = stub().returns(true);

            paypalHelper.__set__('isReturningCustomerExperienceEnabled', isReturningCustomerExperienceEnabledStub);
            createShippingAddress.withArgs(preferredAddress).returns({});

            const result = getShippingDetails(basket, false, purchaseUnit);

            expect(result).to.be.an('object');
            expect(result.shipping).to.be.an('object');
            expect(createShippingAddress.calledOnce).to.be.true;
            expect(createShippingAddress.calledWith(preferredAddress)).to.be.true;

            paypalHelper.__ResetDependency__('isReturningCustomerExperienceEnabled');
        });
    });

    describe('getBillingAddressFromPaymentSource', () => {
        let paymentSource = {
            payment_source: {
                google_pay: {
                    email_address: 'email_address@gmail.com',
                    name: 'Karl Jonson',
                    card: {
                        billing_address: 'address'
                    },
                    phone_number: '0681933813'
                }
            }
        };

        const expectedResult = {
            email_address: 'email_address@gmail.com',
            name: 'Karl Jonson',
            address: 'address',
            phone: {
                phone_number: '0681933813'
            }
        };

        it('should convert payment source', () => {
            expect(paypalHelper.getBillingAddressFromPaymentSource(paymentSource)).to.deep.equal(expectedResult);
        });

        it('should return payer', () => {
            paymentSource = { payer: 'payer' };

            expect(paypalHelper.getBillingAddressFromPaymentSource(paymentSource)).to.deep.equal('payer');
        });
    });

    describe('isAtLeastOnePaymentMethodEnabled', () => {
        it('should return true if any of payment method are enabled', () => {
            paypalPreferences.isGooglePayActive = true;
            paypalPreferences.isPayPalPmActive = false;
            paypalPreferences.isApplePayPmActive = false;

            expect(paypalHelper.isAtLeastOnePaymentMethodEnabled()).to.be.true;
        });

        it('should return false if all of payment methods are disabled', () => {
            paypalPreferences.isGooglePayActive = false;
            paypalPreferences.isPayPalPmActive = false;
            paypalPreferences.isApplePayPmActive = false;
            paypalPreferences.isVenmoEnabled = false;

            expect(paypalHelper.isAtLeastOnePaymentMethodEnabled()).to.be.false;
        });
    });

    describe('isFastlaneUsed', () => {
        beforeEach(() => {
            Object.assign(global.customer, {
                authenticated: false
            });
        });

        afterEach(() => {
            global.customer = new dw.customer.Customer();
        });

        it('should return true when customer is not authenticated, fastlane is enabled, and payment method is PayPal Credit Card', () => {
            paypalPreferences.isFastlaneEnabled = true;

            const paymentInstrument = {
                paymentMethod: mockPaypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
            };

            expect(paypalHelper.isFastlaneUsed(paymentInstrument)).to.be.true;
        });

        it('should return false when customer is authenticated', () => {
            paypalPreferences.isFastlaneEnabled = true;
            global.customer.authenticated = true;

            const paymentInstrument = {
                paymentMethod: mockPaypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
            };

            expect(paypalHelper.isFastlaneUsed(paymentInstrument)).to.be.false;
        });

        it('should return false when fastlane is not enabled', () => {
            paypalPreferences.isFastlaneEnabled = false;

            const paymentInstrument = {
                paymentMethod: mockPaypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
            };

            expect(paypalHelper.isFastlaneUsed(paymentInstrument)).to.be.false;
        });

        it('should return false when payment method is not PayPal Credit Card', () => {
            paypalPreferences.isFastlaneEnabled = true;

            const paymentInstrument = {
                paymentMethod: 'PAYPAL'
            };

            expect(paypalHelper.isFastlaneUsed(paymentInstrument)).to.be.false;
        });
    });

    describe('handleExpiredTransaction', () => {
        beforeEach(() => {
            res.json = stub();
        });

        it('should remove PayPal payment instrument and return JSON response', () => {
            paypalHelper.handleExpiredTransaction(res, BasketMgr.currentBasket);

            expect(res.json.calledOnce).to.be.true;

            expect(removePaypalPaymentInstrument.calledOnceWith(BasketMgr.currentBasket)).to.be.true;
        });
    });

    describe('getCustomerEmailOrEmpty', () => {
        const originalCustomer = customer;
        const originalCurrentBasket = BasketMgr.currentBasket;

        beforeEach(() => {
            sortPaymentInstrumentsByLastModifiedDesc.resetHistory();
            BasketMgr.currentBasket = originalCurrentBasket;
        });

        after(() => {
            customer = originalCustomer;
            sortPaymentInstrumentsByLastModifiedDesc.reset();
        });

        it('should return an empty string if currentBasket and customer.profile is null', () => {
            BasketMgr.currentBasket = null;
            expect(paypalHelper.getCustomerEmailOrEmpty()).to.be.equal('');
        });

        it('should return a paypal email from custom attribute if PayPal payment instruments exist in customer.profile.wallet', () => {
            const paymentInstruments = [{ paymentMethod: 'PayPal', custom: { currentPaypalEmail: 'test@test.com' } }];

            customer.registered = true;
            customer.authenticated = true;
            customer.profile = {
                email: 'customer-profile@test.com',
                wallet: {
                    getPaymentInstruments: () => ({
                        toArray: () => paymentInstruments
                    })
                }
            };

            sortPaymentInstrumentsByLastModifiedDesc.returns(paymentInstruments);

            expect(paypalHelper.getCustomerEmailOrEmpty()).to.be.equal('test@test.com');
            expect(sortPaymentInstrumentsByLastModifiedDesc.calledOnce).to.be.true;
        });

        it('should return a customer email if customer.profile exists and currentBasket.customerEmail is null', () => {
            BasketMgr.currentBasket.customerEmail = null;
            sortPaymentInstrumentsByLastModifiedDesc.returns([]);

            expect(paypalHelper.getCustomerEmailOrEmpty()).to.be.equal(customer.profile.email);
            expect(sortPaymentInstrumentsByLastModifiedDesc.calledOnce).to.be.true;
        });

        it('should return a basket customer email if currentBasket has customerEmail field with value', () => {
            BasketMgr.currentBasket.customerEmail = 'basket-customer-email@test.com';

            expect(paypalHelper.getCustomerEmailOrEmpty()).to.be.equal(BasketMgr.currentBasket.customerEmail);
        });
    });

    describe('processPaylaterMessagingConfiguration', () => {
        const originalIsPayPalPmActive = paypalPreferences.isPayPalPmActive;

        before(() => {
            paypalPreferences.isPayPalPmActive = true;
        });

        after(() => {
            paypalPreferences.isPayPalPmActive = originalIsPayPalPmActive;
        });

        it('should update view data with paylater messaging configuration for Cart page', () => {
            paypalHelper.processPaylaterMessagingConfiguration(req, res, mockPaypalConstants.PAGE_FLOW_CART);

            expect(res.viewData).has.property('paylaterMessaging');
            expect(res.viewData.paylaterMessaging.config.placement).to.equals('cart');
        });

        it('should update view data with paylater messaging configuration for Product page', () => {
            paypalHelper.processPaylaterMessagingConfiguration(req, res, mockPaypalConstants.PAGE_FLOW_PRODUCT);

            expect(res.viewData).has.property('paylaterMessaging');
            expect(res.viewData.paylaterMessaging.config.product.placement).to.equals('product');
        });
    });

    describe('updateViewDataForDigitalGoods', () => {
        const currency = 'USD';

        it ('should not update viewData since digital goods flow is disabled', () => {
            paypalHelper.updateViewDataForDigitalGoods(mockResponse, currency);

            expect(getOnlinePickupShippingMethod.calledOnce).to.be.false;
            expect(mockResponse.viewData.paypal).to.not.have.property('digitalGoodsData');
        });

        it ('should update viewData since digital goods flow is disabled', () => {
            getOnlinePickupShippingMethod.returns({ ID: 'testId' });
            paypalPreferences.isDigitalGoodsFlowEnabled = true;
            paypalHelper.updateViewDataForDigitalGoods(mockResponse, currency);

            expect(getOnlinePickupShippingMethod.calledOnce).to.be.true;
            expect(mockResponse.viewData.paypal).to.have.property('digitalGoodsData');
        });
    });

    describe('getProductTotalPrice', () => {
        const product = {
            price: {
                sales: {
                    value: 100,
                    currency: 'USD'
                },
                max: {
                    sales: {
                        value: 50,
                        currency: 'USD'
                    }
                },
                startingFromPrice: {
                    sales: {
                        value: 15,
                        currency: 'USD'
                    }
                },
                tiers: [{
                    quantity: 1,
                    price: {
                        sales: {
                            value: 20,
                            currency: 'USD'
                        }
                    }
                }]
            },
            selectedQuantity: 1
        };

        const getProductTotalPrice = paypalHelper.__get__('getProductTotalPrice');

        it('should return decimalValue string value for price.sales', () => {
            product.price.sales.value = null;
            product.price.sales.currency = null;

            expect(getProductTotalPrice(product)).to.be.equal('0.00');
        });

        it('should return decimalValue string value for price.sales', () => {
            product.price.sales.value = 100;
            product.price.sales.currency = 'USD';

            expect(getProductTotalPrice(product)).to.be.equal('100.00');
        });

        it('should return decimalValue string value for type range - price.max.sales', () => {
            product.price.type = 'range';

            expect(getProductTotalPrice(product)).to.be.equal('50.00');
        });

        it('should return decimalValue string value for type tiered - tier.price.sales', () => {
            product.price.type = 'tiered';

            expect(getProductTotalPrice(product)).to.be.equal('20.00');
        });

        it('should return decimalValue string value for type tiered - startingFromPrice.sales', () => {
            product.price.type = 'tiered';
            product.selectedQuantity = 2;

            expect(getProductTotalPrice(product)).to.be.equal('30.00');
        });
    });

    describe('getProductPrices', () => {
        const product = {
            price: {
                sales: {
                    value: 100,
                    currency: 'USD'
                }
            },
            selectedQuantity: 1,
            productType: 'tiered',
            individualProducts: []
        };

        const getProductPrices = paypalHelper.__get__('getProductPrices');

        it('should return an object with the product property only that will have an object { amount: value }', () => {
            expect(getProductPrices(product)).to.deep.equal({
                product: { amount: '100.00' }
            });
        });

        it('should return an object with the product property and each product id that will have an object { amount: value }', () => {
            product.productType = 'set';
            product.individualProducts.push({
                id: '013742003154M',
                selectedQuantity: 1,
                price: {
                    sales: {
                        value: 50,
                        currency: 'USD'
                    }
                }
            });

            expect(getProductPrices(product)).to.deep.equal({
                product: { amount: '100.00' },
                '013742003154M': { amount: '50.00' }
            });
        });
    });

    describe('assignProductAmountWithConfiguration', () => {
        const productPrices = {
            product: { amount: '100.00' },
            '013742003154M': { amount: '50.00' }
        };

        const configObj = { align: 'center', color: 'black', position: 'bottom' };

        const assignProductAmountWithConfiguration = paypalHelper.__get__('assignProductAmountWithConfiguration');

        it('should assign configuration to product prices', () => {
            expect(assignProductAmountWithConfiguration(productPrices, configObj)).to.deep.equal({
                product: Object.assign({}, configObj, productPrices.product),
                '013742003154M': Object.assign({}, configObj, productPrices['013742003154M'])
            });
        });

        it('should assign empty configuration to product prices', () => {
            expect(assignProductAmountWithConfiguration(productPrices, {})).to.deep.equal({
                product: Object.assign({}, productPrices.product),
                '013742003154M': Object.assign({}, productPrices['013742003154M'])
            });
        });
    });

    describe('getButtonMessageConfig', () => {
        let pageType = 'billing';

        const resObj = {
            viewData: {
                product: {
                    selectedQuantity: 1,
                    price: {
                        sales: {
                            value: 40,
                            currency: 'USD'
                        }
                    }
                }
            }
        };

        after(() => {
            getCurrentBasket.reset();
        });

        it('should return a JSON in string format for billing page, basket is null', () => {
            getCurrentBasket.returns(null);

            expect(paypalHelper.getButtonMessageConfig(pageType, resObj)).to.be.equal('{"align":"center","color":"black","position":"bottom","amount":0}');
        });

        it('should return a JSON in string format for billing page, basket is not null', () => {
            getCurrentBasket.returns({ totalGrossPrice: { value: 100 } });

            expect(paypalHelper.getButtonMessageConfig(pageType, resObj)).to.be.equal('{"align":"center","color":"black","position":"bottom","amount":100}');
        });

        it('should return a JSON in string format for product page', () => {
            pageType = 'pdp';

            expect(paypalHelper.getButtonMessageConfig(pageType, resObj)).to.be.equal('{"product":{"align":"left","color":"black","position":"bottom","amount":"40.00"}}');
        });

        it('should return a JSON in string format for product preview page', () => {
            pageType = 'pvp';

            expect(paypalHelper.getButtonMessageConfig(pageType, resObj)).to.be.equal('{"product":{"align":"right","color":"black","position":"bottom","amount":"40.00"}}');
        });
    });
});
