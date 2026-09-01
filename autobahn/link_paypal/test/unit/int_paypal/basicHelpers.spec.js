/* eslint-disable no-underscore-dangle */
const { int_paypal: { basicHelpersPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');

require('dw-api-mock/demandware-globals');

const proxyquire = require('proxyquire').noCallThru();

const RANDOM_STRING = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const paypalConstants = {
    PAYMENT_METHOD_ID_APPLE_PAY: 'ApplePay',
    PAYMENT_METHOD_ID_GOOGLE_PAY: 'GooglePay',
    PAYMENT_METHOD_ID_PAYPAL: 'PayPal'
};

const basicHelpers = proxyquire(basicHelpersPath, {
    'dw/system/Site': dw.system.Site,
    'dw/crypto/SecureRandom': function() {
        this.nextNumber = () => Math.floor(Math.random() * 2);

        return this;
    },
    'dw/util/UUIDUtils': {
        createUUID: () => RANDOM_STRING
    },
    '*/cartridge/config/constants': paypalConstants
});

describe('basicHelpers file', () => {
    describe('getValueOr', () => {
        const defaultValue = '';
        const value = 'test-str';

        it('getValueOr should be a function', () => {
            expect(basicHelpers.getValueOr).to.be.a('function');
        });

        it('should return default value', () => {
            expect(basicHelpers.getValueOr(null, defaultValue)).to.equal(defaultValue);
        });

        it('should return passed value', () => {
            expect(basicHelpers.getValueOr(value, defaultValue)).to.equal(value);
        });
    });

    describe('getValueByKey', () => {
        const key = 'customer.email.value';
        const fakeKey = 'customer.firstName.value';
        const obj = {
            customer: {
                email: { value: 'test@email.com' }
            }
        };

        const defaultValue = null;

        it('should return email value', () => {
            expect(basicHelpers.getValueByKey(obj, key, defaultValue)).to.equal('test@email.com');
        });

        it('should return default value', () => {
            expect(basicHelpers.getValueByKey(obj, fakeKey, defaultValue)).to.equal(defaultValue);
        });
    });

    describe('getPreferredAddress', () => {
        const basket = {
            customer: {
                addressBook: { preferredAddress: 'address' }
            }
        };

        const fakeBasket = {
            customer: {}
        };

        it('should return preferredAddress', () => {
            expect(basicHelpers.getPreferredAddress(basket)).to.equal('address');
        });

        it('should return default value', () => {
            expect(basicHelpers.getPreferredAddress(fakeBasket)).to.equal(null);
        });
    });

    describe('isObject', () => {
        it('should return true', () => {
            expect(basicHelpers.isObject({})).to.be.true;
            expect(basicHelpers.isObject({ firstName: 'John', lastName: 'Doe' })).to.be.true;
        });

        it('should return false', () => {
            expect(basicHelpers.isObject(5)).to.be.false;
            expect(basicHelpers.isObject([])).to.be.false;
            expect(basicHelpers.isObject(5.5)).to.be.false;
            expect(basicHelpers.isObject(null)).to.be.false;
            expect(basicHelpers.isObject(true)).to.be.false;
            expect(basicHelpers.isObject(false)).to.be.false;
            expect(basicHelpers.isObject('string')).to.be.false;
            expect(basicHelpers.isObject(() => {})).to.be.false;
            expect(basicHelpers.isObject(undefined)).to.be.false;
        });
    });

    describe('toCamelCase', () => {
        it('should return value in camel case', () => {
            expect(basicHelpers.toCamelCase('to_camel-case')).to.equal('toCamelCase');
            expect(basicHelpers.toCamelCase('to Camel Case')).to.equal('toCamelCase');
        });

        it('should return wrong result if value contains not supported characters', () => {
            expect(basicHelpers.toCamelCase('to—camel.case')).to.not.equal('toCamelCase');
        });
    });

    describe('convertKeysToCamelCase', () => {
        const arr = [];
        const func = () => {};
        const currentDate = new Date();

        it('should return the same value that was passed if it is not an object', () => {
            expect(basicHelpers.convertKeysToCamelCase(null)).to.equal(null);
            expect(basicHelpers.convertKeysToCamelCase(undefined)).to.equal(undefined);
            expect(basicHelpers.convertKeysToCamelCase('string')).to.equal('string');
            expect(basicHelpers.convertKeysToCamelCase(5)).to.equal(5);
            expect(basicHelpers.convertKeysToCamelCase(5.5)).to.equal(5.5);
            expect(basicHelpers.convertKeysToCamelCase(false)).to.equal(false);
            expect(basicHelpers.convertKeysToCamelCase(true)).to.equal(true);
            expect(basicHelpers.convertKeysToCamelCase(currentDate)).to.equal(currentDate);
            expect(basicHelpers.convertKeysToCamelCase(arr)).to.equal(arr);
            expect(basicHelpers.convertKeysToCamelCase(func)).to.equal(func);
        });

        it('should return a modified object with all keys in camel case', () => {
            let val = basicHelpers.convertKeysToCamelCase({ 'first-name': 'John', 'last_name': 'Doe' });

            expect(val).to.be.an('object').that.has.keys(['firstName', 'lastName']);
            expect(val).to.deep.equal({ firstName: 'John', lastName: 'Doe' });

            val = basicHelpers.convertKeysToCamelCase({
                first_name: 'John',
                last_name: 'Doe',
                phone: '0123456789',
                billing_address: { postal_code: '12345', country_code: 'US' },
                shipping_address: { postal_code: '12345', country_code: 'US' }
            });

            expect(val).to.deep.equal({
                firstName: 'John',
                lastName: 'Doe',
                phone: '0123456789',
                billingAddress: { postalCode: '12345', countryCode: 'US' },
                shippingAddress: { postalCode: '12345', countryCode: 'US' }
            });
        });
    });

    describe('generateRandomNumber', () => {
        it('should return a number between min and max value', () => {
            expect(basicHelpers.generateRandomNumber(1, 1)).to.be.a('number');
        });
    });

    describe('getLocaleWithHyphen', () => {
        before(() => {
            dw.system.Site.current = { defaultLocale: 'en_US' };
        });

        after(() => {
            delete dw.system.Site.current;
        });

        it('should return en-us if locale is default', () => {
            expect(basicHelpers.getLocaleWithHyphen('default')).to.be.equal('en-us');
        });

        it('should return pl-pl if locale don\'t have a underscore', () => {
            expect(basicHelpers.getLocaleWithHyphen('pl')).to.be.equal('pl-pl');
        });

        it('should return en-us if locale have a underscore', () => {
            expect(basicHelpers.getLocaleWithHyphen('en_US')).to.be.equal('en-us');
        });
    });

    describe('isJson', () => {
        it('result returns false if input value not a string', () => {
            expect(basicHelpers.isJson(50)).to.be.false;
            expect(basicHelpers.isJson(3.14)).to.be.false;
            expect(basicHelpers.isJson([])).to.be.false;
            expect(basicHelpers.isJson({})).to.be.false;
            expect(basicHelpers.isJson(null)).to.be.false;
            expect(basicHelpers.isJson(undefined)).to.be.false;
        });

        it('result returns false if input value is not json', () => {
            expect(basicHelpers.isJson('test')).to.be.false;
        });

        it('result returns false if input value is json', () => {
            const jsonObj = JSON.stringify({});
            const jsonArr = JSON.stringify([{}, {}]);

            expect(basicHelpers.isJson(jsonObj)).to.be.true;
            expect(basicHelpers.isJson(jsonArr)).to.be.true;
        });
    });

    describe('pluralize', () => {
        it('if value includes', () => {
            expect(basicHelpers.pluralize(1, 'word')).to.be.equal('word');
        });

        it('if value do not includes', () => {
            expect(basicHelpers.pluralize(10, 'word')).to.be.equal('words');
        });

        it('if value is taken from the third argument', () => {
            expect(basicHelpers.pluralize(10, 'baby', 'babies')).to.be.equal('babies');
        });
    });

    describe('getExpirationMonthDiff', () => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        it('should return a positive value', () => {
            expect(basicHelpers.getExpirationMonthDiff(currentYear, currentMonth + 1)).to.be.a('number').that.equal(1);
        });

        it('should return zero', () => {
            expect(basicHelpers.getExpirationMonthDiff(currentYear, currentMonth)).to.be.a('number').that.equal(0);
        });

        it('should return a negative value', () => {
            expect(basicHelpers.getExpirationMonthDiff(currentYear, currentMonth - 1)).to.be.a('number').that.equal(-1);
        });
    });

    describe('getFormattedShippingOptions', () => {
        let paymentMethod = 'ApplePay';

        const shippingOptions = [
            {
                ID: 'id_00',
                displayName: 'name',
                description: 'description',
                shippingCost: '$5.99',
                selected: true,
                storePickupEnabled: false,
                default: true,
                estimatedArrivalTime: '2 days'
            },
            {
                ID: 'id_01',
                displayName: 'name',
                description: 'description',
                shippingCost: '$9.99',
                selected: false,
                storePickupEnabled: true,
                estimatedArrivalTime: '2 days'
            }
        ];

        let result;

        it('response should equal result object for Apple Pay', () => {
            result = {
                defaultShippingOptionId: undefined,
                shippingOptions: [
                    {
                        identifier: 'id_00',
                        label: 'name',
                        detail: 'description',
                        amount: '5.99'
                    },
                    {
                        identifier: 'id_01',
                        label: 'name',
                        detail: 'description',
                        amount: '9.99'
                    }
                ]
            };

            expect(basicHelpers.getFormattedShippingOptions(paymentMethod, shippingOptions)).to.deep.equal(result);
        });

        it('response should equal result object', () => {
            paymentMethod = 'GooglePay';

            result = {
                defaultShippingOptionId: 'id_00',
                shippingOptions: [
                    {
                        id: 'id_00',
                        label: '$5.99: name',
                        description: 'description'
                    },
                    {
                        id: 'id_01',
                        label: '$9.99: name',
                        description: 'description'
                    }
                ]
            };

            expect(basicHelpers.getFormattedShippingOptions(paymentMethod, shippingOptions)).to.deep.equal(result);
        });

        it('response should equal result object for PayPal', () => {
            paymentMethod = 'PayPal';

            result = {
                defaultShippingOptionId: undefined,
                shippingOptions: [
                    {
                        id: 'id_00',
                        label: 'name',
                        estimatedArrivalTime: '2 days',
                        selected: true
                    },
                    {
                        id: 'id_01',
                        label: 'name',
                        estimatedArrivalTime: '2 days',
                        selected: false
                    }
                ]
            };

            expect(basicHelpers.getFormattedShippingOptions(paymentMethod, shippingOptions)).to.deep.equal(result);
        });
    });

    describe('getPpClientMetadataId', () => {
        before(() => {
            session.privacy = {};
        });

        after(() => {
            session.privacy = null;
        });

        it('should return a string', () => {
            expect(basicHelpers.getPpClientMetadataId()).to.be.a('string');
        });

        it('should return a string with the random value', () => {
            expect(basicHelpers.getPpClientMetadataId()).to.be.a('string').that.equal(RANDOM_STRING);
        });
    });
});
