const { int_paypal: { googlePayHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe, before, after } = require('mocha');

const { stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const prefs = {
    isGooglePayActive: true,
    googlePayStyles: JSON.stringify({ minicart: { color: 'black' } }),
    googleMerchantId: '1234567890KH4EVER',
    merchantName: 'Test Store',
    threeDSecureFlow: 'SCA_ALWAYS',
    isThreeDSecureEnabled: true,
    isDigitalGoodsFlowEnabled: false
};

const getTransactionId = stub();
const getTransactionStatus = stub();
const prepareTransactionHistory = stub();
const getOrderDetails = stub();
const splitFullName = stub();
const updateOrderBillingAddress = stub();
const handleOrderDetailsError = stub();
const parseBillingAddress = stub();
const process3DSecureResponseMock = stub();
const setCustomerEmailToBasket = stub();

const paypalConstants = {
    DISABLED: 'DISABLED'
};

const resources = {
    paypal: {
        error: {
            general: 'An error occurs, please try again'
        }
    }
};

const form = {
    clear: () => {},
    paypal: {
        usedPaymentMethod: {
            htmlValue: 'GooglePay'
        },
        paymentMethod: {
            htmlValue: 'PayPal'
        }
    }
};

const googlePayHelper = proxyquire(googlePayHelperPath, {
    'dw/system/Site': {
        current: {
            allowedLocales: {
                toArray: () => (['default', 'en_US'])
            }
        }
    },
    '*/cartridge/config/preferences': prefs,
    '*/cartridge/config/constants': paypalConstants,
    '~/cartridge/scripts/paypal/helpers/buttonConfigHelper': {
        getInstanceType: () => 'TEST'
    },
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        getTransactionId,
        getTransactionStatus,
        prepareTransactionHistory,
        splitFullName
    },
    '*/cartridge/scripts/paypal/helpers/addressHelper': {
        updateOrderBillingAddress: updateOrderBillingAddress,
        parseBillingAddress: parseBillingAddress,
        setCustomerEmailToBasket: setCustomerEmailToBasket
    },
    '*/cartridge/scripts/paypal/api': {
        getOrderDetails: getOrderDetails
    },
    '*/cartridge/scripts/paypal/helpers/paypalProcessorHelper': {
        handleOrderDetailsError: handleOrderDetailsError,
        process3DSecureResponse: process3DSecureResponseMock
    },
    '*/cartridge/config/sdkConfig': {
        googlePaySdk: 'googlePaySdkUrl'
    },
    '~/cartridge/scripts/paypal/utils': {
        tryParseJSON: (json) => JSON.parse(json)
    },
    '*/cartridge/config/urls': {
        getAmountForShippingOption: 'amountForShippingOptionUrl',
        getApplicableShippingOptions: 'shippingOptionUrl'
    }
});

describe('googlePayHelper file', () => {
    describe('getGooglePayConfigs', () => {
        const expectedResult = {
            sdkUrl: 'googlePaySdkUrl',
            instanceType: 'TEST',
            googleMerchantId: '1234567890KH4EVER',
            apiVersion: 2,
            apiVersionMinor: 0,
            buttonStyle: {
                color: 'black'
            },
            allowedCountryCodes: ['US'],
            getAmountForShippingOptionUrl: 'amountForShippingOptionUrl',
            messages: {
                THREE_DS_VERIFICATION_FAILED: 'POSSIBLE',
                INTERNAL_GOOGLE_PAY_ERROR_MESSAGE: 'INTERNAL_GOOGLE_PAY_ERROR_MESSAGE',
                SHIPPING_ADDRESS_UNSERVICEABLE: 'SHIPPING_ADDRESS_UNSERVICEABLE',
                SHIPPING_OPTION_INVALID: 'SHIPPING_OPTION_INVALID',
                PHONE_NUMBER_INVALID: 'The phone number is invalid. Please provide the correct phone number to proceed with checkout.'
            },
            pageFlow: 'minicart'
        };

        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.withArgs('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null).returns('POSSIBLE');
            dw.web.Resource.msg.withArgs('google.pay.internal.error', 'locale', null).returns('INTERNAL_GOOGLE_PAY_ERROR_MESSAGE');
            dw.web.Resource.msg.withArgs('google.pay.address.unservicable.error', 'locale', null).returns('SHIPPING_ADDRESS_UNSERVICEABLE');
            dw.web.Resource.msg.withArgs('google.pay.shipping.option.invalid', 'locale', null).returns('SHIPPING_OPTION_INVALID');
            dw.web.Resource.msg.withArgs('paypal.error.googlepay.phone.number.invalid', 'paypalerrors', null).returns(
                'The phone number is invalid. Please provide the correct phone number to proceed with checkout.'
            );
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('should return google pay configs', () => {
            expect(googlePayHelper.getGooglePayConfigs('minicart')).to.deep.equal(expectedResult);
        });

        it('should return undefined if google pay is not enabled', () => {
            prefs.isGooglePayActive = false;

            expect(googlePayHelper.getGooglePayConfigs('minicart')).to.be.undefined;
        });
    });

    describe('handleGooglePay', () => {
        const originalSession = global.session;

        const apShippingAddress = {
            name: '',
            givenName: '',
            familyName: '',
            countryCode: '',
            addressLines: [''],
            postalCode: '',
            administrativeArea: '',
            locality: '',
            phoneNumber: ''
        };

        const billingForm = {
            paymentMethod: {
                value: 'PayPal'
            },
            paypal: {
                usedPaymentMethod: {
                    value: ''
                },
                googlePay: {
                    googlePayEmailAddress: {
                        value: 'email'
                    },
                    googlePayBillingAddressAsString: {
                        value: JSON.stringify(apShippingAddress)
                    },
                    googlePayShippingAddressAsString: {
                        value: JSON.stringify(apShippingAddress)
                    },
                    googlePayPhoneNumber: {
                        value: 'phone'
                    }
                }
            }
        };

        const paymentInstrument = {
            custom: {
                paypalOrderID: '',
                currentPaypalEmail: '',
                paymentId: ''
            }
        };

        const getOrderDetailsSuccess = {
            payment_source: {
                google_pay: {
                    card: {}
                }
            },
            purchase_units: [{
                shipping: {
                    address: {}
                }
            }]
        };

        let basket;

        before(() => {
            global.session = {
                privacy: {}
            };

            stub(dw.system.Transaction, 'wrap').callsArg(0);
            stub(dw.web.Resource, 'msg');

            splitFullName.returns({
                firstName: 'firstName',
                lastName: 'lastName'
            });

            global.session.privacy.paypalOrderID = 'orderId';
        });

        after(() => {
            dw.system.Transaction.wrap.restore();
            dw.web.Resource.msg.restore();

            splitFullName.reset();

            global.session = originalSession;
        });

        it('should return an object', () => {
            getOrderDetails.returns(getOrderDetailsSuccess);

            expect(googlePayHelper.handleGooglePay(basket, billingForm, paymentInstrument))
                .to.be.an('object');
        });

        it('should return an object if googleShippingAddressAsString is not passed', () => {
            getOrderDetails.returns(getOrderDetailsSuccess);

            expect(googlePayHelper.handleGooglePay(basket, billingForm, paymentInstrument)).has.property('shippingAddress');
        });

        it('should return an object if purchase unit does not contains this shipping address', () => {
            billingForm.paypal.googlePay.googlePayBillingAddressAsString.value = JSON.stringify(apShippingAddress);

            getOrderDetails.returns({
                payment_source: {
                    google_pay: {
                        card: {}
                    }
                },
                purchase_units: [
                    {
                        shipping: {
                            address: {
                                address1: 'address1'
                            }
                        }
                    }
                ]
            });

            expect(googlePayHelper.handleGooglePay(basket, billingForm, paymentInstrument))
                .has.property('shippingAddress')
                .which.deep.equals( { address: { address1: 'address1' }, email_address: 'email' } );
        });

        it('should return empty shipping address if Digital Goods flow is enabled', () => {
            prefs.isDigitalGoodsFlowEnabled = true;

            getOrderDetails.returns({
                payment_source: {
                    google_pay: {
                        card: {}
                    }
                },
                purchase_units: [
                    {
                        shipping: {
                            address: {}
                        }
                    }
                ]
            });

            expect(googlePayHelper.handleGooglePay(basket, billingForm, paymentInstrument))
                .has.property('shippingAddress')
                .which.deep.equals({});
        });

        it('if getOrderDetails returns an error', () => {
            getOrderDetails.returns({
                err: resources.paypal.error.general
            });

            handleOrderDetailsError.returns({
                error: true,
                fieldErrors: [],
                serverErrors: [resources.paypal.error.general]
            });

            dw.web.Resource.msg.returns(resources.paypal.error.general);

            expect(googlePayHelper.handleGooglePay(basket, billingForm, paymentInstrument))
                .that.deep.equal({
                    error: true,
                    fieldErrors: [],
                    serverErrors: [resources.paypal.error.general]
                });
        });

        describe('should return object with error', () => {
            const error = {
                error: true,
                message: '3DS Check failed'
            };

            getOrderDetails.returns(getOrderDetailsSuccess);
            process3DSecureResponseMock.returns(error);

            expect(googlePayHelper.handleGooglePay(basket, billingForm, paymentInstrument)).that.deep.equal(error);

            process3DSecureResponseMock.returns({});
        });
    });

    describe('prepareShippingAddressFromGooglePay ', () => {
        const gotShippingAddress = {
            countryCode: 'US',
            address1: 'address1',
            address2: 'address2',
            postalCode: '12345',
            administrativeArea: 'Lisbon',
            locality: 'EN',
            phoneNumber: '1234567890',
            name: 'John'
        };

        const expectedResult = {
            shipping: {
                name: {
                    full_name: gotShippingAddress.name
                },
                address: {
                    country_code: gotShippingAddress.countryCode,
                    address_line_1: gotShippingAddress.address1,
                    address_line_2: gotShippingAddress.address2,
                    postal_code: gotShippingAddress.postalCode,
                    admin_area_1: gotShippingAddress.administrativeArea,
                    admin_area_2: gotShippingAddress.locality

                }
            },
            phone: {
                phone_number: {
                    national_number: gotShippingAddress.phoneNumber
                }
            }
        };

        it('should parse shipping address', () => {
            expect(googlePayHelper.prepareShippingAddressFromGooglePay(gotShippingAddress)).to.deep.equal(expectedResult);
        });
    });

    describe('getGooglePayFormFields', () => {
        it('should return form fields', () => {
            const result = googlePayHelper.getGooglePayFormFields(form);
            const keys = ['googlePayBillingAddressAsString', 'googlePayEmailAddress',
                'googlePayShippingAddressAsString', 'paymentMethod', 'usedPaymentMethod'];

            expect(result).to.have.all.keys(keys);
        });
    });

    describe('processGooglePayData', () => {
        let paymentSourceData;

        beforeEach(() => {
            paymentSourceData = {
                google_pay: {}
            };
        });

        it('should provide 3DS information it is not disabled', () => {
            const expectedResult = {
                google_pay: {
                    attributes: {
                        verification: {
                            method: prefs.threeDSecureFlow
                        }
                    }
                }
            };

            expect(googlePayHelper.processGooglePayData(paymentSourceData)).to.deep.equal(expectedResult);
        });

        it('should not provide 3DS value if it is Disabled', () => {
            prefs.threeDSecureFlow = 'DISABLED';
            prefs.isThreeDSecureEnabled = false;

            const expectedResult = {
                google_pay: {}
            };

            expect(googlePayHelper.processGooglePayData(paymentSourceData)).to.deep.equal(expectedResult);
        });
    });
});
