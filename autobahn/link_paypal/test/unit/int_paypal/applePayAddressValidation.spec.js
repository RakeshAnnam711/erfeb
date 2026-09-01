const { int_paypal: { applePayAddressValidationPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { describe, it } = require('mocha');

const applePayAddressValidation = proxyquire(applePayAddressValidationPath, {
    'dw/web/Resource': dw.web.Resource
});

const mockAddresses = {
    validShippingAddress: {
        city: 'New York',
        postalCode: '12345',
        countryCode: 'US'
    },
    invalidName: {
        name: 'John90',
        addressLines: '1st Avenue 10'
    },
    invalidAddressLines: {
        name: 'John',
        addressLines: '1st Avenue #^&10'
    },
    invalidShippingAddress: {
        city: '123',
        postalCode: 'abcde',
        countryCode: 'UK'
    },
    validBillingAddress: {
        phoneNumber: '123-456-7890',
        email: 'example@example.com',
        name: 'John Doe',
        addressLines: '123 Main St',
        locality: 'New York',
        postalCode: '12345',
        countryCode: 'US'
    },
    invalidPhoneNumber: {
        phoneNumber: 'invalid_phone_number',
        email: 'example@example.com',
        name: 'John Doe',
        addressLines: '123 Main St',
        locality: 'New York',
        postalCode: '12345',
        countryCode: 'US'
    },
    invalidEmail: {
        phoneNumber: '123-456-7890',
        email: 'example@example',
        name: 'John Doe',
        addressLines: '123 Main St',
        locality: 'New York',
        postalCode: '12345',
        countryCode: 'US'
    },
    invalidBillingName: {
        phoneNumber: '123-456-7890',
        email: 'example@example.com',
        name: '123',
        addressLines: '123 Main St',
        locality: 'New York',
        postalCode: '12345',
        countryCode: 'US'
    },
    invalidBillingAddressLines: {
        phoneNumber: '123-456-7890',
        email: 'example@example.com',
        name: 'John Doe',
        addressLines: '123 Main #St!',
        locality: 'New York',
        postalCode: '12345',
        countryCode: 'US'
    },
    invalidBillingLocality: {
        phoneNumber: '123-456-7890',
        email: 'example@example.com',
        name: 'John Doe',
        addressLines: '123 Main St',
        locality: 'New York 123',
        postalCode: '12345',
        countryCode: 'US'
    },
    invalidBillingPostalCode: {
        phoneNumber: '123-456-7890',
        email: 'example@example.com',
        name: 'John Doe',
        addressLines: '123 Main St',
        locality: 'New York',
        postalCode: '12',
        countryCode: 'US'
    },
    invalidBillingCountryCode: {
        phoneNumber: '123-456-7890',
        email: 'example@example.com',
        name: 'John Doe',
        addressLines: '123 Main St',
        locality: 'New York',
        postalCode: '12345',
        countryCode: 'UK'
    }
};

describe('applePayAddressValidation file', () => {
    describe('validateShippingAddress', () => {
        it('should have no errors for valid shipping address', () => {
            const result = applePayAddressValidation.validateShippingAddress(mockAddresses.validShippingAddress);

            expect(result.error).to.be.false;
            expect(result.errors.length === 0).to.be.true;
        });

        it('should return errors for invalid shipping address', () => {
            const result = applePayAddressValidation.validateShippingAddress(mockAddresses.invalidShippingAddress);

            expect(result.error).to.be.true;
            expect(result.errors.length === 3).to.be.true;
        });
    });

    describe('validateAddress', () => {
        it('should return errors for invalid name', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.validBillingAddress, mockAddresses.invalidName);

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'name').to.be.true;
        });

        it('should return errors for invalid addressLines', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.validBillingAddress, mockAddresses.invalidAddressLines);

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'addressLines').to.be.true;
        });

        it('should have no errors if no shipping address is passed and valid billing address is valid', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.validBillingAddress);

            expect(result.error).to.be.false;
            expect(result.errors.length === 0).to.be.true;
        });

        it('should have no errors for valid billing address', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.validBillingAddress, {});

            expect(result.error).to.be.false;
            expect(result.errors.length === 0).to.be.true;
        });

        it('should return errors for invalid billing phone number', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.invalidPhoneNumber, {});

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'phoneNumber').to.be.true;
        });

        it('should return errors for invalid billing email', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.invalidEmail, {});

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'emailAddress').to.be.true;
        });

        it('should return errors for invalid billing name', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.invalidBillingName, {});

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'name').to.be.true;
        });

        it('should return errors for invalid billing address lines', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.invalidBillingAddressLines, {});

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'addressLines').to.be.true;
        });

        it('should return errors for invalid billing locality', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.invalidBillingLocality, {});

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'locality').to.be.true;
        });

        it('should return errors for invalid billing postal code', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.invalidBillingPostalCode, {});

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'postalCode').to.be.true;
        });

        it('should return errors for invalid billing country code', () => {
            const result = applePayAddressValidation.validateAddress(mockAddresses.invalidBillingCountryCode, {});

            expect(result.error).to.be.true;
            expect(result.errors.length === 1).to.be.true;
            expect(result.errors[0].contactField === 'countryCode').to.be.true;
        });
    });
});
