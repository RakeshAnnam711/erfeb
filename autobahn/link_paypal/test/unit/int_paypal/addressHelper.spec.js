/* eslint-disable no-shadow */
const { int_paypal: { addressHelperPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { stub, assert } = require('sinon');
const {
    describe, it, before, beforeEach, after, afterEach
} = require('mocha');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const copyCustomerAddressToShipment = stub();
const selectShippingMethod = stub();
const calculateTotals = stub();
const getPreferredAddress = stub();
const recalculateBasket = stub();
const getOnlinePickupShippingMethod = stub();
const addressValidator = stub();
const fakeHasOnlyGiftCertificates = stub();
const getApplicableShippingMethods = stub();
const isReturningCustomerExperienceEnabled = stub();
const getOrderDetails = stub();
const getBillingAddressFromPaymentSource = stub();

const mockBasket = {
    setCustomerEmail: email => {
        mockBasket.customerEmail = email;
    },
    customer: {
        authenticated: false,
        profile: {
            email: 'customer@test.com'
        }
    },
    customerEmail: null
};

const getValueByKey = (object, key, defaultValue) => {
    if (typeof key === 'string' && key.indexOf('.') > 0) {
        const keys = key.split('.');
        const newObject = object[keys.shift()];

        if (!newObject) {
            return defaultValue;
        }

        return getValueByKey(newObject, keys.join('.'), defaultValue);
    }

    return object[key] || defaultValue;
};

const serverForm = {
    forms: {
        getForm: () => ({
            clear: () => {},
            copyFrom: () => ({}),
            country: {},
            states: { stateCode: {} }
        })
    }
};

const paypalPreferences = {};

const addressHelper = proxyquire(addressHelperPath, {
    'server': serverForm,
    'dw/web/Resource': dw.web.Resource,
    '*/cartridge/scripts/checkout/checkoutHelpers': {
        recalculateBasket,
        copyCustomerAddressToShipment
    },
    '*/cartridge/scripts/checkout/shippingHelpers': {
        selectShippingMethod,
        getOnlinePickupShippingMethod,
        getApplicableShippingMethods
    },
    '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals },
    '*/cartridge/scripts/util/basicHelpers': {
        getValueOr: (value, defaultValue) => value || defaultValue,
        getValueByKey,
        getPreferredAddress,
        convertKeysToCamelCase: (data) => data,
        isObject: (obj) => obj !== null && typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]'
    },
    '*/cartridge/config/constants': {
        BILLING_ADDRESS_ID: 'Billing address',
        SHIPPING_ADDRESS_ID: 'Shipping address',
        ADDRESS_FORM_FIELD_COUNTRY: 'country',
        ADDRESS_FORM_FIELD_STATE: 'stateCode',
        ADDRESS_FORM_FIELD_POSTAL_CODE: 'postalCode',
        PAYPAL_SHIPPING_ADDRESS_ERROR_CODE: 'ADDRESS_ERROR',
        PAYPAL_SHIPPING_COUNTRY_ERROR_CODE: 'COUNTRY_ERROR',
        PAYPAL_SHIPPING_STATE_ERROR_CODE: 'STATE_ERROR',
        PAYPAL_SHIPPING_ZIP_ERROR_CODE: 'ZIP_ERROR'
    },
    '*/cartridge/models/addressValidator': addressValidator,
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        hasOnlyGiftCertificates: fakeHasOnlyGiftCertificates,
        isReturningCustomerExperienceEnabled: isReturningCustomerExperienceEnabled,
        getBillingAddressFromPaymentSource: getBillingAddressFromPaymentSource
    },
    '*/cartridge/config/preferences': paypalPreferences,
    '*/cartridge/scripts/paypal/api': {
        getOrderDetails
    }
});

