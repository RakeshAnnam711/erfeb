const { int_paypal: { addressValidatorPath } } = require('../path.json');

const {
    it, describe,
    before, after
} = require('mocha');

const { expect } = require('chai');
const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const AddressValidator = proxyquire(addressValidatorPath, {
    'dw/web/Resource': dw.web.Resource,
    '*/cartridge/scripts/formErrors': {
        getFormErrors: function(form) {
            return {
                form: form.error
            };
        }
    }
});

describe('addressValidator file', () => {
    let addressValidator;
    let form = {
        valid: true,
        error: null,
        internalFormGroup: {
            formType: 'formGroup',
            htmlName: 'dwfrm_billing',
            internalFormField: {
                valid: true,
                formType: 'formField',
                mandatory: true,
                maxLength: 100,
                minLength: 1,
                regEx: /[0-9a-zA-Z]/,
                htmlValue: '123ABCabc'
            }
        }
    };

    describe('setFieldsToNotValidate', () => {
        it('should set value from argument to fieldsToNotValidate property if type is array', () => {
            addressValidator = new AddressValidator({});

            addressValidator.setFieldsToNotValidate(['phone']);

            expect(addressValidator.fieldsToNotValidate).to.deep.equal(['phone']);
        });

        it('should leave default value for fieldsToNotValidate property if type is not an array', () => {
            addressValidator = new AddressValidator({});

            addressValidator.setFieldsToNotValidate(12345);
            expect(addressValidator.fieldsToNotValidate).to.deep.equal([]);

            addressValidator.setFieldsToNotValidate('test');
            expect(addressValidator.fieldsToNotValidate).to.deep.equal([]);

            addressValidator.setFieldsToNotValidate(true);
            expect(addressValidator.fieldsToNotValidate).to.deep.equal([]);

            addressValidator.setFieldsToNotValidate({});
            expect(addressValidator.fieldsToNotValidate).to.deep.equal([]);

            addressValidator.setFieldsToNotValidate(null);
            expect(addressValidator.fieldsToNotValidate).to.deep.equal([]);

            addressValidator.setFieldsToNotValidate(undefined);
            expect(addressValidator.fieldsToNotValidate).to.deep.equal([]);
        });
    });

    describe('validate', () => {
        const errorMsg = 'paypal.error.validate.field.failure';

        before(() => {
            stub(dw.web.Resource, 'msg');
        });

        beforeEach(() => {
            form = {
                valid: true,
                error: null,
                html1: {
                    formType: 'formGroup',
                    htmlName: 'dwfrm_billing',
                    html2: {
                        options: [
                            { value: '123ABCabc' },
                            { value: '321zbcABC' }
                        ],
                        valid: true,
                        formType: 'formField',
                        mandatory: true,
                        maxLength: 100,
                        minLength: 1,
                        regEx: /^[0-9a-zA-Z]/,
                        htmlValue: '123ABCabc'
                    }
                }
            };
            dw.web.Resource.msg.withArgs(errorMsg, 'paypalerrors', null).returns(errorMsg);
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('should return null without errors', () => {
            addressValidator = new AddressValidator(form);

            expect(addressValidator.validate()).to.deep.equal({ form: null });
            expect(form.html1.html2.valid).to.be.true;
            expect(form.valid).to.be.true;
        });

        it('should return null without errors if not contain formGroup', () => {
            form.html1 = form.html1.html2;
            form.html1.html2 = null;
            addressValidator = new AddressValidator(form);

            expect(addressValidator.validate()).to.deep.equal({ form: null });

            expect(form.html1.valid).to.be.true;
            expect(form.valid).to.be.true;
        });

        it('should set valid false if value is bigger than maxLength', () => {
            form.html1.html2.maxLength = 1;
            addressValidator = new AddressValidator(form);
            addressValidator.validate();

            expect(form.html1.html2.valid).to.be.false;
            expect(form.valid).to.be.false;
        });

        it('should set valid false if minLength is bigger than value', () => {
            form.html1.html2.minLength = 100;
            addressValidator = new AddressValidator(form);
            addressValidator.validate();

            expect(form.html1.html2.valid).to.be.false;
            expect(form.valid).to.be.false;
        });

        it('should set valid false if value is not valid for regEx', () => {
            form.html1.html2.regEx = /^[A-Z]/;
            addressValidator = new AddressValidator(form);
            addressValidator.validate();

            expect(form.html1.html2.valid).to.be.false;
            expect(form.valid).to.be.false;
        });

        it('should set valid false if value is empty', () => {
            form.html1.html2.htmlValue = '';
            addressValidator = new AddressValidator(form);
            addressValidator.validate();

            expect(form.html1.html2.valid).to.be.false;
            expect(form.valid).to.be.false;
        });

        it('should set valid true if option is empty', () => {
            form.html1.html2.options = [];
            addressValidator = new AddressValidator(form);
            addressValidator.validate();

            expect(form.html1.html2.valid).to.be.true;
            expect(form.valid).to.be.true;
        });

        it('should set valid false if option is not contain value', () => {
            form.html1.html2.options = ['321zbcABC'];
            addressValidator = new AddressValidator(form);
            addressValidator.validate();

            expect(form.html1.html2.valid).to.be.false;
            expect(form.valid).to.be.false;
        });

        it('should throw error', () => {
            form.html1.html2.htmlValue = '';
            dw.web.Resource.msg.withArgs('paypal.error.validate.field.failure', 'paypalerrors', null).throws(Error);
            addressValidator = new AddressValidator(form);

            expect(() => addressValidator.validate()).to.throws(Error);
        });
    });
});
