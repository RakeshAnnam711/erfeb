const { bm_paypal: { migrateBillingAgreementPath } } = require('../path.json');
const { expect } = require('chai');
const { stub } = require('sinon');
const {
    it, describe, before, after, afterEach
} = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const fakeClose = stub();
const fakeAddAlert = stub();
const fakeWriteNext = stub();
const fakeRemoveAlert = stub();
const fakeQuerySystemObjects = stub();
const fakeCreatePaymentToken = stub();

const migrateBillingAgreement = proxyquire(migrateBillingAgreementPath, {
    'dw/io/File': dw.io.File,
    'dw/alert/Alerts': {
        addAlert: fakeAddAlert,
        removeAlert: fakeRemoveAlert
    },
    'dw/io/FileWriter': dw.io.FileWriter,
    'dw/system/Transaction': dw.system.Transaction,
    'dw/io/CSVStreamWriter': function() {
        return {
            close: fakeClose,
            writeNext: fakeWriteNext
        };
    },
    'dw/object/SystemObjectMgr': {
        querySystemObjects: fakeQuerySystemObjects
    },
    '~/cartridge/scripts/paypal/api/paypal': {
        createPaymentToken: fakeCreatePaymentToken
    },
    '~/cartridge/config/constants': {
        BA_TOKEN_TYPE: 'BILLING-AGREEMENT',
        PAYMENT_METHOD_ID_PAYPAL: 'PayPal'
    }
});