describe('addressHelper file', () => {
    /* eslint-disable no-underscore-dangle */
    describe('updateShippingMethodsList', () => {
        const updateShippingMethodsList = addressHelper.__get__('updateShippingMethodsList');

        const defaultShipment = {
            getShippingAddress: () => ({
                getCity: () => {},
                getStateCode: () => {},
                getCountryCode: () => {},
                getPostalCode: () => {}
            })
        };

        const basket = {
            defaultShipment,
            shipments: [{ shippingAddress: null }],
            customer: {
                addressBook: { preferredAddress: 'address' }
            }
        };

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.withArgs('paypal.shippingoption.invalid.error', 'paypalerrors', null).throws(Error);
        });

        afterEach(() => {
            selectShippingMethod.reset();
            calculateTotals.reset();
        });

        after(() => {
            getApplicableShippingMethods.reset();
            dw.web.Resource.msg.restore();
        });

        it('should update shipping methods list and call selectShippingMethod without shippingMethodID', () => {
            getApplicableShippingMethods.returns([]);
            updateShippingMethodsList(basket);

            expect(selectShippingMethod.calledWithExactly(defaultShipment, undefined)).to.be.true;
            expect(calculateTotals.calledOnce).to.be.true;
        });

        it('should update shipping methods list and call selectShippingMethod with shippingMethodID', () => {
            basket.defaultShipment.shippingMethod = { ID: 'ID' };
            getApplicableShippingMethods.returns([{ ID: 'ID' }]);
            updateShippingMethodsList(basket);

            expect(selectShippingMethod.calledWithExactly(defaultShipment, 'ID')).to.be.true;
            expect(calculateTotals.calledOnce).to.be.true;
        });

        it('should throw an error if shipping method doesn\'t ship to shipping address and no fallback options are available', () => {
            getApplicableShippingMethods.returns([]);
            isReturningCustomerExperienceEnabled.returns(false);
            basket.customer.addressBook.preferredAddress = null;

            expect(() => updateShippingMethodsList(basket)).to.throw(Error);
        });
    });

    describe('createPersonNameObject', () => {
        describe('trim, split an input string and assign a value', () => {
            let name;

            it('should return firstName, lastName, secondName if the name.length === 3', () => {
                name = ' Ivan Ivanovych Ivanov ';
                expect(addressHelper.createPersonNameObject(name)).to.deep.equal({
                    firstName: 'Ivan Ivanovych',
                    lastName: 'Ivanov'
                });
            });
            it('should return firstName, lastName if the name.length === 2', () => {
                name = ' Ivan  Ivanov ';
                expect(addressHelper.createPersonNameObject(name)).to.deep.equal({
                    firstName: 'Ivan',
                    lastName: 'Ivanov'
                });
            });
            it('should return firstName if name.length === 1', () => {
                name = 'Ivan';
                expect(addressHelper.createPersonNameObject(name)).to.deep.equal({
                    firstName: 'Ivan',
                    lastName: null
                });
            });
        });
    });

    describe('updateOrderBillingAddress', function() {
        const basket = {
            getBillingAddress: stub(),
            createBillingAddress: stub(),
            setCustomerEmail: stub(),
            customer: {
                authenticated: false
            }
        };

        const billingAddress = {
            setFirstName: stub(),
            setLastName: stub(),
            setCountryCode: stub(),
            setCity: stub(),
            setAddress1: stub(),
            setAddress2: stub(),
            setPostalCode: stub(),
            setStateCode: stub(),
            setPhone: stub()
        };

        before(() => {
            basket.getBillingAddress.returns(billingAddress);

            const paypalBillingAddress = {
                name: {
                    given_name: 'John',
                    surname: 'Doe'
                },
                address: {
                    country_code: 'CO',
                    admin_area_2: 'testLocality',
                    address_line_1: 'testStreetAddress',
                    address_line_2: 'testExtendedAddress',
                    postal_code: 'testPostalCode',
                    admin_area_1: 'testRegion'
                },
                phone: {
                    phone_number: {
                        national_number: 'testPhone'
                    }
                },
                email_address: 'newEmail'
            };

            addressHelper.updateOrderBillingAddress(basket, paypalBillingAddress);
        });

        it('should set first name into billing address', () => {
            assert.calledWith(billingAddress.setFirstName, 'John');
        });
        it('should set last name into billing address', () => {
            assert.calledWith(billingAddress.setLastName, 'Doe');
        });
        it('should set country code into billing address', () => {
            assert.calledWith(billingAddress.setCountryCode, 'CO');
        });
        it('should set city into billing address', () => {
            assert.calledWith(billingAddress.setCity, 'testLocality');
        });
        it('should set address1 into billing address', () => {
            assert.calledWith(billingAddress.setAddress1, 'testStreetAddress');
        });
        it('should set address2 into billing address', () => {
            assert.calledWith(billingAddress.setAddress2, 'testExtendedAddress');
        });
        it('should set postal code into billing address', () => {
            assert.calledWith(billingAddress.setPostalCode, 'testPostalCode');
        });
        it('should set state code into billing address', () => {
            assert.calledWith(billingAddress.setStateCode, 'testRegion');
        });
        it('should set phone into billing address', () => {
            assert.calledWith(billingAddress.setPhone, 'testPhone');
        });

        describe('should use createPersonNameObject function', () => {
            const payPalBillingAddress = {
                name: 'Test String',
                address: {},
                phone: { phone_number: {} },
                email_address: {}
            };

            const nameStr = addressHelper.createPersonNameObject(payPalBillingAddress.name);

            before(() => {
                basket.createBillingAddress.returns(billingAddress);
                addressHelper.updateOrderBillingAddress(basket, payPalBillingAddress);
            });

            it('should set first name into billing address', () => {
                assert.calledWith(billingAddress.setFirstName, nameStr.firstName);
            });

            it('should set last name into billing address', () => {
                assert.calledWith(billingAddress.setLastName, nameStr.lastName);
            });
        });

        describe('create new billing address with empty props', () => {
            /* eslint-disable no-global-assign */
            const basket = {
                getBillingAddress: stub(),
                createBillingAddress: stub(),
                setCustomerEmail: stub(),
                customer: {
                    authenticated: true,
                    profile: { email: 'email' }
                },
                customerEmail: ''
            };

            const billingAddress = {
                setFirstName: stub(),
                setLastName: stub(),
                setCountryCode: stub(),
                setCity: stub(),
                setAddress1: stub(),
                setAddress2: stub(),
                setPostalCode: stub(),
                setStateCode: stub(),
                setPhone: stub()
            };

            const payPalBillingAddress = {
                name: {},
                address: {},
                phone: { phone_number: {} },
                email_address: {}
            };

            const originalDecodeURIComponent = decodeURIComponent;

            before(() => {
                basket.createBillingAddress.returns(billingAddress);
                decodeURIComponent = () => undefined;

                addressHelper.updateOrderBillingAddress(basket, payPalBillingAddress);
            });

            after(() => {
                decodeURIComponent = originalDecodeURIComponent;
            });

            it('should set first name into billing address', () => {
                assert.calledWith(billingAddress.setFirstName, '');
            });

            it('should set last name into billing address', () => {
                assert.calledWith(billingAddress.setLastName, '');
            });

            it('should set country code into billing address', () => {
                assert.calledWith(billingAddress.setCountryCode, undefined);
            });

            it('should set city into billing address', () => {
                assert.calledWith(billingAddress.setCity, '');
            });

            it('should set address1 into billing address', () => {
                assert.calledWith(billingAddress.setAddress1, '');
            });

            it('should set address2 into billing address', () => {
                assert.calledWith(billingAddress.setAddress2, '');
            });

            it('should set postal code into billing address', () => {
                assert.calledWith(billingAddress.setPostalCode, '');
            });

            it('should set state code into billing address', () => {
                assert.calledWith(billingAddress.setStateCode, '');
            });

            it('should set phone into billing address', () => {
                assert.calledWith(billingAddress.setPhone, '');
            });

            it('should not set customer`s email to basket', () => {
                basket.setCustomerEmail.reset();

                basket.customerEmail = 'email@email.com';
                addressHelper.updateOrderBillingAddress(basket, payPalBillingAddress);

                assert.notCalled(basket.setCustomerEmail);
            });
        });
    });

    describe('updateOrderShippingAddress', function() {
        const getShippingAddress = stub();
        const createShippingAddress = stub();
        const basket = {
            customer: { addressBook: { preferredAddress: null } },
            defaultShipment: { shippingMethod: { ID: 'PayPal' } },
            getDefaultShipment: () => ({
                getShippingAddress,
                createShippingAddress
            })
        };

        const paypalShippingAddress = [
            {
                name: {
                    full_name: 'John Doe'
                },
                address: {
                    country_code: 'CO',
                    admin_area_2: 'testLocality',
                    address_line_1: 'testStreetAddress',
                    address_line_2: 'testExtendedAddress',
                    postal_code: 'testPostalCode',
                    admin_area_1: 'testRegion'
                },
                phone: {
                    phone_number: {
                        national_number: 'testPhone'
                    }
                }
            }
        ];

        const shippingAddress = {
            setFirstName: stub(),
            setLastName: stub(),
            setCountryCode: stub(),
            setCity: stub(),
            setAddress1: stub(),
            setAddress2: stub(),
            setPostalCode: stub(),
            setStateCode: stub(),
            setPhone: stub(),
            getCity: stub(),
            getStateCode: stub(),
            getCountryCode: stub(),
            getPostalCode: stub()
        };

        before(() => {
            customer.addressBook = { addresses: { empty: false } };
            addressHelper.__set__('updateShippingMethodsList', () => {});
            getShippingAddress.returns(shippingAddress);
            getPreferredAddress.returns({
                getCountryCode: () => 'US',
                getCity: () => 'city',
                getAddress1: () => 'address1',
                getAddress2: () => 'address2',
                getPostalCode: () => '99999',
                getStateCode: () => 'NY',
                getFullName: () => 'Name',
                getPhone: () => 'phone'
            });

            addressHelper.updateOrderShippingAddress(basket, paypalShippingAddress[0]);
        });

        after(() => {
            getPreferredAddress.reset();
            paypalShippingAddress[0].address.country_code = 'CO';
            customer.addressBook = null;
        });

        it('should set first name into shipping address', () => {
            assert.calledWith(shippingAddress.setFirstName, 'John');
        });

        it('should return undefined if first and last name is empty', () => {
            const wrongPaypalShippingAddress = [
                {
                    name: {
                        full_name: ''
                    },
                    address: {
                        country_code: '',
                        admin_area_2: 'testLocality',
                        address_line_1: 'testStreetAddress',
                        address_line_2: 'testExtendedAddress',
                        postal_code: 'testPostalCode',
                        admin_area_1: 'testRegion'
                    },
                    phone: {
                        phone_number: {
                            national_number: 'testPhone'
                        }
                    }
                }
            ];

            const result = addressHelper.updateOrderShippingAddress(basket, wrongPaypalShippingAddress[0]);

            expect(result).to.be.undefined;
        });

        it('should set shipping address if no shippingAddress', () => {
            const wrongPaypalShippingAddress = [
                {
                    name: {
                        full_name: 'John Doe'
                    },
                    address: null,
                    phone: {
                        phone_number: {
                            national_number: 'testPhone'
                        }
                    }
                }
            ];

            const result = addressHelper.updateOrderShippingAddress(basket, wrongPaypalShippingAddress[0]);

            expect(result).to.be.undefined;
            assert.calledWith(shippingAddress.setLastName, 'Doe');
        });

        it('should set last name into shipping address', () => {
            assert.calledWith(shippingAddress.setLastName, 'Doe');
        });

        it('should set country code into shipping address', () => {
            assert.calledWith(shippingAddress.setCountryCode, 'CO');
        });

        it('should set city into shipping address', () => {
            assert.calledWith(shippingAddress.setCity, 'testLocality');
        });

        it('should set address1 into shipping address', () => {
            assert.calledWith(shippingAddress.setAddress1, 'testStreetAddress');
        });

        it('should set address2 into shipping address', () => {
            assert.calledWith(shippingAddress.setAddress2, 'testExtendedAddress');
        });

        it('should set postal code into shipping address', () => {
            assert.calledWith(shippingAddress.setPostalCode, 'testPostalCode');
        });

        it('should set state code into shipping address', () => {
            assert.calledWith(shippingAddress.setStateCode, 'testRegion');
        });

        it('should set phone into shipping address', () => {
            assert.calledWith(shippingAddress.setPhone, 'testPhone');
        });

        it('should set phone into shipping address in case if phone_number key is passed', () => {
            const mockShippingData = JSON.parse(JSON.stringify(paypalShippingAddress[0]));

            mockShippingData.phone = null;
            mockShippingData.phone_number = {
                country_code: '1',
                national_number: '8042221111'
            };

            addressHelper.updateOrderShippingAddress(basket, mockShippingData);

            assert.calledWith(shippingAddress.setPhone, 'testPhone');
        });

        it('should create shipping address in basket shipment if there\'s no preferred', () => {
            getShippingAddress.returns(null);
            createShippingAddress.returns(shippingAddress);
            paypalShippingAddress[0].address.country_code = 'UA';

            addressHelper.updateOrderShippingAddress(basket, paypalShippingAddress[0]);
            assert.calledWith(shippingAddress.setCountryCode, 'UA');
        });

        it('should create shipping address in basket shipment if there\'s no preferred', () => {
            getShippingAddress.returns(null);
            createShippingAddress.returns(shippingAddress);
            paypalShippingAddress[0].phone = undefined;
            paypalShippingAddress[0].phone_number = {
                national_number: 'testPhone'
            };

            addressHelper.updateOrderShippingAddress(basket, paypalShippingAddress[0]);
            assert.calledWith(shippingAddress.setPhone, 'testPhone');
        });
    });

    describe('createShippingAddress', () => {
        const shippingAddress = {
            fullName: 'Test Test',
            address1: 'test',
            address2: 'test',
            stateCode: 'test',
            city: 'test',
            postalCode: 'test',
            countryCode: {
                value: 'co'
            }
        };

        it('should return created shipping address object', () => {
            expect(addressHelper.createShippingAddress(shippingAddress)).to.deep.equal({
                name: {
                    full_name: 'Test Test'
                },
                address: {
                    address_line_1: 'test',
                    address_line_2: 'test',
                    admin_area_1: 'test',
                    admin_area_2: 'test',
                    postal_code: 'test',
                    country_code: 'CO'
                }
            });
        });
    });

    describe('getShippingAddressFromHttpParameterMap', () => {
        const httpParameterMap = {
            get: stub()
        };

        httpParameterMap.get.withArgs('dwfrm_shipping_shippingAddress_addressFields_address1').returns({ value: 'address' });
        httpParameterMap.get.withArgs('dwfrm_shipping_shippingAddress_addressFields_city').returns({ value: 'city' });
        httpParameterMap.get.withArgs('dwfrm_shipping_shippingAddress_addressFields_country').returns({ value: 'country' });
        httpParameterMap.get.withArgs('dwfrm_shipping_shippingAddress_addressFields_firstName').returns({ value: 'firstName' });
        httpParameterMap.get.withArgs('dwfrm_shipping_shippingAddress_addressFields_lastName').returns({ value: 'lastName' });
        httpParameterMap.get.withArgs('dwfrm_shipping_shippingAddress_addressFields_postalCode').returns({ value: 'postalCode' });
        httpParameterMap.get.withArgs('dwfrm_shipping_shippingAddress_addressFields_states_stateCode').returns({ value: 'stateCode' });

        it('should return shipping address object', () => {
            const result = addressHelper.getShippingAddressFromHttpParameterMap(httpParameterMap);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                address1: 'address',
                city: 'city',
                countryCode: 'country',
                firstName: 'firstName',
                lastName: 'lastName',
                postalCode: 'postalCode',
                stateCode: 'stateCode'
            });
        });
    });

    const addressesKeys = ['addressId', 'firstName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'countryCode', 'stateCode', 'phone'];

    const addressForm = serverForm.forms.getForm();

    const validateAddressFormKeys = ['error', 'errorName', 'fields', 'message'];

    const paypalPayload = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '408-922-3384',
        billingAddress: {
            line1: '473 Wiseman Street',
            line2: '',
            city: 'Servierville',
            postalCode: '37862',
            countryCode: 'US',
            state: 'TN'
        },
        shippingAddress: {
            line1: '473 Wiseman Street',
            line2: '',
            city: 'Servierville',
            postalCode: '37862',
            countryCode: 'US',
            state: 'TN'
        }
    };

    const paypalPayloadWithPurchaseUnits = {
        payer: {
            address: {
                address_line_1: '473 Wiseman Street',
                admin_area_1: 'TN',
                admin_area_2: 'Servierville',
                postal_code: '37862',
                country_code: 'US'
            },
            name: { surname: 'Doe', give_name: 'John' },
            phone: { phone_number: { national_number: '408-922-3384' } }
        },
        purchase_units: {
            '0': {
                shipping: {
                    name: { full_name: 'John Doe' },
                    address: {
                        address_line_1: '473 Wiseman Street',
                        admin_area_1: 'TN',
                        admin_area_2: 'Servierville',
                        postal_code: '37862',
                        country_code: 'US'
                    },
                    phone_number: {
                        national_number: '408-922-3384'
                    }
                }
            }
        }
    };

    describe('prepareAddressData', () => {
        const addressData = {
            addressId: 'Address id',
            firstName: 'John',
            lastName: 'Doe',
            line1: '473 Wiseman Street',
            line2: '',
            city: 'Servierville',
            postalCode: '37862',
            countryCode: 'US',
            stateCode: 'TN',
            phone: '408-922-3384'
        };

        const prepareAddressData = addressHelper.__get__('prepareAddressData');

        it('should return an object with a keys from Addresses class', () => {
            const val = prepareAddressData(addressData);

            expect(val).to.be.an('object').that.has.all.keys(addressesKeys);
        });
    });

    describe('prepareShippingAddressData', () => {
        it('should return an object with a keys from Addresses class (shipping address)', () => {
            const val = addressHelper.prepareShippingAddressData(paypalPayload);

            expect(val).to.be.an('object').and.has.all.keys(addressesKeys);
        });
    });

    describe('validateAddressForm', () => {
        before(() => {
            addressValidator.returns({
                validate: () => ({}),
                setFieldsToNotValidate: () => {}
            });
        });

        after(() => {
            addressValidator.reset();
        });

        it('should return an empty object if validation completed without errors', () => {
            expect(addressHelper.validateAddressForm(addressForm, {})).to.be.an('object').and.empty;
        });

        it('should return an object with errors if validation failed', () => {
            addressValidator.returns({
                validate: () => ({ country: 'Field is invalid' }),
                setFieldsToNotValidate: () => {}
            });

            expect(addressHelper.validateAddressForm(addressForm, {})).to.be.an('object').and.not.empty;
        });
    });

    describe('validateShippingAddressForm', () => {
        before(() => {
            addressValidator.returns({
                validate: () => ({}),
                setFieldsToNotValidate: () => {}
            });
        });

        after(() => {
            addressValidator.reset();
        });

        it('should return an empty object if validation completed without errors (shipping address)', () => {
            expect(addressHelper.validateShippingAddressForm(paypalPayload, addressForm)).to.be.an('object').that.has.all.keys(validateAddressFormKeys).include({ error: false });
        });

        it('should return an object with errors if validation failed (shipping address)', () => {
            addressValidator.returns({
                validate: () => ({ country: 'Field is invalid' }),
                setFieldsToNotValidate: () => {}
            });

            expect(addressHelper.validateShippingAddressForm(paypalPayload, addressForm)).to.be.an('object').that.has.all.keys(validateAddressFormKeys).include({ error: true });
        });

        it('should handle the case where form is not provided', () => {
            expect(addressHelper.validateShippingAddressForm(paypalPayload, null)).to.be.an('object').that.has.all.keys(validateAddressFormKeys).include({ error: true });
        });
    });

    describe('convertCheckoutOrdersPaypalAddress', () => {
        const convertCheckoutOrdersPaypalAddress = addressHelper.__get__('convertCheckoutOrdersPaypalAddress');

        it('should return an object with keys (line1, line2, city, state, postalCode, countryCode)', () => {
            const val = convertCheckoutOrdersPaypalAddress({
                address_line_1: '473 Wiseman Street',
                admin_area_1: 'TN',
                admin_area_2: 'Servierville',
                postal_code: '37862',
                country_code: 'US'
            });

            expect(val).to.be.an('object').that.has.all.keys(['line1', 'line2', 'city', 'state', 'postalCode', 'countryCode']);
        });
    });

    describe('prepareForCheckoutOrdersPaypalAddresses', () => {
        const prepareForCheckoutOrdersPaypalAddresses = addressHelper.__get__('prepareForCheckoutOrdersPaypalAddresses');

        it('should return a prepared structure of object (billingAddress, shippingAddress, phone, lastName, firstName)', () => {
            const val = prepareForCheckoutOrdersPaypalAddresses(paypalPayloadWithPurchaseUnits);

            expect(val).to.be.an('object').that.has.all.keys(['billingAddress', 'shippingAddress', 'phone', 'lastName', 'firstName']);
        });
    });

    describe('getFormAddress', () => {
        const getFormAddress = addressHelper.__get__('getFormAddress');

        it('should return an address form object', () => {
            expect(getFormAddress()).to.be.an('object').that.is.not.empty;
        });
    });

    describe('validateCheckoutOrdersPaypalAddresses', () => {
        before(() => {
            stub(dw.web.Resource, 'msg');

            dw.web.Resource.msg.withArgs('paypal.error.billing.address.invalid', 'paypalerrors', null).returns('billing address');
            dw.web.Resource.msg.withArgs('paypal.error.shipping.address.invalid', 'paypalerrors', null).returns('shipping address');

            addressValidator.returns({
                validate: () => ({}),
                setFieldsToNotValidate: () => {}
            });
        });

        after(() => {
            dw.web.Resource.msg.restore();
            addressValidator.reset();
        });

        it('should return an object with key "error" equal to false (validation success)', () => {
            expect(addressHelper.validateCheckoutOrdersPaypalAddresses(paypalPayloadWithPurchaseUnits)).to.be.an('object').include({ error: false });
        });

        it('should return an object with key "error" equal to false (skip validation)', () => {
            expect(addressHelper.validateCheckoutOrdersPaypalAddresses(paypalPayloadWithPurchaseUnits, false)).to.be.an('object').include({ error: false });
        });

        it('should return an object with key "error" equal to true (shipping address validation)', () => {
            addressValidator.returns({
                validate: () => ({ country: 'Fields is invalid' }),
                setFieldsToNotValidate: () => {}
            });

            const val = addressHelper.validateCheckoutOrdersPaypalAddresses(paypalPayloadWithPurchaseUnits);

            expect(val).to.be.an('object').that.has.all.keys(validateAddressFormKeys).deep.equal({
                error: true,
                errorName: 'shipping.address.invalid',
                fields: {
                    country: 'Fields is invalid'
                },
                message: 'shipping address'
            });
        });

        // Disabled for now
        /* it('should return an object with key "error" equal to true (billing address validation)', () => {
            stub(addressHelper, 'validateShippingAddressForm', () => ({ error: false }));

            const val = addressHelper.validateCheckoutOrdersPaypalAddresses(paypalPayloadWithPurchaseUnits);

            expect(val).to.be.an('object').that.has.all.keys(validateAddressFormKeys).deep.equal({
                error: true,
                errorName: 'billing.address.invalid',
                fields: {
                    country: 'Fields is invalid'
                },
                message: 'billing address'
            });

            addressHelper.validateShippingAddressForm.restore();
        }); */
    });

    describe('getPayPalShippingAddressErrorCodes', () => {
        const getPayPalShippingAddressErrorCodes = addressHelper.__get__('getPayPalShippingAddressErrorCodes');

        it('should return array with errors', () => {
            const errorObject = {
                country: 'country',
                stateCode: 'stateCode',
                postalCode: 'postalCode',
                generalError: 'general'
            };

            expect(getPayPalShippingAddressErrorCodes(errorObject)).to.be.deep.equal(['COUNTRY_ERROR', 'STATE_ERROR', 'ZIP_ERROR', 'ADDRESS_ERROR']);
        });
    });

    describe('validatePayPalShippingAddress ', () => {
        const validateAddressForm = stub();
        const getPayPalShippingAddressErrorCodes = stub();

        let originalValidateAddressFormFunction;

        before(() => {
            addressHelper.__set__('getFormAddress', () => {});
            addressHelper.__set__('getPayPalShippingAddressErrorCodes', getPayPalShippingAddressErrorCodes);
            originalValidateAddressFormFunction = addressHelper.validateAddressForm;
            addressHelper.validateAddressForm = validateAddressForm;
        });

        after(() => {
            addressHelper.__ResetDependency__('getFormAddress');
            addressHelper.__ResetDependency__('getPayPalShippingAddressErrorCodes');
            addressHelper.validateAddressForm = originalValidateAddressFormFunction;
        });

        it('should return object without errors if address is valid', () => {
            validateAddressForm.returns({});

            expect(addressHelper.validatePayPalShippingAddress({})).to.be.deep.equal({
                error: false
            });
        });

        it('should return object with error if address is not valid', () => {
            validateAddressForm.returns({
                ADDRESS_FORM_FIELD_COUNTRY: 'country'
            });
            getPayPalShippingAddressErrorCodes.returns(['COUNTRY_ERROR']);

            expect(addressHelper.validatePayPalShippingAddress({})).to.be.deep.equal({
                error: true,
                errorCodes: ['COUNTRY_ERROR']
            });
        });
    });

    describe('applyOnlinePickupShippingMethodToBasket', () => {
        const basket = {
            currencyCode: 'USD',
            defaultShipment: {
                setShippingMethod: () => {}
            }
        };

        before(() => {
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            dw.system.Transaction.wrap.restore();
        });

        it('applies the free shipping method to the basket according the basket currencyCode', () => {
            expect(addressHelper.applyOnlinePickupShippingMethodToBasket(basket)).to.be.undefined;
            expect(dw.system.Transaction.wrap.calledOnce).to.be.true;
        });
    });

    describe('compareShippingAddresses', () => {
        const address1 = {
            firstName: 'Paul',
            phone: '0123456789',
            shippingAddress: {
                city: 'Kyiv'
            }
        };

        const address2 = {
            firstName: 'Paul',
            phone: '0123456789',
            shippingAddress: {
                city: 'Lviv'
            }
        };

        it('true if addresses are the same', () => {
            expect(addressHelper.compareShippingAddresses(address1, address1)).to.be.true;
        });

        it('false if addresses are different', () => {
            expect(addressHelper.compareShippingAddresses(address1, address2)).to.be.false;
        });
    });

    describe('generateShippingAddressesPayloadFromAddressBook', () => {
        const addressBookAddress = {
            firstName: 'first_name',
            lastName: 'last_name',
            phone: 'phone',
            city: 'city',
            countryCode: {
                value: 'country_code'
            },
            stateCode: 'state',
            address1: 'line1',
            postalCode: 'postal_code'
        };

        const expectedObj = {
            firstName: 'first_name',
            lastName: 'last_name',
            phone: 'phone',
            shippingAddress: {
                city: 'city',
                countryCode: 'COUNTRY_CODE',
                state: 'state',
                line1: 'line1',
                postalCode: 'postal_code'
            }
        };

        it('must return a correct object', () => {
            expect(addressHelper.generateShippingAddressesPayloadFromAddressBook(addressBookAddress)).to.deep.equal(expectedObj);
        });
    });

    describe('getPreferredShippingAddressShortObj', () => {
        let realCustomer;

        before(() => {
            realCustomer = customer;

            customer = {
                addressBook: {
                    preferredAddress: {
                        city: 'city',
                        countryCode: {
                            value: 'country_code'
                        },
                        address1: 'address1',
                        phone: 'phone',
                        postalCode: 'postalCode',
                        fullName: 'fullName',
                        stateCode: 'stateCode'
                    }
                }
            };
        });

        after(() => {
            customer = realCustomer;
        });

        const expectedObj = {
            city: 'city',
            country_code: 'COUNTRY_CODE',
            line1: 'address1',
            phone: 'phone',
            postal_code: 'postalCode',
            recipient_name: 'fullName',
            state: 'stateCode'
        };

        it('must return a correct object', () => {
            expect(addressHelper.getPreferredShippingAddressShortObj()).to.deep.equal(expectedObj);
        });
    });

    describe('updateShippingAddress', () => {
        const currentBasket = {};
        const shippingAddress = {};
        const paymentInstrument = { custom: { paypalOrderID: null } };

        before(() => {
            stub(addressHelper, 'updateOrderShippingAddress');
        });

        after(() => {
            addressHelper.updateOrderShippingAddress.restore();
        });

        afterEach(() => {
            fakeHasOnlyGiftCertificates.reset();
        });

        it('should not update order shipping address', () => {
            paymentInstrument.custom.paypalOrderID = 'order-id';
            fakeHasOnlyGiftCertificates.returns(true);

            expect(addressHelper.updateShippingAddress(currentBasket, shippingAddress, paymentInstrument)).to.be.undefined;
            expect(addressHelper.updateOrderShippingAddress.calledOnce).to.be.false;
        });

        it('should update order shipping address', () => {
            paymentInstrument.custom.paypalOrderID = 'order-id';
            fakeHasOnlyGiftCertificates.returns(false);

            expect(addressHelper.updateShippingAddress(currentBasket, shippingAddress, paymentInstrument)).to.be.undefined;
            expect(addressHelper.updateOrderShippingAddress.calledOnce).to.be.true;
        });
    });

    describe('getBillingAddressFromForm', () => {
        it('should return properly formatted billing address object', () => {
            const form = {
                dwfrm_address_address1: 'Address line1',
                dwfrm_address_states_stateCode: 'Texas',
                dwfrm_address_city: 'City',
                dwfrm_address_postalCode: 'IO-315',
                dwfrm_address_country: 'US'
            };

            const result = addressHelper.getBillingAddressFromForm(form);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                address_line_1: 'Address line1',
                address_line_2: '',
                admin_area_1: 'Texas',
                admin_area_2: 'City',
                postal_code: 'IO-315',
                country_code: 'US'
            });
        });
    });

    describe('getBillingAddressToSave', () => {
        it('should return properly formatted billing address object', () => {
            const form = {
                dwfrm_address_firstName: 'First',
                dwfrm_address_lastName: 'Last',
                dwfrm_address_address1: 'Address line1',
                dwfrm_address_states_stateCode: 'Texas',
                dwfrm_address_city: 'City',
                dwfrm_address_postalCode: 'IO-315',
                dwfrm_address_country: 'US',
                dwfrm_address_phone: '000011110000'
            };

            const result = addressHelper.getBillingAddressToSave(form);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                firstName: 'First',
                lastName: 'Last',
                address1: 'Address line1',
                address2: '',
                city: 'City',
                stateCode: 'Texas',
                postalCode: 'IO-315',
                countryCode: { value: 'US' },
                phone: '000011110000'
            });
        });
    });

    describe('setAddressInPPAddressFormat', () => {
        const orderFlowResult = {
            country_code: 'US',
            admin_area_2: 'city',
            address_line_1: 'address1',
            address_line_2: 'address2',
            postal_code: '99999',
            admin_area_1: 'NY'
        };

        before(() => {
            customer.addressBook = { addresses: { empty: false } };
            getPreferredAddress.returns({
                getCountryCode: () => 'US',
                getCity: () => 'city',
                getAddress1: () => 'address1',
                getAddress2: () => 'address2',
                getPostalCode: () => '99999',
                getStateCode: () => 'NY',
                getFullName: () => 'Name',
                getPhone: () => 'phone'
            });
        });

        after(() => {
            getPreferredAddress.reset();
        });

        it('should return the following result if it\'s order flow', () => {
            expect(addressHelper.setAddressInPPAddressFormat({}, false)).to.deep.equal(orderFlowResult);
        });

        it('should throw error if address book is empty, e.g. case with logged-in user', () => {
            customer.addressBook.addresses.empty = true;
            expect(() => addressHelper.setAddressInPPAddressFormat({}, false)).to.throw();
        });

        it('should throw error if there\'s no address book, e.g. case with guest user', () => {
            customer.addressBook = null;
            expect(() => addressHelper.setAddressInPPAddressFormat({}, false)).to.throw();
        });
    });

    describe('updateOrderBillingAddressForDigitalGoodsFlow', () => {
        const originalSession = session;

        before(() => {
            session.privacy = { paypalOrderID: 'paypal-order-id' };
            paypalPreferences.isDigitalGoodsFlowEnabled = false;

            getOrderDetails.returns({ payer: {} });

            stub(addressHelper, 'updateOrderBillingAddress');
        });

        beforeEach(() => {
            getOrderDetails.resetHistory();
            addressHelper.updateOrderBillingAddress.resetHistory();
        });

        after(() => {
            session = originalSession;
            addressHelper.updateOrderBillingAddress.restore();
        });

        const currentBasket = { billingAddress: null };

        it('getOrderDetails is not called (condition 1)', () => {
            addressHelper.updateOrderBillingAddressForDigitalGoodsFlow(currentBasket);

            expect(getOrderDetails.notCalled).to.be.true;
            expect(addressHelper.updateOrderBillingAddress.notCalled).to.be.true;
        });

        it('getOrderDetails is not called (condition 2)', () => {
            currentBasket.billingAddress = { address1: '' };

            addressHelper.updateOrderBillingAddressForDigitalGoodsFlow(currentBasket);

            expect(getOrderDetails.notCalled).to.be.true;
            expect(addressHelper.updateOrderBillingAddress.notCalled).to.be.true;
        });

        it('should call getOrderDetails and updateOrderBillingAddress functions', () => {
            paypalPreferences.isDigitalGoodsFlowEnabled = true;

            addressHelper.updateOrderBillingAddressForDigitalGoodsFlow(currentBasket);

            expect(getOrderDetails.calledOnce).to.be.true;
            expect(addressHelper.updateOrderBillingAddress.calledOnce).to.be.true;
        });
    });

    describe('parseBillingAddress', () => {
        const googlePayBillingAddress = {
            countryCode: 'UA',
            address1: 'Akademika Pavlova str.',
            address2: '',
            administrativeArea: 'Kharkiv',
            locality: 'Kharkiv obl.',
            postalCode: '61000'
        };

        const paypalBillingAddress = {
            country_code: 'UA',
            address_line_1: 'Akademika Pavlova str.',
            address_line_2: '',
            admin_area_1: 'Kharkiv',
            admin_area_2: 'Kharkiv obl.',
            postal_code: '61000'
        };

        it('should convert Billing address', () => {
            expect(addressHelper.parseBillingAddress(googlePayBillingAddress))
                .to.deep.equal(paypalBillingAddress);
        });
    });
});

