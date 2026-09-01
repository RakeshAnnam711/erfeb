const { int_paypal: { preferencesPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');
const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const paypalCartButtonConfig = stub();
const paypalBillingButtonConfig = stub();
const paypalPdpButtonConfig = stub();
const paypalMinicartButtonConfig = stub();
const getValue = stub();
const getActivePaymentMethodsStub = stub();
const tryParseJSON = stub();

getActivePaymentMethodsStub.returns({
    toArray: () => [
        {
            ID: 'ID',
            paymentProcessor: {
                ID: 'ID'
            }
        }
    ]
});

Object.setPrototypeOf(Array, {
    some: (a, b) => Array.prototype.some.call(a, b),
    forEach: (arr, callBack) => {
        if (arr !== undefined) {
            for (let i = 0; i < arr.length; i += 1) {
                callBack(arr[i], i, this);
            }
        }
    }
});

const preferences = proxyquire(preferencesPath, {
    'dw/order/PaymentMgr': {
        getActivePaymentMethods: getActivePaymentMethodsStub,
        getPaymentMethod: () => {
            return {
                active: true
            };
        }
    },
    'dw/system/Site': {
        current: {
            getCustomPreferenceValue: (pref) => ({
                getValue: () => pref
            })
        }
    },
    './sdkConfig': {
        paypalCartButtonConfig,
        paypalBillingButtonConfig,
        paypalPdpButtonConfig,
        paypalMinicartButtonConfig
    },
    '*/cartridge/config/constants': {},
    '*/cartridge/scripts/util/basicHelpers': {
        isJson: () => false
    },
    '*/cartridge/scripts/paypal/utils': {
        tryParseJSON: tryParseJSON
    }
});

describe('preferences file', () => {
    describe('getPreferences', () => {
        const getPreferences = preferences.__get__('getPreferences');

        after(() => {
            customer.authenticated = null;
            customer.registered = null;
        });

        it('should include the boolean threeDSecureFlow property', () => {
            expect(getPreferences()).to.have.property('threeDSecureFlow').which.is.string;
        });

        it('should include the boolean isThreeDSecureEnabled property', () => {
            expect(getPreferences()).to.have.property('isThreeDSecureEnabled');
        });

        it('should have the property isCreditCardVaultOnAccountEnabled', () => {
            expect(getPreferences()).to.have.property('isCreditCardVaultOnAccountEnabled');
        });

        it('should have the property verifyCardOnAccountPage', () => {
            expect(getPreferences()).to.have.property('verifyCardOnAccountPage');
        });

        it('should have the property isApplePayPmActive', () => {
            expect(getPreferences()).to.have.property('isApplePayPmActive');
        });

        it('should have the property merchantName', () => {
            expect(getPreferences()).to.have.property('merchantName');
        });

        it('should have the property applePaySdk', () => {
            expect(getPreferences()).to.have.property('applePaySdk');
        });

        it('should have the property returningCustomerExperienceEnabled', () => {
            expect(getPreferences()).to.have.property('returningCustomerExperienceEnabled');
        });

        it('should have the property paypalButtonMessagesLocation', () => {
            expect(getPreferences()).to.have.property('paypalButtonMessagesLocation');
        });

        it('should have the property isGooglePayActive', () => {
            expect(getPreferences()).to.have.property('isGooglePayActive');
        });

        it('should include creditCardVaultModeEnabled property', () => {
            getValue.withArgs('PP_Store_CC_To_Vault').returns({
                getValue: () => true
            });

            expect(getPreferences()).to.have.property('creditCardVaultModeEnabled');
        });

        it('should include isCapture property', () => {
            getValue.withArgs('PP_Payment_Model').returns({
                getValue: () => true
            });

            expect(getPreferences()).to.have.property('isCapture');
        });

        it('should include isCapture property set to false if PP_Payment_Model value is not "Sale"', () => {
            getValue.withArgs('PP_Payment_Model').returns({ value: 'Auth' });

            expect(getPreferences()).to.have.property('isCapture').which.is.false;
        });

        it('should include paypalButtonLocation property', () => {
            getValue.withArgs('PP_Button_Location').returns(['Billing']);

            expect(getPreferences()).to.have.property('paypalButtonLocation').which.is.equal('Billing');
        });

        it('should include venmoButtonLocation property', () => {
            getValue.withArgs('PP_Venmo_Button_Location').returns([]);

            expect(getPreferences()).to.have.property('venmoButtonLocation').which.is.equal('');
        });

        it('should set instanceType to "sandbox" if running in a sandbox system', () => {
            expect(getPreferences().instanceType).to.equal('sandbox');
        });

        it('should have preference googlePayStyles', () => {
            expect(getPreferences()).to.have.property('googlePayStyles');
        });

        it('should have the property isStreamlinedCheckout', () => {
            expect(getPreferences()).to.have.property('isStreamlinedCheckout');
        });

        it('should have the property appSwitchEnabled', () => {
            expect(getPreferences()).to.have.property('appSwitchEnabled');
        });

        it('should have the property ocapiConfig', () => {
            const mockOcapiConfig = {
                apiVersion: 'v.23.2',
                clientId: '12345'
            };

            tryParseJSON.returns(mockOcapiConfig);

            expect(getPreferences()).to.have.property('ocapiConfig').which.is.equal(mockOcapiConfig);
        });
    });

    describe('getActiveLPMs', () => {
        const getActiveLPMs = preferences.__get__('getActiveLPMs');

        before(() => {
            getActivePaymentMethodsStub.returns({
                toArray: () => [
                    {
                        ID: 'venmo',
                        paymentProcessor: { ID: 'PAYPAL_LOCAL' }
                    },
                    {
                        ID: 'mybank',
                        paymentProcessor: { ID: 'PAYPAL_LOCAL' }
                    },
                    {
                        ID: 'PayPal',
                        paymentProcessor: { ID: 'PAYPAL' }
                    }
                ]
            });
        });

        after(() => {
            getActivePaymentMethodsStub.reset();
        });

        it('should return an array with lpms', () => {
            expect(getActiveLPMs()).to.be.deep.equal(['venmo', 'mybank']);
        });
    });

    describe('isPaymentMethodActive', () => {
        const isPaymentMethodActive = preferences.__get__('isPaymentMethodActive');

        before(() => {
            getActivePaymentMethodsStub.returns({
                toArray: () => [{
                    ID: 'mybank',
                    paymentProcessor: { ID: 'PAYPAL_LOCAL' }
                }, {
                    ID: 'PayPal',
                    paymentProcessor: { ID: 'PAYPAL' }
                }]
            });
        });

        after(() => {
            getActivePaymentMethodsStub.reset();
        });

        it('should return true if some of active payment methods is equal to argument payment id', () => {
            expect(isPaymentMethodActive('PayPal')).to.be.true;
        });

        it('should return false if paymentProcessor equal to null', () => {
            getActivePaymentMethodsStub.returns({
                toArray: () => [{
                    ID: 'ApplePay', paymentProcessor: null
                }]
            });

            expect(isPaymentMethodActive('PayPal')).to.be.false;
        });

        it('should return false if wasn\'t found meyment method', () => {
            getActivePaymentMethodsStub.returns({
                toArray: () => [{
                    ID: 'Venmo', paymentProcessor: { ID: 'BASIC_CREDIT' }
                }]
            });

            expect(isPaymentMethodActive('PayPal')).to.be.false;
        });
    });

    describe('getActivePaymentMethods', () => {
        const getActivePaymentMethods = preferences.__get__('getActivePaymentMethods');

        before(() => {
            getActivePaymentMethodsStub.returns({
                toArray: () => [
                    { active: true, ID: 'CREDIT_CARD' },
                    { active: true, ID: 'PayPal' },
                    { active: false, ID: 'Venmo' }
                ]
            });
        });

        after(() => {
            getActivePaymentMethodsStub.reset();
        });

        it('should return object with active payment methods', () => {
            expect(getActivePaymentMethods())
                .to.be.an('object')
                .that.deep.equal({
                    CREDIT_CARD: { isActive: true, paymentMethodId: 'CREDIT_CARD' },
                    PayPal: { isActive: true, paymentMethodId: 'PayPal' },
                    Venmo: { isActive: false, paymentMethodId: 'Venmo' }
                });
        });

        it('should return an empty array if getActivePaymentMethods returns an empty collection', () => {
            getActivePaymentMethodsStub.returns({ toArray: () => [] });

            expect(getActivePaymentMethods()).to.be.an('object').that.is.empty;
        });
    });

    describe('addWhiteListPrefs', () => {
        const addWhiteListPrefs = preferences.__get__('addWhiteListPrefs');

        it('should create _whiteListedForStorefront and copy selected properties from preferences', () => {
            const testPrefs = {
                partnerAttributionId: 'attrId',
                isDigitalGoodsFlowEnabled: true,
                isCWPPEnabled: true,
                merchantName: 'Merchant',
                isFastlaneEnabled: true,
                instanceType: 'production',
                isFastlanePaymentUiEnabled: true,
                fastlaneCardholderName: 'John Doe',
                isStreamlinedCheckout: true,
                appSwitchEnabled: true,
                threeDSecureFlow: false
            };

            // inject test preferences
            preferences.__set__('preferences', testPrefs);

            addWhiteListPrefs();

            const updatedPrefs = preferences.__get__('preferences');

            expect(updatedPrefs).to.have.property('_whiteListedForStorefront');
            expect(updatedPrefs._whiteListedForStorefront).to.deep.equal({
                partnerAttributionId: 'attrId',
                isDigitalGoodsFlowEnabled: true,
                isCWPPEnabled: true,
                merchantName: 'Merchant',
                isFastlaneEnabled: true,
                instanceType: 'production',
                isFastlanePaymentUiEnabled: true,
                fastlaneCardholderName: 'John Doe',
                isStreamlinedCheckout: true,
                appSwitchEnabled: true,
                threeDSecureFlow: false
            });
        });
    });
});
