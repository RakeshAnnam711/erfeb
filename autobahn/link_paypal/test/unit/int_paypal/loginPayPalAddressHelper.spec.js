const { int_paypal: { loginPayPalAddressHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');
const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

const getShippingAddressFromHttpParameterMap = stub();

const payPalCustomerInfo = {
    name: 'firstName lastName',
    address: {
        postal_code: '32600',
        locality: 'Lviv',
        country: 'Ukraine',
        region: 'Zahid',
        street_address: 'address'
    }
};

const lippAddress = {
    address1: 'address1',
    city: 'city',
    countryCode: {
        value: 'value'
    },
    firstName: 'firstName',
    lastName: 'lastName',
    postalCode: 'postalCode',
    stateCode: 'stateCode',
    phone: 'phone',
    setPhone: () => {}
};

const loginPayPalAddressHelper = proxyquire(loginPayPalAddressHelperPath, {
    'dw/system/Transaction': dw.system.Transaction,
    'dw/web/Resource': {
        msg: () => '063957832'
    },
    '*/cartridge/scripts/paypal/helpers/addressHelper': {
        getShippingAddressFromHttpParameterMap
    },
    '*/cartridge/config/constants': {
        LOGIN_PAYPAL: 'login-PayPal'
    }
});

describe('loginPayPalAddressHelper file', () => {
    describe('getFullNameFromPayPal', () => {
        it('must return an array with firstName and lastName', () => {
            const funcCall = loginPayPalAddressHelper.getFullNameFromPayPal(payPalCustomerInfo);

            expect(funcCall).to.be.an('array');
            expect(funcCall).to.be.deep.equal(['firstName', 'lastName']);
        });
    });

    describe('getAddressObjectFromPayPal', () => {
        it('must return an object information of the customer', () => {
            const funcCall = loginPayPalAddressHelper.getAddressObjectFromPayPal(payPalCustomerInfo);

            expect(funcCall).to.be.an('object');
            expect(funcCall).to.be.deep.equal({
                id: 'login-PayPal - 32600',
                address1: 'address',
                city: 'Lviv',
                countryCode: payPalCustomerInfo.address.country,
                firstName: 'firstName',
                lastName: 'lastName',
                postalCode: payPalCustomerInfo.address.postal_code,
                stateCode: payPalCustomerInfo.address.region,
                phone: '063957832'
            });
        });
    });

    describe('getCWPPCustomerAddress', () => {
        it('must be null', () => {
            const address = {
                ID: 'id'
            };

            customer.addressBook = {
                getAddresses: () => ({
                    toArray: () => ({
                        find: (f) => {
                            f(address);
                        }
                    })
                })
            };

            const funcCall = loginPayPalAddressHelper.getCWPPCustomerAddress();

            expect(funcCall).to.be.null;
        });
    });

    describe('savePhoneNumberInCWPPAddress', () => {
        it('must be called', () => {
            const phoneNumber = '380639278920';

            expect(loginPayPalAddressHelper.savePhoneNumberInCWPPAddress(lippAddress, phoneNumber)).to.have.been.called;
        });
    });

    describe('isCWPPAddressUsedOnCheckoutPage', () => {
        it('if element match ', () => {
            const httpParameterMap = {};

            getShippingAddressFromHttpParameterMap.returns({ postalCode: 'postalCode' });

            expect(loginPayPalAddressHelper.isCWPPAddressUsedOnCheckoutPage.call({
                getCWPPCustomerAddress: () => true
            }, lippAddress, httpParameterMap)).to.be.true;
        });

        it('if element not match ', () => {
            const httpParameterMap = {};

            getShippingAddressFromHttpParameterMap.returns({ key: 'value' });

            expect(loginPayPalAddressHelper.isCWPPAddressUsedOnCheckoutPage(lippAddress, httpParameterMap)).to.be.false;
        });
    });
});
