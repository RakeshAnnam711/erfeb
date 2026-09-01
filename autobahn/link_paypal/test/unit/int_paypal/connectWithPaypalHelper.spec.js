const { int_paypal: { connectWithPaypalHelperPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const {
    it, describe, before, after, afterEach
} = require('mocha');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const externalProfileExist = stub();
const addFlashMessage = stub();
const logoutAgentUser = stub();
const restoreBasket = stub();
const getPreferredLocale = stub();
const loginAgentUser = stub();
const loginOnBehalfOfCustomer = stub();
const loginCustomer = stub();
const getCWPPCustomerAddress = stub();

const paypalPreferencesMock = {
    isCWPPEnabled: true,
    payPalExternalApiSdk: 'payPalExternalApiSdk',
    accountLinkingSecurityLayerEnabled: true,
    automaticPmAddingEnabled: false
};

const customerModel = function(email) {
    this.email = email;

    this.setEmail = (newEmail) => {
        this.email = newEmail;
    };

    this.setIsExternalProfile = (value) => {
        this.externalProfile = value;
    };

    this.setFirstName = (name) => {
        this.firstName = name;
    };

    this.setLastName = (name) => {
        this.lastName = name;
    };

    this.setPhone = (phone) => {
        this.phone = phone;
    };

    this.isExternalProfile = () => {
        return this.externalProfile;
    };

    this.isEnabledFeatureAPMA = () => true;

    this.getPreferredLocale = getPreferredLocale;

    this.sendRegistrationEmail = () => {};

    this.sendLinkedAccountConfirmationEmail = () => {};

    this.restoreBasket = restoreBasket;

    this.addFlashMessage = addFlashMessage;

    return this;
};

const proxyquire = require('proxyquire').noCallThru();

const connectWithPaypalHelper = proxyquire(connectWithPaypalHelperPath, {
    'dw/web/URLUtils': {
        url: (...urlArgs) => {
            return ['https://url/with/urlArgs', ...urlArgs].join('/');
        }
    },
    'dw/web/Resource': dw.web.Resource,
    'dw/customer/AgentUserMgr': {
        loginOnBehalfOfCustomer: loginOnBehalfOfCustomer,
        loginAgentUser: loginAgentUser,
        logoutAgentUser: logoutAgentUser
    },
    'dw/system/Transaction': dw.system.Transaction,
    'dw/order/BasketMgr': dw.order.BasketMgr,
    '*/cartridge/config/preferences': paypalPreferencesMock,
    '*/cartridge/config/constants': {
        ENDPOINT_APMA_SHOW: 'AutomaticPaymentMethodAdding-Show'
    },
    '*/cartridge/scripts/paypal/utils': {},
    '~/cartridge/scripts/paypal/helpers/buttonConfigHelper': {
        createCwppButtonConfig: () => ({
            fullPage: 'true',
            responseType: 'code'
        })
    },
    '*/cartridge/scripts/paypal/helpers/loginPayPalAddressHelper': {
        getAddressObjectFromPayPal: (obj) => obj.address,
        getCWPPCustomerAddress: getCWPPCustomerAddress,
        savePhoneNumberInCWPPAddress: (lippAddress, phoneNumber) => {
            lippAddress.phone = phoneNumber;
        }
    },
    '*/cartridge/models/customer': {
        get: function(email) {
            if (email === 'newCustomer@test.com') {
                return null;
            }

            return new customerModel(email);
        },
        create: function(email) {
            return new customerModel(email);
        },
        externalProfileExist: externalProfileExist
    },
    '*/cartridge/scripts/helpers/accountHelpers': {
        getLoginRedirectURL: (...args) => {
            return ['https://url/with/args', ...args].join('/');
        },
        loginCustomer: loginCustomer
    }
});

describe('connectWithPaypalHelper file', () => {
    const payPalCustomerInfo = {
        email: 'test@test.com',
        emailConfirmed: true,
        isPassedAccountLinkingSecurityLayer: false,
        address: {
            country: 'Ua',
            city: 'Lviv'
        }
    };

    const oldSessionValue = session.customerAuthenticated;
    const realRequest = Object.assign({}, request);

    before(()=>{
        request.getLocale = () => 'default';

        stub(dw.web.Resource, 'msg');
        dw.web.Resource.msg.withArgs('paypal.error.invalid.customer.info', 'paypalerrors', null).returns('Please use correct customer info');
        dw.web.Resource.msg.withArgs('paypal.error.wrong.login.on.behalf.of.customer', 'paypalerrors', null).returns('Login unsuccessful. Incorrect Agent Login or Password');
        dw.web.Resource.msg.withArgs('paypal.error.wrong.login.agent.user', 'paypalerrors', null).returns('Current agent user does not have the functional permission Login_On_Behalf in the current site.');
        dw.web.Resource.msg.withArgs('paypal.error.email.unconfirmed', 'paypalerrors', null).returns('email unconfirmed');
        dw.web.Resource.msg.withArgs('paypal.account.address.phonenumber.notprovided', 'locale', null).returns('Not provided');
        dw.web.Resource.msg.withArgs('error.message.login.form', 'login', null).returns('login form failure');
    });

    after(() => {
        dw.web.Resource.msg.restore();
        dw.order.BasketMgr.getCurrentBasket.restore();
        session.customerAuthenticated = oldSessionValue;
        request = Object.assign({}, realRequest);
    });

    describe('getBtnConfig', () => {
        const req = {
            querystring: {
                oauthLoginTargetEndPoint: 1
            }
        };

        before(() => {
            session.custom = {
                oauthLoginTargetEndPoint: null
            };
        });

        after(() => {
            delete session.custom.oauthLoginTargetEndPoint;
        });

        it('should return a correct configuration', () => {
            const correctConfig = {
                CWPPButtonEnabled: paypalPreferencesMock.isCWPPEnabled,
                CWPPSdkLink: paypalPreferencesMock.payPalExternalApiSdk,
                CWPPButtonParameters: JSON.stringify({
                    fullPage: 'true',
                    responseType: 'code',
                    prompt: 'login'
                })
            };

            expect(connectWithPaypalHelper.getBtnConfig(req)).to.be.deep.equal(correctConfig);
        });
    });

    describe('handleConnectWithPaypalFlow', ()=>{
        const req = {
            session: {
                privacyCache: 'privacyCache'
            }
        };

        before(()=>{
            externalProfileExist.returns(false);
            getPreferredLocale.returns('UA');
            loginAgentUser.returns({ error: false });
            loginOnBehalfOfCustomer.returns({ error: false });
            session.custom = {
                oauthLoginTargetEndPoint: 'Account-Login'
            };
        });

        after(()=>{
            externalProfileExist.reset();
            getPreferredLocale.reset();
            loginAgentUser.reset();
            loginOnBehalfOfCustomer.reset();
            delete session.custom.oauthLoginTargetEndPoint;
        });

        afterEach(()=>{
            payPalCustomerInfo.email = 'test@test.com';
            payPalCustomerInfo.emailConfirmed = true;
            paypalPreferencesMock.automaticPmAddingEnabled = false;
        });

        it('should throw an error message if there are no payPalCustomerInfo', () => {
            expect(() => {
                connectWithPaypalHelper.handleConnectWithPaypalFlow(req, null);
            }).to.throw('Please use correct customer info');
        });

        it('should throw an error message if customer has unconfirmed email', () => {
            payPalCustomerInfo.emailConfirmed = false;

            expect(() => {
                connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo);
            }).to.throw('email unconfirmed');
        });

        it('should return an url for Account Linking Security Layer if customer is exists and firstly runs CwPP', () => {
            const expectedUrl = 'https://url/with/urlArgs/AutomaticPaymentMethodAdding-RenderAccountLinkingSecurityLayer/'
                + 'payPalCustomerInfo/%7B%22email%22%3A%22test%40test.com%22%2C%22emailConfirmed%22%3Atrue%2C%22'
                + 'isPassedAccountLinkingSecurityLayer%22%3Afalse%2C%22address%22%3A%7B%22country%22%3A%22'
                + 'Ua%22%2C%22city%22%3A%22Lviv%22%7D%7D';

            expect(connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo)).to.be.equal(expectedUrl);
        });

        it('should return an url for default login flow', () => {
            payPalCustomerInfo.email = 'newCustomer@test.com';

            expect(connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo)).to.be.equal('https://url/with/args/Account-Login/privacyCache/true&isAPMAFlow=true');
        });

        it('should return an url for APMA flow', () => {
            paypalPreferencesMock.accountLinkingSecurityLayerEnabled = false;
            paypalPreferencesMock.automaticPmAddingEnabled = true;
            externalProfileExist.returns(true);

            const expectedUrl = 'https://url/with/urlArgs/AutomaticPaymentMethodAdding-Show/'
                + 'redirectURL/https://url/with/args/Account-Login/privacyCache/false&isAPMAFlow=true/'
                + 'addressObject/%7B%22country%22%3A%22Ua%22%2C%22city%22%3A%22Lviv%22%7D';

            expect(connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo)).to.be.equal(expectedUrl);
        });

        it('should logout user if customer was authenticated and restore basket', () => {
            stub(dw.order.BasketMgr, 'getCurrentBasket');
            dw.order.BasketMgr.getCurrentBasket.returns({});
            getPreferredLocale.returns(null);

            request.setLocale = () => {};
            session.customerAuthenticated = true;

            expect(connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo)).to.be.equal('https://url/with/args/Account-Login/privacyCache/false&isAPMAFlow=true');
            expect(logoutAgentUser.calledOnce).to.be.true;
            expect(restoreBasket.calledOnce).to.be.true;
        });

        it('should throw an error message if there are no payPalCustomerInfo', () => {
            loginOnBehalfOfCustomer.returns({ error: true });

            const expectResult = 'Login unsuccessful. Incorrect Agent Login or Password';

            expect(() => {
                connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo);
            }).to.throw(expectResult);
        });

        it('should throw an error message if users credentials is unavailable', () => {
            loginAgentUser.returns({ error: true });

            const expectResult = 'Current agent user does not have the functional permission Login_On_Behalf in the current site.';

            expect(() => {
                connectWithPaypalHelper.handleConnectWithPaypalFlow(req, payPalCustomerInfo);
            }).to.throw(expectResult);
        });
    });

    describe('getAccountLinkingSecurityLayerConfig', ()=>{
        it('should return a correct configuration', () => {
            const correctConfig = {
                actionUrl: 'https://url/with/urlArgs/AutomaticPaymentMethodAdding-HandleAccountLinkingSecurityLayer/'
                    + 'payPalCustomerInfo/%7B%22email%22%3A%22test%40test.com%22%2C%22emailConfirmed%22%3Atrue%2C%22'
                    + 'isPassedAccountLinkingSecurityLayer%22%3Afalse%2C%22address%22%3A%7B%22country%22%3A%22Ua%22%2C%22city%22%3A%22Lviv%22%7D%7D',
                paypal: {
                    payPalEmail: payPalCustomerInfo.email,
                    payPalCustomerInfo: JSON.stringify(payPalCustomerInfo)
                }
            };

            expect(connectWithPaypalHelper.getAccountLinkingSecurityLayerConfig(payPalCustomerInfo)).to.be.deep.equal(correctConfig);
        });
    });

    describe('handleAccountLinkingSecurityLayerFlow', ()=>{
        const req = {
            form: {
                loginEmail: 'test@test.com',
                loginPassword: 'testPassword'
            }
        };

        before(()=>{
            connectWithPaypalHelper.__set__('handleConnectWithPaypalFlow', () => ('https://url/nextStep'));
        });

        after(()=>{
            loginCustomer.reset();
            connectWithPaypalHelper.__ResetDependency__('handleConnectWithPaypalFlow');
        });

        it('should return object with error if user enter invalid credentials', () => {
            const expectedObject = {
                error: true,
                errorMsg: ['login form failure']
            };

            loginCustomer.returns({ error: true });

            expect(connectWithPaypalHelper.handleAccountLinkingSecurityLayerFlow(req, payPalCustomerInfo)).to.be.deep.equal(expectedObject);
        });

        it('should return object with next step url if user enter valid credentials', () => {
            const expectedObject = {
                error: false,
                nextStepUrl: 'https://url/nextStep'
            };

            loginCustomer.returns({ error: false });

            expect(connectWithPaypalHelper.handleAccountLinkingSecurityLayerFlow(req, payPalCustomerInfo)).to.be.deep.equal(expectedObject);
        });
    });

    describe('handleAddressOnAccountPage', () => {
        const originalCustomer = customer;
        const res = {
            viewData: {
                account: {
                    addresses: [{
                        ID: 'login-PayPal',
                        phone: '0123456789'
                    }, {
                        ID: 'address',
                        phone: '0987654321'
                    }],
                    preferredAddress: {
                        address: {
                            ID: 'login-PayPal',
                            phone: '0123456780'
                        }
                    }
                }
            }
        };

        before(() => {
            getCWPPCustomerAddress.returns({
                ID: 'login-PayPal',
                phone: null
            });
        });

        after(() => {
            customer = originalCustomer;
            getCWPPCustomerAddress.reset();
        });

        it('should skip functionality to change phone number', () => {
            connectWithPaypalHelper.handleAddressOnAccountPage(res);

            expect(res.viewData.account.addresses[0].phone).equal('0123456789');
            expect(res.viewData.account.preferredAddress.address.phone).equal('0123456780');
        });

        it('should change viewData address phone for preferredAddress and addresses first item', () => {
            customer.addressBook = {};
            connectWithPaypalHelper.handleAddressOnAccountPage(res);

            expect(res.viewData.account.addresses[0].phone).equal('Not provided');
            expect(res.viewData.account.preferredAddress.address.phone).equal('Not provided');
        });
    });
});