describe('setCustomerEmailToBasket', () => {
    const email = 'test@test.com';

    before(() => {
        stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
    });

    after(() => {
        dw.system.Transaction.wrap.restore();
    });

    afterEach(() => {
        mockBasket.customerEmail = null;
    });

    it('should set provided email to the basket', () => {
        addressHelper.setCustomerEmailToBasket(email, mockBasket);

        expect(mockBasket.customerEmail).to.equals(email);
        expect(dw.system.Transaction.wrap.calledOnce).to.be.true;
    });

    it('should set customer email from the customer profile in case if buyer is authenticated', () => {
        mockBasket.customer.authenticated = true;

        addressHelper.setCustomerEmailToBasket(email, mockBasket);

        expect(mockBasket.customerEmail).to.equals(mockBasket.customer.profile.email);
        expect(dw.system.Transaction.wrap.called).to.be.true;
    });

    it('should not set new email to the basket if email is presented in tbe basket', () => {
        mockBasket.customerEmail = 'test@test';

        addressHelper.setCustomerEmailToBasket(email, mockBasket);

        expect(mockBasket.customerEmail).to.equals('test@test');
    });
});

describe('formatPhoneNumberWithCountryCode', () => {
    const formatPhoneNumberWithCountryCode = addressHelper.__get__('formatPhoneNumberWithCountryCode');

    const phoneNumber = {
        national_number: '02025550162'
    };

    it ('should return phone number without country code', () => {
        expect(formatPhoneNumberWithCountryCode(phoneNumber)).to.equals(phoneNumber.national_number);
    });

    it ('should return phone number with country code', () => {
        phoneNumber.country_code = '1';

        expect(formatPhoneNumberWithCountryCode(phoneNumber)).to.equals(
            `+${phoneNumber.country_code}${phoneNumber.national_number}`
        );
    });
});
