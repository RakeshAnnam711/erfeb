const { int_paypal: { basicAddressHelpersPath } } = require('../path.json');

const { expect } = require('chai');
const { stub, spy } = require('sinon');
const { it, describe } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const preferences = {
    isDigitalGoodsFlowEnabled: false
};

const updateAddressFieldsMock = stub();

const addressHelpers = proxyquire(basicAddressHelpersPath, {
    'dw/system/Transaction': dw.system.Transaction,
    '*/cartridge/config/preferences': preferences
});

describe('addressHelpers file', () => {
    describe('saveAddress', () => {
        let customerMock;
        let addressBookMock;
        let addressMock;

        beforeEach(() => {
            addressMock = {
                setFirstName: spy(),
                setLastName: spy(),
                setAddress1: spy()
            };

            addressBookMock = {
                getAddress: stub(),
                createAddress: stub().returns(addressMock)
            };

            customerMock = {
                raw: {
                    getProfile: stub().returns({
                        getAddressBook: stub().returns(addressBookMock)
                    })
                }
            };

            preferences.isDigitalGoodsFlowEnabled = false;
            addressHelpers.updateAddressFields = updateAddressFieldsMock;
        });

        it('should return from function if isDigitalGoodsFlowEnabled = true', () => {
            preferences.isDigitalGoodsFlowEnabled = true;

            const args = { address: {}, customer: {}, addressId: '' };

            expect(addressHelpers.saveAddress(args.address, args.customer, args.addressId)).to.be.undefined;
            expect(addressHelpers.updateAddressFields.notCalled).to.be.true;
        });

        it('should create a new address if one does not exist', () => {
            const address = { firstName: 'John', lastName: 'Doe', address1: '123 Elm St' };
            const addressId = 'newAddressId';

            addressBookMock.getAddress.returns(null);

            addressHelpers.saveAddress(address, customerMock, addressId);

            expect(addressBookMock.createAddress.calledOnceWith(addressId)).to.be.true;
            expect(addressBookMock.getAddress.calledOnceWith(addressId)).to.be.true;
        });

        it('should update an existing address', () => {
            const address = { firstName: 'Jane', lastName: 'Doe', address1: '456 Oak St' };
            const addressId = 'existingAddressId';

            addressBookMock.getAddress.returns(addressMock);

            addressHelpers.saveAddress(address, customerMock, addressId);

            expect(addressBookMock.createAddress.notCalled).to.be.true;
            expect(addressBookMock.getAddress.calledOnceWith(addressId)).to.be.true;
        });
    });
});