describe('migrateBillingAgreement file', () => {
    describe('beforeStep', () => {
        before(() => {
            fakeQuerySystemObjects.returns({
                getCount: () => 1,
                next: () => ({ custom: {} }),
                hasNext: stub().onFirstCall().returns(true).onSecondCall().returns(false)
            });
        });

        after(() => {
            fakeQuerySystemObjects.reset();
        });

        it('should execute query for customer profiles and return properly formatted result', () => {
            migrateBillingAgreement.beforeStep();

            const customerProfiles = migrateBillingAgreement.__get__('customerProfiles');

            expect(customerProfiles).to.be.an('object');
            expect(customerProfiles).to.have.all.keys('getCount', 'next', 'hasNext');

            expect(fakeQuerySystemObjects.calledOnce).to.be.true;
            expect(fakeQuerySystemObjects.calledWithExactly('Profile', 'custom.PP_API_billingAgreement LIKE {0}', 'customerNo desc', '[*')).to.be.true;
        });
    });

    describe('getTotalCount', () => {
        it('should return the total count of customer profiles retrieved in before step', () => {
            const result = migrateBillingAgreement.getTotalCount();

            expect(result).to.equal(1);
        });
    });

    describe('read', () => {
        it('should return customer profile on the first call', () => {
            const result = migrateBillingAgreement.read();

            expect(result).to.be.an('object');
            expect(result).to.haveOwnProperty('custom');
        });

        it('should return undefined on the second call', () => {
            expect(migrateBillingAgreement.read()).to.be.undefined;
        });
    });

    describe('process', () => {
        it('should successfully process all profile payment instrument', () => {
            fakeCreatePaymentToken
                .onFirstCall()
                .returns({
                    id: 'vaoekqm',
                    customer: { id: 'oorfkwdas' },
                    payment_source: {
                        paypal: {
                            address: {
                                countryCode: 'US'
                            },
                            name: {
                                given_name: 'Joe',
                                surname: 'Doe'
                            },
                            email_address: 'email',
                            phone: {
                                phone_number: { national_number: '031358419354' }
                            }
                        }
                    }
                })
                .onSecondCall()
                .returns({
                    id: 'uroqksma',
                    customer: { id: 'oorfkwdas' },
                    payment_source: {
                        paypal: {
                            address: {
                                countryCode: 'US'
                            },
                            name: {
                                given_name: 'Joe',
                                surname: 'Doe'
                            },
                            email_address: 'testemail'
                        }
                    }
                });

            const testProfile = {
                payPalCustomerId: 'oorfkwdas',
                custom: {
                    PP_API_billingAgreement: JSON.stringify([
                        { baID: 'AO-AOMODSPQKDAMQO' },
                        { baID: 'UE-KOEPQFMNFEWQOK' }
                    ])
                }
            };

            const result = migrateBillingAgreement.process(testProfile);

            expect(result).to.be.an('object');
            expect(result.profile.custom.PP_API_billingAgreement).to.be.null;
            expect(result.conversionsResult).to.be.an('array');
            expect(result.conversionsResult).to.deep.equal([
                {
                    vaultId: 'vaoekqm',
                    payPalCustomerId: 'oorfkwdas',
                    billingAddress: {
                        given_name: 'Joe',
                        surname: 'Doe',
                        countryCode: 'US',
                        national_number: '031358419354'
                    },
                    email: 'email'
                },
                {
                    vaultId: 'uroqksma',
                    payPalCustomerId: 'oorfkwdas',
                    billingAddress: {
                        given_name: 'Joe',
                        surname: 'Doe',
                        countryCode: 'US'
                    },
                    email: 'testemail'
                }
            ]);
        });

        it('should unsuccessfully process all profile payment instrument', () => {
            fakeCreatePaymentToken.returns({
                error: 'Provided resource id does not exist.'
            });

            const testProfile = {
                payPalCustomerId: 'oorfkwdas',
                custom: {
                    PP_API_billingAgreement: JSON.stringify([
                        { baID: 'AO-AOMODSPQKDAMQO' },
                        { baID: 'UE-KOEPQFMNFEWQOK' }
                    ])
                }
            };

            const result = migrateBillingAgreement.process(testProfile);

            expect(result).to.be.an('object');
            expect(result.profile.custom.PP_API_billingAgreement).to.equal(JSON.stringify([
                { baID: 'AO-AOMODSPQKDAMQO' },
                { baID: 'UE-KOEPQFMNFEWQOK' }
            ]));
            expect(result.conversionsResult).to.be.an('array');
            expect(result.conversionsResult).to.deep.equal([
                {
                    baID: 'AO-AOMODSPQKDAMQO',
                    errorMessage: 'Provided resource id does not exist.'
                },
                {
                    baID: 'UE-KOEPQFMNFEWQOK',
                    errorMessage: 'Provided resource id does not exist.'
                }
            ]);
        });
    });

    describe('write', () => {
        afterEach(() => {
            migrateBillingAgreement.__ResetDependency__('numberOfNotConvertedBAIds');
        });

        it('should not create file when all BA Ids successfully converted', () => {
            migrateBillingAgreement.__set__('numberOfNotConvertedBAIds', 0);

            const paymentInstrument = {
                setCreditCardType: () => {},
                custom: {}
            };

            const testBillingAddress = {
                given_name: 'Joe',
                surname: 'Doe',
                countryCode: 'US',
                national_number: '031358419354'
            };

            const lines = {
                toArray: () => [
                    {
                        profile: {
                            wallet: {
                                createPaymentInstrument: () => paymentInstrument
                            },
                            custom: {}
                        },
                        conversionsResult: [
                            {
                                vaultId: 'vaoekqm',
                                payPalCustomerId: 'oorfkwdas',
                                billingAddress: testBillingAddress,
                                email: 'email'
                            }
                        ]
                    }
                ]
            };

            migrateBillingAgreement.write(lines);

            expect(paymentInstrument.custom.currentPaypalEmail).to.equal('email');
            expect(paymentInstrument.custom.paypalBillingAddress).to.equal(JSON.stringify(testBillingAddress));
            expect(paymentInstrument.creditCardToken).to.equal('vaoekqm');
        });

        it('should create conversion result file with results of conversion', () => {
            migrateBillingAgreement.__set__('numberOfNotConvertedBAIds', 1);

            const paymentInstrument = {
                setCreditCardType: () => {},
                custom: {}
            };

            const testBillingAddress = {
                given_name: 'Joe',
                surname: 'Doe',
                countryCode: 'US',
                national_number: '031358419354'
            };

            const lines = {
                toArray: () => [
                    {
                        profile: {
                            wallet: {
                                createPaymentInstrument: () => paymentInstrument
                            },
                            custom: {
                                payPalCustomerId: 'oorfkwdas'
                            }
                        },
                        conversionsResult: [
                            {
                                vaultId: 'uroqksma',
                                payPalCustomerId: 'oorfkwdas',
                                billingAddress: testBillingAddress,
                                email: 'testemail'
                            }
                        ]
                    },
                    {
                        profile: {
                            customer: { ID: '1' }
                        },
                        conversionsResult: [
                            {
                                baID: 'UA-INEQDMKAOWKDQMW',
                                errorMessage: 'Provided resource id does not exist.'
                            }
                        ]
                    }
                ]
            };

            const params = {
                file: {
                    directory: 'directory',
                    name: 'name'
                }
            };

            migrateBillingAgreement.write(lines, params);

            expect(fakeWriteNext.calledTwice).to.be.true;
        });
    });

    describe('afterStep', () => {
        afterEach(() => {
            fakeClose.reset();
            fakeAddAlert.reset();
            fakeRemoveAlert.reset();

            migrateBillingAgreement.__ResetDependency__('numberOfNotConvertedBAIds');
        });

        it('should not execute any logic if all BA were converted successfully', () => {
            migrateBillingAgreement.__set__('numberOfNotConvertedBAIds', 0);

            migrateBillingAgreement.afterStep();

            expect(fakeClose.notCalled).to.be.true;
            expect(fakeAddAlert.notCalled).to.be.true;
            expect(fakeRemoveAlert.notCalled).to.be.true;
        });

        it('should close writer and add new alert if some BAs were not converted', () => {
            migrateBillingAgreement.__set__('numberOfNotConvertedBAIds', 1);

            migrateBillingAgreement.afterStep();

            expect(fakeClose.calledOnce).to.be.true;
            expect(fakeAddAlert.calledOnce).to.be.true;
            expect(fakeRemoveAlert.calledOnce).to.be.true;
        });
    });
});
