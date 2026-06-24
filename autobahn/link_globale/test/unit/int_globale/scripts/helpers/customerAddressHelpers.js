'use strict';

var mockFactories = require('../../../../mock/factories/index');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);
var assert = chai.assert;

var customerAddressHelpers = mockFactories.scripts.helpers.customerAddressHelpers;

describe('scripts/helpers/customerAddressHelpers.js', function () {
    describe('updateCustomerAddress', function () {
        it('isFunction', function () {
            assert.isFunction(customerAddressHelpers.updateCustomerAddress);
        });

        it('should update provided address', function () {
            var customerAddress = require('../../../../mock/dw/customer/CustomerAddress');
            var geAddress = {
                Address1: 'Address1',
                Address2: 'Address2',
                City: 'City',
                Company: 'Company',
                CountryCode: 'CountryCode',
                FirstName: 'FirstName',
                LastName: 'LastName',
                MiddleName: 'MiddleName',
                Phone1: 'Phone1',
                Salutation: 'Salutation',
                StateCode: 'StateCode',
                ZipCode: 'ZipCode'
            };
            customerAddressHelpers.updateCustomerAddress(customerAddress, geAddress);

            assert.containSubset(customerAddress, {
                address1: 'Address1',
                address2: 'Address2',
                city: 'City',
                companyName: 'Company',
                countryCode: 'CountryCode',
                firstName: 'FirstName',
                lastName: 'LastName',
                secondName: 'MiddleName',
                phone: 'Phone1',
                salutation: 'Salutation',
                stateCode: 'StateCode',
                postalCode: 'ZipCode'
            });
        });
    });
});
