const { int_paypal: { shippingCallbackPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');
const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

const initJWTForSession = stub();
const getBasket = stub();
const updateBasketShippingAddress = stub();
const getBasketApplicableShippingMethods = stub();
const validatePayPalShippingAddress = stub();
const updateBasketShippingMethod = stub();

const mockHttpClientOcapi = {
    initJWTForSession: initJWTForSession,
    getBasket: getBasket,
    updateBasketShippingAddress: updateBasketShippingAddress,
    getBasketApplicableShippingMethods: getBasketApplicableShippingMethods,
    updateBasketShippingMethod: updateBasketShippingMethod
};

const ShippingCallback = proxyquire(shippingCallbackPath, {
    '~/cartridge/models/httpClientOcapi': function() {
        return mockHttpClientOcapi;
    },
    '*/cartridge/scripts/paypal/helpers/addressHelper': {
        validatePayPalShippingAddress: validatePayPalShippingAddress
    }
});

const basketData = {
    shipments: [
        {
            shipment_id: 'shipment123',
            shipping_method: {
                id: '001'
            }
        }
    ],
    currency: 'USD',
    order_total: 100,
    product_total: 80,
    tax_total: 10,
    shipping_total: 10
};

const requestData = {
    shipping_address: {
        admin_area_1: 'CA',
        postal_code: '94107',
        admin_area_2: 'San Francisco',
        country_code: 'US'
    },
    purchase_units: [{
        payee: {
            merchant_id: 'merchant123'
        },
        reference_id: 'ref123',
        amount: {
            breakdown: {
                item_total: { currency_code: 'USD', value: '80' },
                discount: {},
                shipping_discount: { currency_code: 'USD', value: '0' }
            }
        }
    }]
};

const mockResponseObject = {
    id: 'merchant123',
    purchase_units: [
        {
            reference_id: 'ref123',
            shipping_options: [
                {
                    id: 'method1',
                    amount: { currency_code: 'USD', value: '5' },
                    type: 'SHIPPING',
                    label: 'Standard Shipping',
                    selected: true
                }
            ],
            amount: {
                currency_code: 'USD',
                value: '100',
                breakdown: {
                    item_total: requestData.purchase_units[0].amount.breakdown.item_total,
                    tax_total: { currency_code: 'USD', value: '10' },
                    shipping: { currency_code: 'USD', value: '5' },
                    discount: requestData.purchase_units[0].amount.breakdown.discount,
                    shipping_discount: requestData.purchase_units[0].amount.breakdown.shipping_discount
                }
            }
        }
    ]
};

const cart_id = 'basket123';
const sessionId = 'session123';

describe('ShippingCallBack', () => {
    const queryStrings = {
        session_id: sessionId,
        cart_id: cart_id,
        token_data: null
    };

    let shippingCallBackInstance;

    before(() => {
        getBasket.returns(basketData);
        validatePayPalShippingAddress.returns({ errorCodes: ['INVALID_ADDRESS'] });

        shippingCallBackInstance = new ShippingCallback(requestData, queryStrings);
    });

    describe('Constructor', () => {
        it('should initialize properties correctly', () => {
            expect(shippingCallBackInstance.address).to.deep.equal({
                state_code: 'CA',
                postal_code: '94107',
                city: 'San Francisco',
                country_code: 'US'
            });
            expect(shippingCallBackInstance.addressValidationResult).to.deep.equal({ errorCodes: ['INVALID_ADDRESS'] });
            expect(shippingCallBackInstance.cartId).to.equal(cart_id);
            expect(shippingCallBackInstance.basketData).to.deep.equal(basketData);
            expect(shippingCallBackInstance.merchantId).to.equal('merchant123');
            expect(shippingCallBackInstance.referenceId).to.equal('ref123');
        });
    });

    describe('formatDeclineResponse', () => {
        it('should return decline response with error', () => {
            const response = shippingCallBackInstance.formatDeclineResponse();

            expect(response).to.deep.equal({
                name: 'UNPROCESSABLE_ENTITY',
                details: [{
                    issue: 'INVALID_ADDRESS'
                }]
            });
        });
    });

    describe('updateBasketShippingAddress', () => {
        before(() => {
            updateBasketShippingAddress.returns(basketData);
        });

        it('should not update shipping address if shipping options are presented in request data', () => {
            shippingCallBackInstance.shippingOption = {};

            shippingCallBackInstance.updateBasketShippingAddress();

            expect(shippingCallBackInstance.basketData.shipments[0].shippingAddress).to.be.undefined;
        });

        it('should update basket shipping address', () => {
            shippingCallBackInstance.shippingOption = null;
            basketData.shipments[0].shippingAddress = shippingCallBackInstance.address;

            updateBasketShippingAddress.returns(basketData);

            shippingCallBackInstance.updateBasketShippingAddress();

            expect(shippingCallBackInstance.basketData.shipments[0].shippingAddress).to.deep.equal(shippingCallBackInstance.address);
        });
    });

    describe('updateBasketShippingMethod', () => {
        const newMethodId = '002';

        after(() => {
            updateBasketShippingMethod.reset();
        });

        it ('should not update shipping method', () => {
            shippingCallBackInstance.updateBasketShippingMethod();

            expect(shippingCallBackInstance.basketData.shipments[0].shipping_method.id).to.equals('001');
        });

        it('should update shipping method', () => {
            shippingCallBackInstance.shippingOption = { id: newMethodId };
            basketData.shipments[0].shipping_method.id = newMethodId;
            updateBasketShippingMethod.returns(basketData);

            shippingCallBackInstance.updateBasketShippingMethod();

            expect(shippingCallBackInstance.basketData.shipments[0].shipping_method.id).to.equals(newMethodId);
        });

        it('should update shipping method if the shipping method id is passed as argument', () => {
            updateBasketShippingMethod.returns(basketData);

            shippingCallBackInstance.updateBasketShippingMethod(newMethodId);

            expect(shippingCallBackInstance.basketData.shipments[0].shipping_method.id).to.equals(newMethodId);
        });
    });

    describe('setShippingOptions', () => {
        before(() => {
            getBasketApplicableShippingMethods.returns({
                applicable_shipping_methods: [
                    { id: 'method1', price: 5, name: 'Standard Shipping', c_storePickupEnabled: false, c_onlinePickupEnabled: false },
                    { id: 'method2', price: 10, name: 'Express Shipping', c_storePickupEnabled: false, c_onlinePickupEnabled: false }
                ]
            });
        });

        it('should set applicable shipping options', () => {
            const selectedOption = {
                id: 'method1',
                amount: { currency_code: 'USD', value: '5' },
                type: 'SHIPPING',
                label: 'Standard Shipping',
                selected: true
            };

            shippingCallBackInstance.setShippingOptions();

            expect(shippingCallBackInstance.shippingOptions).to.deep.equal([
                selectedOption,
                {
                    id: 'method2',
                    amount: { currency_code: 'USD', value: '10' },
                    type: 'SHIPPING',
                    label: 'Express Shipping',
                    selected: false
                }
            ]);
            expect(updateBasketShippingMethod.called).to.be.true;
            expect(shippingCallBackInstance.shippingTotal).to.deep.equals(selectedOption.amount);
        });
    });

    describe('createResponse', () => {
        before(() => {
            shippingCallBackInstance.shippingOptions = [
                {
                    id: 'method1',
                    amount: { currency_code: 'USD', value: '5' },
                    type: 'SHIPPING',
                    label: 'Standard Shipping',
                    selected: true
                }
            ];
        });

        it('should create response object', () => {
            const response = shippingCallBackInstance.createResponseObject();

            expect(response).to.deep.equal(mockResponseObject);
        });
    });
});
