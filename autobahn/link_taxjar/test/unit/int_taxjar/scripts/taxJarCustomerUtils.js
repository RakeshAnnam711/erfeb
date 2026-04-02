/* global describe, it */

var assert = require('chai').assert;
var Customer = require('../../../mocks/dw/customer/Customer');

var TaxJarCustomerUtils = require('../../../../cartridges/int_taxjar/cartridge/scripts/taxJarCustomerUtils');

describe('taxJarCustomerUtils', function () {
    describe('getCustomerTaxExemptionType', function () {
        it('should return a wholesale exemption type string', function () {
            var customer = new Customer();
            var exemptionType = TaxJarCustomerUtils.getCustomerTaxExemptionType(customer);
            assert.equal(exemptionType, 'wholesale');
        });

        it('should return null when customer profile does not exist (guest checkout)', function () {
            var customer = new Customer();
            customer.profile = null;
            var exemptionType = TaxJarCustomerUtils.getCustomerTaxExemptionType(customer);
            assert.equal(exemptionType, null);
        });
    });

    describe('getCustomerExemptionRegions', function () {
        it('should return array of exempt regions', function () {
            var customer = new Customer();
            var exemptRegions = TaxJarCustomerUtils.getCustomerExemptionRegions(customer);
            assert.deepEqual(exemptRegions, ['UT', 'CO']);
        });

        it('should return an empty array when profile is not set (guest checkout)', function () {
            var customer = new Customer();
            customer.profile = null;
            var exemptRegions = TaxJarCustomerUtils.getCustomerExemptionRegions(customer);
            assert.deepEqual(exemptRegions, []);
        });

        it('should return an empty array when no exempt regions are set', function () {
            var customer = new Customer();
            customer.profile.custom.TaxJarCustomerExemptionRegions = [];
            var exemptRegions = TaxJarCustomerUtils.getCustomerExemptionRegions(customer);
            assert.deepEqual(exemptRegions, []);
        });
    });

    describe('getCustomerExemptionTypeForRegion', function () {
        it('should return exemption type when exemption type is set and state is an exempt region', function () {
            var customer = new Customer();
            var exemptionType = TaxJarCustomerUtils.getCustomerExemptionTypeForRegion(customer, 'US', 'CO');
            assert.equal(exemptionType, 'wholesale');
        });

        it('should return null when state is not an exemption region and there are exempt regions set', function () {
            var customer = new Customer();
            var exemptionType = TaxJarCustomerUtils.getCustomerExemptionTypeForRegion(customer, 'US', 'NY');
            assert.equal(exemptionType, null);
        });

        it('should return null when country is not US', function () {
            var customer = new Customer();
            var exemptionType = TaxJarCustomerUtils.getCustomerExemptionTypeForRegion(customer, 'CA', 'UT');
            assert.equal(exemptionType, null);
        });

        it('should return customer exemption type for every state when no exemption regions are set', function () {
            var customer = new Customer();
            customer.profile.custom.TaxJarCustomerExemptionRegions = [];
            var exemptionType = TaxJarCustomerUtils.getCustomerExemptionTypeForRegion(customer, 'US', 'UT');
            assert.equal(exemptionType, 'wholesale');
        });
    });
});
