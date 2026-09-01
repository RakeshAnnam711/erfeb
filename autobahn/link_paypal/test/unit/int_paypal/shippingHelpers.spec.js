const { int_paypal: { shippingHelpersPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const {
    describe, it, before, after
} = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

Object.setPrototypeOf(module,
    Object.assign(Object.getPrototypeOf(module), { superModule: {} })
);

const calculateTotals = stub();

const currencyCode = 'USD';
const defaultShippingMethod = {
    currencyCode: currencyCode,
    custom: {
        onlinePickupEnabled: false,
        storePickupEnabled: false
    },
    ID: 2,
    defaultMethod: true
};

const prefs = {
    isDigitalGoodsFlowEnabled: false
};

let allShippingMethodsArray = [
    {
        currencyCode: currencyCode,
        custom: {
            onlinePickupEnabled: true,
            storePickupEnabled: false
        },
        ID: 1,
        defaultMethod: false
    },
    defaultShippingMethod,
    {
        currencyCode: currencyCode,
        custom: {
            storePickupEnabled: true,
            onlinePickupEnabled: false
        },
        ID: 3,
        defaultMethod: false
    }
];

const availableShippingMethods = [
    {
        ID: '001',
        displayName: 'Ground',
        description: 'Delivered in five business days',
        estimatedArrivalTime: '5 business days',
        default: true,
        online: true,
        custom: {
            storePickupEnabled: false
        }
    },
    {
        ID: '002',
        displayName: '2-Day',
        description: 'Delivered in two business days',
        estimatedArrivalTime: '2 business days',
        default: false,
        online: true,
        custom: {
            storePickupEnabled: true
        }
    },
    {
        ID: '003',
        displayName: 'Overnight',
        description: 'Delivered in next business day',
        estimatedArrivalTime: 'Next business day',
        default: false,
        online: true,
        custom: {
            storePickupEnabled: true
        }
    }
];

const applicableShippingMethods = [
    {
        ID: '001',
        displayName: 'Ground',
        description: 'Delivered in five business days',
        estimatedArrivalTime: '5 business days',
        default: true,
        online: true,
        custom: {
            storePickupEnabled: false
        }
    },
    {
        ID: '002',
        displayName: '2-Day',
        description: 'Delivered in two business days',
        estimatedArrivalTime: '2 business days',
        default: false,
        online: true,
        custom: {
            storePickupEnabled: true
        }
    }
];

const expectedShippingOptions = [
    {
        ID: '001',
        displayName: 'Ground',
        description: 'Delivered in five business days',
        estimatedArrivalTime: '5 business days',
        default: true,
        online: true,
        shippingCost: 10,
        custom: {
            storePickupEnabled: false
        }
    },
    {
        ID: '002',
        displayName: '2-Day',
        description: 'Delivered in two business days',
        estimatedArrivalTime: '2 business days',
        default: false,
        online: true,
        shippingCost: 10,
        custom: {
            storePickupEnabled: true
        }
    }
];

const allShippingMethods = {
    toArray: () => allShippingMethodsArray,
    filter: (e) => allShippingMethodsArray.filter(e),
    length: allShippingMethodsArray.length
};

const ShippingMgr = {
    getDefaultShippingMethod: function() {
        return defaultShippingMethod;
    },
    getShipmentShippingModel: function() {
        return {
            getApplicableShippingMethods: function() {
                return allShippingMethods;
            },
            applicableShippingMethods: allShippingMethods
        };
    },
    allShippingMethods
};

const Collection = function() {
    return {
        allShippingMethods
    };
};

let shipment = {};

const shippingHelpers = proxyquire(shippingHelpersPath, {
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/util/Collection': Collection,
    '*/cartridge/models/shipping/shippingMethod': function() {
        return allShippingMethodsArray[1];
    },
    '*/cartridge/config/preferences': prefs,
    '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: calculateTotals },
    'dw/system/Transaction': dw.system.Transaction
});

describe('shippingHelpers file', () => {
    const address = {};
    const SHOULD_BE_FUNCTION = 'should be a function';
    const SHOULD_SET_DEFAULT_SM = 'should set defaultShippingMethod into shipment';
    const originalAllSmArray = allShippingMethodsArray;

    describe('getFirstApplicableShippingMethod', () => {
        const getFirstApplicableShippingMethod = shippingHelpers.__get__('getFirstApplicableShippingMethod');

        it('should be a function', () => {
            expect(getFirstApplicableShippingMethod).to.be.a('function');
        });

        it('should return default shipping method object', () => {
            expect(getFirstApplicableShippingMethod(originalAllSmArray)).to.equal(allShippingMethodsArray[1]);
        });

        describe('digital goods (pay now) flow is enabled', () => {
            before(() => {
                prefs.isDigitalGoodsFlowEnabled = true;
            });

            after(() => {
                prefs.isDigitalGoodsFlowEnabled = false;
            });

            it('should return an online pick shipping method object', () => {
                expect(getFirstApplicableShippingMethod(originalAllSmArray)).to.equal(allShippingMethodsArray[0]);
            });
        });
    });

    describe('excludeOnlinePickUpSM function', () => {
        it(SHOULD_BE_FUNCTION, () => {
            expect(shippingHelpers.excludeOnlinePickUpSM).to.be.a('function');
        });

        it('should be instance of array', () => {
            expect(shippingHelpers.excludeOnlinePickUpSM(allShippingMethodsArray)).to.be.an.instanceof(Array);
        });

        it('should return an array without onlinePickUp shipping method', () => {
            const shippingMethods = [
                allShippingMethodsArray[1],
                allShippingMethodsArray[2]
            ];

            expect(shippingHelpers.excludeOnlinePickUpSM(allShippingMethodsArray)).to.deep.equal(shippingMethods);
        });
    });

    describe('updateShippingAddressFields', () => {
        const updateShippingAddressFields = shippingHelpers.__get__('updateShippingAddressFields');

        it('should update state code and postal code of shipping address if address and shipment exist', () => {
            const addressMock = {
                stateCode: 'NY',
                postalCode: '12345'
            };

            const shippingAddress = {
                stateCode: 'CA',
                postalCode: '67890'
            };

            const shipmentMock = {
                shippingAddress: shippingAddress
            };

            updateShippingAddressFields(addressMock, shipmentMock);

            expect(shippingAddress.stateCode).to.equal('NY');
            expect(shippingAddress.postalCode).to.equal('12345');
        });

        it('should not update state code and postal code if shipping address does not exist', () => {
            const addressMock = {
                stateCode: 'NY',
                postalCode: '12345'
            };

            const shipmentMock = {
                shippingAddress: null
            };

            updateShippingAddressFields(addressMock, shipmentMock);

            expect(shipment.shippingAddress).to.be.undefined;
        });

        it('should not update state code and postal code if address is not provided', () => {
            const shippingAddress = {
                stateCode: 'CA',
                postalCode: '67890'
            };

            const shipmentMock = {
                shippingAddress: shippingAddress
            };

            updateShippingAddressFields(null, shipmentMock);

            expect(shippingAddress.stateCode).to.equal('CA');
            expect(shippingAddress.postalCode).to.equal('67890');
        });
    });

    describe('selectShippingMethod function', () => {
        before(() => {
            shipment = {
                setShippingMethod: () => {}
            };
        });
        after(() => {
            shipment = {};
        });

        it(SHOULD_BE_FUNCTION, () => {
            expect(shippingHelpers.selectShippingMethod).to.be.a('function');
        });

        describe('if shippingMethods is provided and shippingMethodId is not provided', () => {
            it(SHOULD_SET_DEFAULT_SM, () => {
                expect(shippingHelpers.selectShippingMethod(shipment, null, allShippingMethods)).to.be.an('undefined');
            });
        });

        describe('if the provided shipping methods array does not contains a default methods', () => {
            before(() => {
                allShippingMethodsArray = [
                    allShippingMethodsArray[0],
                    allShippingMethodsArray[2]
                ];
            });

            after(() => {
                allShippingMethodsArray = originalAllSmArray;
            });

            it('should set the first applicable shipping methods into shipment', () => {
                expect(shippingHelpers.selectShippingMethod(shipment, null, allShippingMethods)).to.be.an('undefined');
            });
        });

        describe('if shippingMethods length > 0', () => {
            before(() => {
                allShippingMethodsArray = [];
            });

            after(() => {
                allShippingMethodsArray = originalAllSmArray;
            });

            it('should set shippingMethod into shipment', () => {
                expect(shippingHelpers.selectShippingMethod(shipment, null, allShippingMethods, address)).to.be.undefined;
            });
        });

        describe('if shippingMethods length < 0', () => {
            const allShippingMethodsMock = {
                toArray: () => allShippingMethodsArray
            };

            before(() => {
                allShippingMethodsArray = [];
            });

            after(() => {
                allShippingMethodsArray = originalAllSmArray;
            });

            it('should set null into shipment', () => {
                expect(shippingHelpers.selectShippingMethod(shipment, null, allShippingMethodsMock, null)).to.be.an('undefined');
            });
        });

        describe('Changing of function parameters', () => {
            it(`if shipping methods, shippingMethodId are not privided and address is provided as arguments, ${SHOULD_SET_DEFAULT_SM}`, () => {
                expect(shippingHelpers.selectShippingMethod(shipment, null, null, address)).to.be.an('undefined');
            });

            it(`if shipping methods, shippingMethodId, address are not privided, ${SHOULD_SET_DEFAULT_SM}`, () => {
                expect(shippingHelpers.selectShippingMethod(shipment, null, null, null)).to.be.an('undefined');
            });

            it('if shippingMethodId is provided and applicable, should set current shipping method into shipment', () => {
                expect(shippingHelpers.selectShippingMethod(shipment, 1, null, null)).to.be.an('undefined');
            });
        });
    });

    describe('getApplicableShippingMethods function', () => {
        it(SHOULD_BE_FUNCTION, () => {
            expect(shippingHelpers.getApplicableShippingMethods).to.be.a('function');
        });

        it('should return null if !shipment', () => {
            expect(shippingHelpers.getApplicableShippingMethods()).to.be.null;
        });

        it('should be an instance of array', () => {
            expect(shippingHelpers.getApplicableShippingMethods(shipment)).to.be.an.instanceof(Array);
        });

        it('should return an array of objects without onlinePickUp and storePickupEnabled method if Digital Goods (Pay Now) is disabled', () => {
            expect(shippingHelpers.getApplicableShippingMethods(shipment, address)).to.be.an('array').that.includes(allShippingMethodsArray[1]);
        });

        describe('digital goods (pay now) flow enabled', () => {
            let getOnlinePickupShippingMethodStub;

            before(() => {
                getOnlinePickupShippingMethodStub = stub(shippingHelpers, 'getOnlinePickupShippingMethod').returns(allShippingMethodsArray[0]);
                prefs.isDigitalGoodsFlowEnabled = true;
                shipment = {
                    shippingMethod: {
                        currencyCode: 'USD'
                    }
                };
            });

            after(() => {
                getOnlinePickupShippingMethodStub.restore();
                prefs.isDigitalGoodsFlowEnabled = false;
                shipment = {};
            });

            it('should call getOnlinePickupShippingMethod', () => {
                shippingHelpers.getApplicableShippingMethods(shipment, address);
                expect(getOnlinePickupShippingMethodStub.calledOnce).to.be.true;
            });
        });
    });

    describe('getOnlinePickupShippingMethod function', () => {
        it(SHOULD_BE_FUNCTION, () => {
            expect(shippingHelpers.getOnlinePickupShippingMethod).to.be.a('function');
        });

        describe('if currencies are equal and shipping method is onlinePickUp', () => {
            it('should return an online pick shipping method object', () => {
                expect(shippingHelpers.getOnlinePickupShippingMethod(currencyCode)).to.equal(allShippingMethodsArray[0]);
            });
        });

        describe('if there is no onlinePickUp shipping method', () => {
            before(() => {
                allShippingMethodsArray = [];
            });

            after(() => {
                allShippingMethodsArray = originalAllSmArray;
            });

            it('should return undefined', () => {
                expect(shippingHelpers.getOnlinePickupShippingMethod(currencyCode)).to.be.an('undefined');
            });
        });

        describe('if currencies are not equal', () => {
            it('should return undefined', () => {
                expect(shippingHelpers.getOnlinePickupShippingMethod('EUR')).to.be.an('undefined');
            });
        });
    });

    describe('getShippingOptionsPricesWithAdjustments', function() {
        const basket = {
            defaultShipment: {
                shippingMethod: { ID: '001' },
                setShippingMethod: stub(),
                getShippingTotalPrice: () => ({ value: 10 })
            }
        };

        it('should return shipping options with updated prices from shipment', () => {
            const result = shippingHelpers.getShippingOptionsPricesWithAdjustments(applicableShippingMethods, availableShippingMethods, basket);

            expect(result).to.deep.equal(expectedShippingOptions);
        });
    });
});
