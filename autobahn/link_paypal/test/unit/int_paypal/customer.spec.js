/* eslint-disable object-curly-newline */

const { int_paypal: { customerPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const { it, describe, before, after, afterEach } = require('mocha');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const proxyquire = require('proxyquire').noCallThru();

const sendEmail = stub();
const setAddress1 = stub();
const setCity = stub();
const setCountryCode = stub();
const setFirstName = stub();
const setLastName = stub();
const setPostalCode = stub();
const setStateCode = stub();
const setPhone = stub();

const customer = {
    profile: {
        preferredLocale: 'UA',
        setEmail: () => {},
        setLastName: () => {},
        setFirstName: () => {},
        setPhoneHome: () => {},
        authenticationProviderID: 'PayPal',
        customer: {
            externallyAuthenticated: true,
            externalProfiles: {
                toArray: () => [customer.profile]
            }
        },
        custom: {
            flashMessages: null,
            isDisabledFeatureAPMA: false,
            isExternalProfile: 'Value'
        },
        addressBook: {
            addresses: {
                toArray: () => {
                    return [{ value: 'value', location: 'location' }];
                }
            },
            createAddress: () => ({
                setAddress1,
                setCity,
                setCountryCode,
                setFirstName,
                setLastName,
                setPostalCode,
                setStateCode,
                setPhone
            })
        }
    }
};

const CustomerMgr = {
    getCustomerByLogin: () => {},
    getCustomerByCustomerNumber: () => {},
    getCustomerByToken: () => {},
    createCustomer: () => customer,
    searchProfiles: () => ({
        asList: () => ({
            toArray: () => [customer.profile]
        })
    }),
    passwordConstraints: {
        minLength: 8
    }
};

const CustomerModel = proxyquire(customerPath, {
    'dw/customer/CustomerMgr': CustomerMgr,
    'dw/web/Resource': {
        msg: () => {},
        msgf: () => {}
    },
    'dw/system/Site': {
        current: {
            getCustomPreferenceValue: () => {}
        }
    },
    'dw/web/URLUtils': {
        https: () => {}
    },
    '*/cartridge/scripts/helpers/emailHelpers': {
        sendEmail: sendEmail
    },
    '*/cartridge/config/preferences': {
        customerServiceEmail: 'no-reply@testorganization.com'
    },
    'dw.customer.Customer': customer,
    '*/cartridge/config/constants': {
        FLASH_MESSAGE_SUCCESS: 'success',
        FLASH_MESSAGE_INFO: 'info',
        FLASH_MESSAGE_DANGER: 'danger',
        FLASH_MESSAGE_WARNING: 'warning'
    },
    'dw/order/BasketMgr': dw.order.BasketMgr,
    '*/cartridge/scripts/cart/cartHelpers': { addProductToCart: () => {} },
    '*/cartridge/scripts/checkout/shippingHelpers': { selectShippingMethod: () => {} },
    '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: () => {} },
    '*/cartridge/scripts/util/basicHelpers': {
        generateRandomNumber: () => {}
    },
    '*/cartridge/scripts/paypal/utils': {
        addFlashMessagesCustomAttribute: () => {}
    }

});

const obj = new CustomerModel(customer);

describe('customer file', () => {
    describe('CustomerModel constructor', () => {
        it('should be a function', () => {
            expect(CustomerModel).to.be.a('function');
        });

        it('should return an object', () => {
            expect(obj).to.be.a('object');
        });
    });

    describe('setEmail function', () => {
        it('should be a function', () => {
            expect(obj.setEmail).to.be.a('function');
        });

        it('should return an object', () => {
            expect(obj.setEmail()).to.be.an('object');
        });
    });

    describe('setFirstName function', () => {
        it('should be a function', () => {
            expect(obj.setFirstName).to.be.a('function');
        });

        it('should return an object', () => {
            expect(obj.setFirstName()).to.be.an('object');
        });
    });

    describe('setLastName function', () => {
        it('should be a function', () => {
            expect(obj.setLastName).to.be.a('function');
        });

        it('should return an object', () => {
            expect(obj.setLastName()).to.be.an('object');
        });
    });

    describe('setPhone function', () => {
        it('should be a function', () => {
            expect(obj.setPhone).to.be.a('function');
        });

        it('should return an object', () => {
            expect(obj.setPhone()).to.be.an('object');
        });

        it('should call binded function', () => {
            const setPhoneHome = stub();

            obj.setPhone.call({ dw: { profile: { setPhoneHome } } });

            expect(setPhoneHome.calledOnce).to.be.true;
        });
    });

    describe('setIsExternalProfile function', () => {
        it('should be a function', () => {
            expect(obj.setIsExternalProfile).to.be.a('function');
        });

        it('should return an object', () => {
            expect(obj.setIsExternalProfile()).to.be.an('object');
        });

        it('should set External Profile', () => {
            const result = obj.setIsExternalProfile(true);

            expect(result.dw.profile.custom.isExternalProfile).to.be.true;
        });
    });

    describe('getPreferredLocale function', () => {
        it('should be a function', () => {
            expect(obj.getPreferredLocale).to.be.a('function');
        });

        it('should return a null', () => {
            customer.profile.preferredLocale = null;
            expect(obj.getPreferredLocale()).to.be.a('null');
        });

        it('should return a locale', () => {
            customer.profile.preferredLocale = 'UA';
            expect(obj.getPreferredLocale()).to.equal('UA');
        });
    });

    describe('sendEmail function', () => {
        it('should be a function and return an object', () => {
            expect(obj.sendEmail).to.be.a('function');
            expect(obj.sendEmail()).to.be.an('object');
            expect(sendEmail.calledOnce).to.be.true;
        });
    });

    describe('sendRegistrationEmail function', () => {
        before(() => {
            stub(obj, 'sendEmail');
            CustomerModel.__set__('getPasswordResetToken', () => 'reset-token');
        });

        after(() => {
            obj.sendEmail.restore();
            CustomerModel.__ResetDependency__('getPasswordResetToken');
        });

        it('should be a function and return an object', () => {
            expect(obj.sendRegistrationEmail).to.be.a('function');
            expect(obj.sendRegistrationEmail()).to.be.an('object');
            expect(obj.sendEmail.calledOnce).to.be.true;
        });
    });

    describe('sendLinkedAccountConfirmationEmail function', () => {
        before(() => {
            stub(obj, 'sendEmail');
        });

        after(() => {
            obj.sendEmail.restore();
        });

        it('should be a function and return an object', () => {
            expect(obj.sendLinkedAccountConfirmationEmail).to.be.a('function');
            expect(obj.sendLinkedAccountConfirmationEmail()).to.be.an('object');
            expect(obj.sendEmail.calledOnce).to.be.true;
        });
    });

    describe('sendUnlinkedAccountConfirmationEmail function', () => {
        before(() => {
            stub(obj, 'sendEmail');
        });

        after(() => {
            obj.sendEmail.restore();
        });

        it('should be a function and return an object', () => {
            expect(obj.sendUnlinkedAccountConfirmationEmail).to.be.a('function');
            expect(obj.sendUnlinkedAccountConfirmationEmail()).to.be.an('object');
            expect(obj.sendEmail.calledOnce).to.be.true;
        });
    });

    describe('addFlashMessage function', () => {
        it('should be a function', () => {
            expect(obj.addFlashMessage).to.be.a('function');
        });

        it('should return an object', () => {
            expect(obj.addFlashMessage()).to.be.an('object');
        });
    });

    describe('pullFlashMessages function', () => {
        it('should be a function', () => {
            expect(obj.pullFlashMessages).to.be.a('function');
        });

        it('should return an array', () => {
            customer.profile.custom.flashMessages = null;
            expect(obj.pullFlashMessages()).to.be.an('array');
        });
    });

    describe('isEnabledFeatureAPMA function', () => {
        it('should be a function', () => {
            expect(obj.isEnabledFeatureAPMA).to.be.a('function');
        });

        it('should return true', () => {
            expect(obj.isEnabledFeatureAPMA()).to.be.true;
        });
    });

    describe('disableFeatureAPMA function', () => {
        it('should be a function', () => {
            expect(obj.disableFeatureAPMA).to.be.a('function');
        });

        it('should disable APMA', () => {
            const result = obj.disableFeatureAPMA();

            expect(result.dw.profile.custom.isDisabledFeatureAPMA).to.be.true;
        });
    });

    describe('hasAddress function', () => {
        const wrongAddressObject = { value: 'fake-value', location: 'loc' };
        const rightAddressObject = { value: 'value', location: 'location' };

        it('should be a function', () => {
            expect(obj.hasAddress).to.be.a('function');
        });

        it('should return false', () => {
            expect(obj.hasAddress(wrongAddressObject)).to.be.false;
        });

        it('should return true', () => {
            expect(obj.hasAddress(rightAddressObject)).to.be.true;
        });
    });

    describe('addAddress function', () => {
        const addressObject = {
            address1: 'address1',
            city: 'city',
            countryCode: 'countryCode',
            firstName: 'firstName',
            lastName: 'lastName',
            postalCode: 'postalCode',
            stateCode: 'stateCode',
            phone: 'phone'
        };

        it('should be a function', () => {
            expect(obj.addAddress).to.be.a('function');
        });

        it('should call all necessary functions and return object', () => {
            const result = obj.addAddress(addressObject);

            expect(result).to.be.an('object');

            expect(setAddress1.calledOnce).to.be.true;
            expect(setAddress1.calledWith(addressObject.address1)).to.be.true;

            expect(setCity.calledOnce).to.be.true;
            expect(setCity.calledWith(addressObject.city)).to.be.true;

            expect(setCountryCode.calledOnce).to.be.true;
            expect(setCountryCode.calledWith(addressObject.countryCode)).to.be.true;

            expect(setFirstName.calledOnce).to.be.true;
            expect(setFirstName.calledWith(addressObject.firstName)).to.be.true;

            expect(setLastName.calledOnce).to.be.true;
            expect(setLastName.calledWith(addressObject.lastName)).to.be.true;

            expect(setPostalCode.calledOnce).to.be.true;
            expect(setPostalCode.calledWith(addressObject.postalCode)).to.be.true;

            expect(setStateCode.calledOnce).to.be.true;
            expect(setStateCode.calledWith(addressObject.stateCode)).to.be.true;

            expect(setPhone.calledOnce).to.be.true;
            expect(setPhone.calledWith(addressObject.phone)).to.be.true;
        });
    });

    describe('restoreBasket function', () => {
        const guestBasket = {
            productLineItems: {
                toArray: () => ([
                    {
                        bonusProductLineItem: {}
                    },
                    {
                        bundledProductLineItems: {
                            toArray: () => [{
                                productID: 'p-id',
                                quantityValue: 5
                            }]
                        },
                        optionProductLineItems: {
                            toArray: () => [{
                                optionID: 'o-id',
                                optionValueID: 's-id'
                            }]
                        }
                    }
                ])
            },
            couponLineItems: {
                toArray: () => [{
                    couponCode: 'code',
                    basedOnCampaign: 'campaign'
                }]
            },
            defaultShipment: { shippingMethodID: 'shippingMethodID' }
        };

        before(() => {
            stub(dw.order.BasketMgr, 'getCurrentBasket');
            stub(dw.order.BasketMgr, 'deleteBasket');
            stub(dw.order.BasketMgr, 'getCurrentOrNewBasket');
        });

        after(() => {
            dw.order.BasketMgr.getCurrentBasket.restore();
            dw.order.BasketMgr.deleteBasket.restore();
            dw.order.BasketMgr.getCurrentOrNewBasket.restore();
        });

        afterEach(() => {
            dw.order.BasketMgr.getCurrentBasket.reset();
            dw.order.BasketMgr.deleteBasket.reset();
            dw.order.BasketMgr.getCurrentOrNewBasket.reset();
        });

        it('should delete current basket and create new one from guest basket', () => {
            dw.order.BasketMgr.getCurrentBasket.returns({});
            dw.order.BasketMgr.getCurrentOrNewBasket.returns({
                createCouponLineItem: () => {}
            });

            const result = obj.restoreBasket(guestBasket);

            expect(result).to.be.an('object');

            expect(dw.order.BasketMgr.deleteBasket.calledOnce).to.be.true;
        });

        it('should leave current basket and createCouponLineItem should throw error', () => {
            dw.order.BasketMgr.getCurrentBasket.returns();
            dw.order.BasketMgr.getCurrentOrNewBasket.returns({
                createCouponLineItem: () => {
                    throw Error;
                }
            });

            const result = obj.restoreBasket(guestBasket);

            expect(result).to.be.an('object');

            expect(dw.order.BasketMgr.deleteBasket.calledOnce).to.be.false;
        });
    });

    describe('isExternalProfile function', () => {
        it('should be a function', () => {
            expect(obj.isExternalProfile).to.be.a('function');
        });

        it('should isExternalProfile return true', () => {
            expect(obj.isExternalProfile()).to.be.true;
        });
    });

    describe('CustomerModel get function', () => {
        it('should be a function', () => {
            expect(CustomerModel.get).to.be.a('function');
        });

        it('should return a null', () => {
            expect(CustomerModel.get()).to.be.a('null');
        });

        it('should return an object', () => {
            CustomerMgr.getCustomerByLogin = () => customer;
            expect(CustomerModel.get()).to.be.an('object');
        });
    });

    describe('CustomerModel create function', () => {
        it('should be a function', () => {
            expect(CustomerModel.create).to.be.a('function');
        });

        describe('if there is no login and password', () => {
            it('should return an object', () => {
                expect(CustomerModel.create()).to.be.an('object');
            });
        });

        describe('if there is login and password', () => {
            const login = 'test@test.mail';
            const password = 'password';

            it('should return an object', () => {
                expect(CustomerModel.create(login, password, 1)).to.be.an('object');
            });
        });

        describe('if there is no customer', () => {
            it('should return a null', () => {
                CustomerMgr.createCustomer = () => {};
                CustomerMgr.passwordConstraints.minLength = null;
                expect(CustomerModel.create()).to.be.a('null');
            });
        });
    });

    describe('CustomerModel externalProfileExist function', () => {
        it('should be a function', () => {
            expect(CustomerModel.externalProfileExist).to.be.a('function');
        });

        it('should return a true', () => {
            expect(CustomerModel.externalProfileExist()).to.be.true;
        });

        it('should return a false', () => {
            customer.profile.customer.externallyAuthenticated = false;
            expect(CustomerModel.externalProfileExist()).to.be.false;
        });
    });

    describe('getPasswordResetToken', () => {
        const getPasswordResetToken = CustomerModel.__get__('getPasswordResetToken');

        const customerExample = {
            profile: {
                credentials: {
                    createResetPasswordToken: stub().returns('abc123')
                }
            }
        };

        it('should return a password reset token', () => {
            expect(getPasswordResetToken(customerExample)).to.equal('abc123');
            expect(customerExample.profile.credentials.createResetPasswordToken.calledOnce).to.be.true;
        });
    });
});
