/* eslint-disable no-underscore-dangle */
const { int_paypal: { sdkPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const disableFunds = ['sepa', 'bancontact', 'eps', 'ideal', 'mybank', 'p24'];

const sdkConfig = {
    disableFunds: JSON.parse(JSON.stringify(disableFunds)),
    allowedCurrencies: []
};

const getClientId = stub();

const paypalPreferences = {
    isCapture: undefined,
    enabledLPMs: undefined,
    isDigitalGoodsFlowEnabled: undefined,
    partnerAttributionId: 'partnerAttributionId',
    enableFundingList: [],
    isCreditCardActive: true,
    isFastlaneEnabled: false,
    isStreamlinedCheckout: false,
    isThreeDSecureEnabled: false
};

session = {
    currency: {
        currencyCode: 'USD'
    }
};

const dwSystem = {
    DEVELOPMENT_SYSTEM: 0,
    instanceType: 0
};

const sdk = proxyquire(sdkPath, {
    '*/cartridge/config/sdkConfig': sdkConfig,
    '*/cartridge/config/preferences': paypalPreferences,
    '*/cartridge/scripts/paypal/utils': {
        getClientId: getClientId
    },
    'dw/system/System': dwSystem
});

describe('sdk', () => {
    describe('isAllowedCurrency', () => {
        const isAllowedCurrency = sdk.__get__('isAllowedCurrency');

        const allowedCurrencies = ['USD', 'EUR'];
        const storeCurrency = 'EUR';

        it('should return true', () => {
            expect(isAllowedCurrency(allowedCurrencies, storeCurrency)).to.be.true;
        });
    });

    describe('disabledPaymentOptions', () => {
        const disabledPaymentOptions = sdk.__get__('disabledPaymentOptions');

        before(() => {
            Array.indexOf = function(a, b) {
                return Array.prototype.indexOf.call(a, b);
            };
        });

        describe('if enabledLPMs exists', () => {
            const newDisabledFunds = ['sepa', 'bancontact', 'eps', 'ideal', 'mybank', 'card',
                'paylater', 'venmo'];

            before(() => {
                sdkConfig.disableFunds = JSON.parse(JSON.stringify(disableFunds));

                paypalPreferences.enabledLPMs = ['p24'];
            });

            after(() => {
                paypalPreferences.enabledLPMs = undefined;
            });

            it('should return disableFunds without enabled', () => {
                expect(disabledPaymentOptions()).to.deep.equals(newDisabledFunds);
            });
        });

        describe('if thare is no enabledLPMs', () => {
            const newDisabledFunds = ['sepa', 'bancontact', 'eps', 'ideal', 'mybank', 'card',
                'paylater', 'venmo'];

            before(() => {
                sdkConfig.disableFunds = JSON.parse(JSON.stringify(disableFunds));

                paypalPreferences.enabledLPMs = ['p24'];
                paypalPreferences.debitCreditButtonEnabled = false;
            });

            after(() => {
                paypalPreferences.enabledLPMs = undefined;
                paypalPreferences.debitCreditButtonEnabled = true;
            });

            it('should return disableFunds without enabled', () => {
                expect(disabledPaymentOptions()).to.deep.equals(newDisabledFunds);
            });
        });
    });

    describe('addEnableFundingParam', () => {
        const addEnableFundingParam = sdk.__get__('addEnableFundingParam');

        const url = '';
        const customEnableFundingList = ['USD', 'EUR'];

        before(() => {
            sdk.__set__('FUNDING_PREFS', [
                { name: 'debitCreditButtonEnabled', value: false },
                { name: 'paypalCreditOrPayLaterButtonEnabled', value: false },
                { name: 'venmoEnabled', value: true }
            ]);
        });

        after(() => {
            sdk.__ResetDependency__('FUNDING_PREFS');
        });

        it('should return adjusted url', () => {
            const result = addEnableFundingParam(url, customEnableFundingList);

            expect(result).to.be.a('string');
            expect(result).to.equal('&enable-funding=USD,EUR,venmo');
        });
    });

    describe('addDisableFundingParam', () => {
        const addDisableFundingParam = sdk.__get__('addDisableFundingParam');

        const url = '';
        const customEnableFundingList = ['USD', 'EUR'];

        before(() => {
            sdk.__set__('disabledPaymentOptions', () => []);
        });

        after(() => {
            sdk.__ResetDependency__('disabledPaymentOptions');

            paypalPreferences.isCreditCardActive = false;
        });

        it('should return url with the necessary values in the part of disable-funding', () => {
            const result = addDisableFundingParam(url, customEnableFundingList, false);

            expect(result).to.be.a('string');
            expect(result).to.equal('&disable-funding=USD,EUR');
        });

        it('should return url with the necessary values in the part of disable-funding in case when card fields is enabled', () => {
            const result = addDisableFundingParam(url, customEnableFundingList, true);

            paypalPreferences.isCreditCardActive = true;

            expect(result).to.equal('&disable-funding=USD,EUR');
        });
    });

    describe('createCartSDKUrl', () => {
        const createCartSDKUrl = sdk.__get__('createCartSDKUrl');
        const clientID = 'AdYw0mYpZkz6qk3RNTmDTDAnNhWwUpL_zawBcv7wjinBmcm9b-10rKlRDwmRUzjcOwScbT9xDsiodvAu';
        const disabledFunding = '&disable-funding=sepa,bancontact,eps,ideal,mybank,p24';
        const components = 'applepay,googlepay,buttons,messages,funding-eligibility';

        before(() => {
            session = {
                currency: {
                    currencyCode: 'USD'
                }
            };
            customer = {
                authenticated: true
            };
            getClientId.returns(clientID);

            sdk.__set__('isAllowedCurrency', () => {
                return true;
            });
            sdk.__set__('disabledPaymentOptions', () => {
                return disableFunds;
            });
        });

        after(() => {
            session = {};
            sdk.__ResetDependency__('isAllowedCurrency');
            getClientId.reset();
        });

        describe('if enableFundingList contains lpm', () => {
            before(() => {
                paypalPreferences.isCapture = false;
                paypalPreferences.enableFundingList = ['mybank'];
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                paypalPreferences.enableFundingList = [];
                paypalPreferences.isCapture = undefined;
                customer = {};
            });

            it('Should not append lpm to the enable funding list of sdk', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}&commit=${paypalPreferences.isStreamlinedCheckout}&components=${components}&intent=authorize&currency=USD${disabledFunding}`;

                expect(createCartSDKUrl()).to.be.equals(url);
            });
        });

        describe('if paypalPreferences.isCreditCardActive is true', () => {
            before(() => {
                paypalPreferences.isCapture = false;
                paypalPreferences.isCreditCardActive = true;
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                paypalPreferences.isCapture = undefined;
                customer = {};
            });

            it('should append "&intent=authorize" to url, currency and disabled funds, and set FUNDING_PREFS[0].value to false', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}&commit=${paypalPreferences.isStreamlinedCheckout}&components=${components}&intent=authorize&currency=USD${disabledFunding}`;

                expect(createCartSDKUrl()).to.be.equals(url);
            });
        });

        describe('if paymentAction is Auth', () => {
            before(() => {
                paypalPreferences.isCapture = false;
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                paypalPreferences.isCapture = undefined;
                customer = {};
            });

            it('should append "&intent=authorize" to url, currency and disabled funds', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}&commit=${paypalPreferences.isStreamlinedCheckout}&components=${components}&intent=authorize&currency=USD${disabledFunding}`;

                expect(createCartSDKUrl()).to.be.equals(url);
            });
        });

        describe('if paymentAction is Capture', () => {
            before(() => {
                sdk.__set__('isCapture', true);
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                customer = {};
            });

            it('should append only currency and disabled funding to url', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}&commit=${paypalPreferences.isStreamlinedCheckout}&components=${components}&intent=authorize&currency=USD${disabledFunding}`;

                expect(createCartSDKUrl()).to.be.equals(url);
            });
        });

        describe('if currency is not allowed', () => {
            before(() => {
                sdk.__set__('isCapture', true);
                customer = {
                    authenticated: true
                };
                sdk.__set__('isAllowedCurrency', () => {
                    return false;
                });
            });

            after(() => {
                sdk.__ResetDependency__('isAllowedCurrency');
                customer = {};
            });

            it('should append only disabled funding to url', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}&commit=${paypalPreferences.isStreamlinedCheckout}&components=${components}&intent=authorize${disabledFunding}`;

                expect(createCartSDKUrl()).to.be.equals(url);
            });
        });
    });

    describe('createBillingSDKUrls', () => {
        const createBillingSDKUrl = sdk.__get__('createBillingSDKUrls');
        const clientID = 'AdYw0mYpZkz6qk3RNTmDTDAnNhWwUpL_zawBcv7wjinBmcm9b-10rKlRDwmRUzjcOwScbT9xDsiodvAu';
        const disabledFunding = '&disable-funding=sepa,bancontact,eps,ideal,mybank,p24';
        const components = '&components=applepay,googlepay,buttons,messages,marks,payment-fields,funding-eligibility';
        const buyerCountry = '&buyer-country=FR';
        const originalRequest = request;

        before(() => {
            session = {
                currency: {
                    currencyCode: 'USD'
                }
            };
            customer = {
                authenticated: true
            };
            getClientId.returns(clientID);
            sdk.__set__('isAllowedCurrency', () => {
                return true;
            });
            sdk.__set__('disabledPaymentOptions', () => {
                return disableFunds;
            });
        });

        after(() => {
            session = {};
            sdk.__ResetDependency__('isAllowedCurrency');
            getClientId.reset();
        });

        afterEach(() => {
            paypalPreferences.isCreditCardActive = false;
        });

        describe('if InstanceType is Development && currency code is USD', () => {
            before(() => {
                sdk.__set__('isCapture', false);
                sdk.__set__('enabledLPMs', ['p24']);
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                customer = {};
            });

            const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components}&currency=USD${disabledFunding}&commit=false&intent=authorize`;

            it('should not append "buyer-country" to url', () => {
                expect(createBillingSDKUrl()).to.deep.equals({
                    baseSdkUrl: url,
                    lpmSdk: null
                });
            });
        });

        describe('if InstanceType is Development && currency code is EUR', () => {
            before(() => {
                customer = {
                    authenticated: false
                };
                request = {
                    locale: 'fr_FR'
                };
                session = {
                    currency: {
                        currencyCode: 'EUR'
                    }
                };

                paypalPreferences.enabledLPMs = ['p24'];
                paypalPreferences.isCapture = false;
            });

            after(() => {
                customer = {};
                request = originalRequest;
                session = {
                    currency: {
                        currencyCode: 'USD'
                    }
                };

                paypalPreferences.enabledLPMs = undefined;
                paypalPreferences.isCapture = undefined;
            });

            const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components}&currency=EUR${disabledFunding}`;

            it('should append "buyer-country=FR" to url', () => {
                expect(createBillingSDKUrl().baseSdkUrl).to.be.equals([url, `commit=true${buyerCountry}&intent=authorize`].join('&'));
            });

            it('should create lpmSdk if intent is authorize', () => {
                expect(createBillingSDKUrl().lpmSdk).to.be.equals([url, `commit=true${buyerCountry}`].join('&'));
            });
        });

        describe('if InstanceType is Production', () => {
            before(() => {
                dwSystem.instanceType = 2;
                session = {
                    currency: {
                        currencyCode: 'EUR'
                    }
                };
                sdk.__set__('isCapture', false);
                sdk.__set__('enabledLPMs', ['p24']);
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                dwSystem.instanceType = 0;
                customer = {};
                session = {
                    currency: {
                        currencyCode: 'USD'
                    }
                };
            });

            const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components}&currency=EUR${disabledFunding}&commit=false&intent=authorize`;

            it('should not append "buyer-country" to url', () => {
                expect(createBillingSDKUrl()).to.deep.equals({
                    baseSdkUrl: url,
                    lpmSdk: null
                });
            });
        });

        describe('if paymentAction is Auth', () => {
            before(() => {
                sdk.__set__('isCapture', false);
                sdk.__set__('enabledLPMs', ['p24']);
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                customer = {};
            });

            const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components}&currency=USD${disabledFunding}&commit=false&intent=authorize`;

            it('should append "&intent=authorize" to url, currency and disabled funds', () => {
                expect(createBillingSDKUrl()).to.deep.equals({
                    baseSdkUrl: url,
                    lpmSdk: null
                });
            });
        });

        describe('if paymentAction is Capture', () => {
            before(() => {
                sdk.__set__('isCapture', true);
                sdk.__set__('enabledLPMs', ['p24']);
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                customer = {};
            });

            const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components}&currency=USD${disabledFunding}&commit=false&intent=authorize`;

            it('should append only currency and disabled funding to url', () => {
                expect(createBillingSDKUrl()).to.deep.equals({
                    baseSdkUrl: url,
                    lpmSdk: null
                });
            });
        });

        describe('if currency is not allowed', () => {
            before(() => {
                sdk.__set__('isCapture', true);
                sdk.__set__('enabledLPMs', ['p24']);
                customer = {
                    authenticated: true
                };
                sdk.__set__('isAllowedCurrency', () => {
                    return false;
                });
            });

            after(() => {
                sdk.__ResetDependency__('isAllowedCurrency');
                customer = {};
            });

            it('should append only disabled funding to url', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components}${disabledFunding}&commit=false&intent=authorize`;

                expect(createBillingSDKUrl()).to.deep.equals({
                    baseSdkUrl: url,
                    lpmSdk: null
                });
            });
        });

        it('should return url with component card fields', () => {
            const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components},card-fields&currency=USD${disabledFunding}&commit=false&intent=authorize`;

            paypalPreferences.isCreditCardActive = true;

            expect(createBillingSDKUrl()).to.be.object;
            expect(createBillingSDKUrl()).to.deep.equal({
                baseSdkUrl: url,
                lpmSdk: null
            });
        });

        describe('if paypalPreferences.isFastlaneEnabled is true and isThreeDSecureEnabled is false', () => {
            before(() => {
                paypalPreferences.isCapture = false;
                paypalPreferences.isFastlaneEnabled = true;
                paypalPreferences.isThreeDSecureEnabled = false;
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                paypalPreferences.isCapture = undefined;
                paypalPreferences.isFastlaneEnabled = false;
                paypalPreferences.isThreeDSecureEnabled = false;
                customer = {};
            });

            it('should append "&intent=authorize" to url, currency and disabled funds', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components},fastlane${disabledFunding}&commit=false&intent=authorize`;

                expect(createBillingSDKUrl()).to.deep.equals({
                    baseSdkUrl: url,
                    lpmSdk: null
                });
            });
        });

        describe('if paypalPreferences.isFastlaneEnabled and isThreeDSecureEnabled are true', () => {
            before(() => {
                paypalPreferences.isCapture = false;
                paypalPreferences.isFastlaneEnabled = true;
                paypalPreferences.isThreeDSecureEnabled = true;
                customer = {
                    authenticated: false
                };
            });

            after(() => {
                paypalPreferences.isCapture = undefined;
                paypalPreferences.isFastlaneEnabled = false;
                paypalPreferences.isThreeDSecureEnabled = false;
                customer = {};
            });

            it('should append "&intent=authorize" to url, currency and disabled funds', () => {
                const url = `https://www.paypal.com/sdk/js?client-id=${clientID}${components},fastlane,three-domain-secure${disabledFunding}&commit=false&intent=authorize`;

                expect(createBillingSDKUrl()).to.deep.equals({
                    baseSdkUrl: url,
                    lpmSdk: null
                });
            });
        });
    });

    describe('createFraudNetNoScriptURL', () => {
        const createFraudNetNoScriptURL = sdk.__get__('createFraudNetNoScriptURL');

        it('should returns a correct url string', () => {
            const url = 'https://c.paypal.com/v1/r/d/b/ns?f=uid&js=0&r=1';

            expect(createFraudNetNoScriptURL('uid')).to.be.equals(url);
        });
    });
});
