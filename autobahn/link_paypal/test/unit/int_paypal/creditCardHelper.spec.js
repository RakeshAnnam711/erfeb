'use strict';

const { int_paypal: { creditCardHelperPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const {
    describe, it, before, after, afterEach
} = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const generateClientToken = stub();
const createOrder = stub();
const getCustomerPiByCreditCardToken = stub();
const saveGeneralTransactionData = stub();
const createErrorLog = stub();
const getBillingAddressFromForm = stub();
const getCustomerPaymentInstruments = stub();
const getCustomerProfile = stub();
const getExpirationDataForCC = stub();
const getPpClientMetadataId = stub();
const generateSdkClientToken = stub();
const isFastlaneSessionPaymentsEnabled = stub();
const getTransactionStatus = stub();

const prefs = {
    isCreditCardActive: null,
    debitCreditButtonEnabled: null,
    disableFundingList: [],
    creditCardVaultModeEnabled: true,
    cardFieldsStyles: 'styles',
    threeDSecureFlow: 'SCA_ALWAYS',
    verifyCardOnAccountPage: 'DISABLED',
    creditCardVaultLimit: 3,
    isThreeDSecureEnabled: false
};

const payPalConstants = {
    PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
    PP_FUNDING_SOURCE_CARD: 'card',
    CREDIT_CARD_COMPLEX_BRAND_CODE: ['American Express', 'UnionPay', 'JCB', 'Debit networks'],
    CREDIT_CARD_SAVE_STATUS_VAULTED: 'VAULTED',
    CC_NUMBER_LIMIT_NUMBER_START: 0,
    CC_NUMBER_LIMIT_NUMBER_END: 10,
    CC_SAVE_LIMIT_UNLIMITED: -1,
    SCA_WHEN_REQUIRED: 'SCA_WHEN_REQUIRED',
    REGEXP_NAME: /^[A-Z][a-zA-Z '.-]*[A-Za-z][^-]$/,
    DISABLED: 'DISABLED',
    INTENT_CAPTURE: 'CAPTURE',
    INTENT_AUTHORIZE: 'AUTHORIZE',
    INITIATOR_CUSTOMER: 'CUSTOMER',
    PAYMENT_TYPE_ONE_TIME: 'ONE_TIME',
    PAYMENT_TYPE_UNSCHEDULED: 'UNSCHEDULED',
    USAGE_DERIVED: 'DERIVED',
    USAGE_FIRST: 'FIRST',
    USAGE_SUBSEQUENT: 'SUBSEQUENT',
    VAULT_INDICATOR_ON_SUCCESS: 'ON_SUCCESS',
    PAYPAL_CARD_ERROR_STATUSES: [
        'DENIED',
        'DECLINED'
    ]
};

const creditCardHelper = proxyquire(creditCardHelperPath, {
    '*/cartridge/config/constants': payPalConstants,
    '*/cartridge/config/preferences': prefs,
    '*/cartridge/scripts/paypal/api': {
        generateClientToken,
        createOrder,
        generateSdkClientToken
    },
    'dw/web/Resource': {
        msg: resource => {
            switch (resource) {
                case 'paypal.creditcard.field.cardNumber.placeholder':
                    return 'Card Number';

                case 'paypal.creditcard.field.cvv.placeholder':
                    return 'Cvv';

                case 'paypal.creditcard.field.expirationdate.placeholder':
                    return 'Expiration date';

                case 'paypal.creditcard.field.cardholder':
                    return 'Cardholder name';

                case 'paypal.creditcard.3ds.verification.failed':
                    return '3DSecure popup was canceled by the buyer or credit card verification failed. Please try again';

                case 'paypal.error.creditcard.field.invalid':
                    return 'Field is invalid. Please enter a valid value.';

                case 'paypal.error.creditcard.field.general.notification':
                    return 'Please enter valid credit card details.';

                case 'paypal.creditcard.expired':
                    return 'Expired';

                case 'paypal.creditcard.cardholder.notprovided':
                    return 'Cardholder name is not provided';

                case 'paypal.creditcard.declined':
                    return 'The card has been declined. Try using another one.';

                default:
                    return undefined;
            }
        }
    },
    'dw/system/Transaction': dw.system.Transaction,
    '*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper': {
        getCustomerPiByCreditCardToken
    },
    '*/cartridge/scripts/paypal/helpers/paypalProcessorHelper': {
        saveGeneralTransactionData
    },
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog
    },
    '*/cartridge/config/urls': {
        myAccountUrl: 'my-account.com',
        placeOrderStage: 'https://example.com/Checkout-Begin?stage=placeOrder',
        paymentStage: 'https://example.com/Checkout-Begin?stage=payment'
    },
    '*/cartridge/scripts/paypal/helpers/addressHelper': {
        getBillingAddressFromForm: getBillingAddressFromForm
    },
    '*/cartridge/scripts/paypal/helpers/customerHelper': {
        getCustomerPaymentInstruments: getCustomerPaymentInstruments,
        getCustomerProfile: getCustomerProfile,
        setPayPalSavedCardsPaymentToken: (profileCustom, creditCardToken) => {
            if (!profileCustom.payPalSavedCardsPaymentTokens) {
                profileCustom.payPalSavedCardsPaymentTokens = '*'.concat(creditCardToken, '*');
            } else {
                profileCustom.payPalSavedCardsPaymentTokens += creditCardToken.concat('*');
            }
        },
        deletePayPalSavedCardsPaymentToken: (profileCustom, creditCardToken) => {
            if (profileCustom.payPalSavedCardsPaymentTokens) {
                profileCustom.payPalSavedCardsPaymentTokens = profileCustom.payPalSavedCardsPaymentTokens
                    .replace(creditCardToken, '').replace('**', '*');
            }
        }
    },
    '*/cartridge/scripts/paypal/helpers/paymentHelper': {
        getExpirationDataForCC: getExpirationDataForCC
    },
    '*/cartridge/scripts/util/basicHelpers': {
        getPpClientMetadataId: getPpClientMetadataId
    },
    '*/cartridge/scripts/paypal/helpers/fastlane': {
        isFastlaneSessionPaymentsEnabled: isFastlaneSessionPaymentsEnabled
    },
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        getTransactionStatus
    }
});

const setCreditCardHolder = stub();
const setCreditCardNumber = stub();
const setCreditCardExpirationMonth = stub();
const setCreditCardExpirationYear = stub();
const setCreditCardType = stub();
const getPaymentInstruments = stub();

const paymentInstrument = {
    creditCardToken: '',
    creditCardType: '',
    paymentMethod: 'PAYPAL_CREDIT_CARD'
};

const customerPaymentInstruments = {
    wallet: {
        paymentInstruments: [],
        getPaymentInstruments: getPaymentInstruments,
        createPaymentInstrument: () => Object.assign(paymentInstrument, {
            setCreditCardHolder: setCreditCardHolder,
            setCreditCardNumber: setCreditCardNumber,
            setCreditCardExpirationMonth: setCreditCardExpirationMonth,
            setCreditCardExpirationYear: setCreditCardExpirationYear,
            setCreditCardType: setCreditCardType
        })
    }
};

const baseCustomer = customer;

describe('creditCardHelper file', () => {
    describe('getApplicablePayPalCcPi', () => {
        const getApplicablePayPalCcPi = creditCardHelper.__get__('getApplicablePayPalCcPi');

        before(() => {
            customer.authenticated = true;

            Array.filter = function(a, b) {
                return Array.prototype.filter.call(a, b);
            };
        });

        after(() => {
            customer.authenticated = baseCustomer.authenticated;
            paymentInstrument.paymentMethod = 'PAYPAL_CREDIT_CARD';
        });

        it('should be a function', () => {
            expect(getApplicablePayPalCcPi).to.be.a('function');
        });

        it('should return an empty array if payment instruments object is empty', () => {
            customer.profile = customerPaymentInstruments;

            expect(getApplicablePayPalCcPi()).to.be.an('array').that.is.empty;
        });

        it('should return an array with payment instrument, if there is PAYPAL_CREDIT_CARD payment instrument', () => {
            customerPaymentInstruments.wallet.paymentInstruments.push(paymentInstrument);

            expect(getApplicablePayPalCcPi()).that.deep.equal([
                paymentInstrument
            ]);
        });

        it('should return an empty array if there is not PAYPAL_CREDIT_CARD payment instrument', () => {
            paymentInstrument.paymentMethod = 'PayPal';

            expect(getApplicablePayPalCcPi()).to.be.an('array').that.is.empty;
        });

        it('should return an empty array if !customer.authenticated', () => {
            customer.authenticated = false;

            expect(getApplicablePayPalCcPi()).to.be.an('array').that.is.empty;
        });
    });

    describe('getCardFieldsConfigs', () => {
        const viewData = {
            forms: {
                billingForm: {
                    creditCardFields: {
                        cardNumber: {
                            htmlName: 'cardNumber'
                        }
                    }
                }
            }
        };

        before(() => {
            customer.authenticated = true;

            getExpirationDataForCC.withArgs({
                UUID: 'uuid1',
                paymentMethod: 'PAYPAL_CREDIT_CARD'
            }).returns({
                expireNotification: true,
                expireStyle: 'warning',
                expireMessage: 'expired in 1 month'
            });

            session = {
                privacy: {
                    paymentToken: 'feruwfie'
                }
            };
        });

        after(() => {
            generateClientToken.reset();
            getExpirationDataForCC.reset();
            customer.authenticated = baseCustomer.authenticated;
            prefs.creditCardVaultModeEnabled = false;
        });

        it('should be a function', () => {
            expect(creditCardHelper.getCardFieldsConfigs).to.be.a('function');
        });

        it('should return a card fields config object', () => {
            generateClientToken.returns('token');
            getPpClientMetadataId.returns('clientMetadataId');
            generateSdkClientToken.returns('clientSDKToken');

            paymentInstrument.custom = {
                payPalDefaultCard: true
            };
            prefs.creditCardVaultModeEnabled = true;

            customerPaymentInstruments.wallet.paymentInstruments.push({
                UUID: 'uuid1',
                paymentMethod: 'PAYPAL_CREDIT_CARD'
            });

            const basket = {
                getPaymentInstruments: () => []
            };

            expect(creditCardHelper.getCardFieldsConfigs(viewData, basket)).that.deep.equal({
                fieldsConfig: {
                    numberHtmlName: viewData.forms.billingForm.creditCardFields.cardNumber.htmlName,
                    styles: prefs.cardFieldsStyles
                },
                fieldsPlaceholders: {
                    number: 'Card Number',
                    cvv: 'Cvv',
                    name: 'Cardholder name',
                    expirationDate: 'Expiration date'
                },
                fieldsGeneralNotificationError: 'Please enter valid credit card details.',
                clientMetadataId: 'clientMetadataId',
                clientSDKToken: 'clientSDKToken',
                clientToken: 'token',
                creditCardPmId: payPalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD,
                threeDSecureValue: prefs.threeDSecureFlow,
                isShowCheckbox: true,
                expirationCreditCards: {
                    uuid1: {
                        expireNotification: true,
                        expireStyle: 'warning',
                        expireMessage: 'expired in 1 month'
                    }
                },
                isCreditCardVaultEnabled: true,
                customerSavedCreditCards: customerPaymentInstruments.wallet.paymentInstruments,
                isNewCardOptionSelected: false,
                errorMessages: {
                    threeDSVerificationFailed: '3DSecure popup was canceled by the buyer or credit card verification failed. Please try again'
                },
                sessionAccount: null,
                fastlanePaymentToken: 'feruwfie'
            });

            expect(getExpirationDataForCC.calledTwice, 'getExpirationDataForCC called twice').to.be.true;
        });

        it('should return a session account object', () => {
            isFastlaneSessionPaymentsEnabled.returns(true);

            const basket = { getPaymentInstruments: () => [{ paymentMethod: 'PAYPAL_CREDIT_CARD' }] };
            const result = creditCardHelper.getCardFieldsConfigs(viewData, basket);

            expect(result.sessionAccount).to.deep.equal({ paymentMethod: 'PAYPAL_CREDIT_CARD' });
        });
    });

    describe('formatComplexCCBrandCode', () => {
        it('should be a function', () => {
            expect(creditCardHelper.formatComplexCCBrandCode).to.be.a('function');
        });

        it('should return American Express if brandCode is American Express', () => {
            expect(creditCardHelper.formatComplexCCBrandCode('American Express')).that.deep.equal('American Express');
        });

        it('should return masterCard if brandCode is MasterCard', () => {
            expect(creditCardHelper.formatComplexCCBrandCode('masterCard')).that.deep.equal('MasterCard');
        });
    });

    describe('isSavedCardFlow', () => {
        const originalHttpParameterMap = request.httpParameterMap;

        before(() => {
            request.httpParameterMap = {
                paypalCreditCardList: {
                    empty: true
                }
            };
        });

        after(() => {
            request.httpParameterMap = originalHttpParameterMap;
        });

        it('should be a function', () => {
            expect(creditCardHelper.isSavedCardFlow).to.be.a('function');
        });

        it('should be false if customer.registered === false', () => {
            customer.registered = false;

            expect(creditCardHelper.isSavedCardFlow()).to.be.false;
        });

        it('should be false if customer.registered === true && paypalCreditCardList is empty', () => {
            customer.registered = true;

            expect(creditCardHelper.isSavedCardFlow()).to.be.false;
        });

        it('should be false if customer.registered === true && paypalCreditCardList === newcard', () => {
            request.httpParameterMap.paypalCreditCardList.empty = false;
            request.httpParameterMap.paypalCreditCardList.stringValue = 'newcard';

            expect(creditCardHelper.isSavedCardFlow()).to.be.false;
        });

        it('should be true if customer.registered === true && paypalCreditCardList !== newcard', () => {
            request.httpParameterMap.paypalCreditCardList.stringValue = 'uuid';

            expect(creditCardHelper.isSavedCardFlow()).to.be.true;
        });
    });

    describe('getCreditCardHolderName', () => {
        const getCreditCardHolderName = creditCardHelper.__get__('getCreditCardHolderName');

        it('should return cardholder name if one was provided', () => {
            expect(getCreditCardHolderName({ name: 'Cardholder' })).to.equal('Cardholder');
        });

        it('should return cardholder name from Resources if one was not provided', () => {
            expect(getCreditCardHolderName({})).to.equal('Cardholder name is not provided');
        });
    });

    describe('saveCreditCardToCustomerWallet', () => {
        before(() => {
            customer = {
                profile: {
                    custom: {},
                    wallet: customerPaymentInstruments.wallet
                }
            };

            creditCardHelper.__set__('formatComplexCCBrandCode', (brand) => brand);
            creditCardHelper.__set__('isUniqueCreditCardToken', () => true);
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            customer.profile.custom = {};
            getPaymentInstruments.reset();
            dw.system.Transaction.wrap.restore();
            creditCardHelper.__ResetDependency__('isVaultedStatusForCreditCard');
            creditCardHelper.__ResetDependency__('formatComplexCCBrandCode');
            creditCardHelper.__ResetDependency__('isUniqueCreditCardToken');
        });

        afterEach(() => {
            creditCardHelper.__set__('isVaultedStatusForCreditCard', () => true);

            setCreditCardHolder.reset();
            setCreditCardExpirationMonth.reset();
            setCreditCardExpirationYear.reset();
            setCreditCardType.reset();
        });

        it('if the checkout flow was executed and credit card was successfully saved to customer wallet', () => {
            const responseData = {
                payment_source: {
                    card: {
                        attributes: {
                            vault: {
                                status: payPalConstants.CREDIT_CARD_SAVE_STATUS_VAULTED,
                                id: 'pdj4dqwn',
                                customer: {
                                    id: 'customerId'
                                }
                            }
                        },
                        name: 'Card Name',
                        expiry: '25-01',
                        brand: 'Visa',
                        last_digits: '0001'
                    }
                }
            };

            const billingAddressAsString = 'billing-address-as-a-string';

            creditCardHelper.saveCreditCardToCustomerWallet(responseData, billingAddressAsString);

            expect(customer.profile.custom.payPalCustomerId).to.equal('customerId');
            expect(customer.profile.custom.payPalSavedCardsPaymentTokens).to.equal('*pdj4dqwn*');

            expect(setCreditCardHolder.calledWithExactly('Card Name')).to.be.true;
            expect(setCreditCardExpirationMonth.calledWithExactly(1)).to.be.true;
            expect(setCreditCardExpirationYear.calledWithExactly(25)).to.be.true;
            expect(setCreditCardType.calledWithExactly('visa')).to.be.true;
        });

        it('if the myaccount flow was executed and credit card was successfully saved to customer wallet', () => {
            customer.profile.custom.payPalCustomerId = 'pp-customer-id';
            customer.profile.custom.payPalSavedCardsPaymentTokens = '*pdj4dqwn*';

            const responseData = {
                payment_source: {
                    card: {
                        id: 'pdj4dqwn',
                        name: 'name',
                        expiry: '25-01',
                        brand: 'Visa',
                        last_digits: '0001'
                    }
                },
                customer: { id: 'customer-id' },
                id: '07eenafy'
            };

            const billingAddressAsString = 'billing-address-as-a-string';

            getPaymentInstruments.returns(['pi1', 'pi2']);

            creditCardHelper.saveCreditCardToCustomerWallet(responseData, billingAddressAsString);

            expect(customer.profile.custom.payPalCustomerId).to.equal('pp-customer-id');
            expect(customer.profile.custom.payPalSavedCardsPaymentTokens).to.equal('*pdj4dqwn*07eenafy*');

            expect(setCreditCardHolder.calledWithExactly('name')).to.be.true;
            expect(setCreditCardExpirationMonth.calledWithExactly(1)).to.be.true;
            expect(setCreditCardExpirationYear.calledWithExactly(25)).to.be.true;
            expect(setCreditCardType.calledWithExactly('visa')).to.be.true;
        });

        it('should return undefined if no flow prodided', () => {
            customer.profile.custom.payPalCustomerId = 'pp-customer-id';
            customer.profile.custom.payPalSavedCardsPaymentTokens = '*pdj4dqwn*';

            creditCardHelper.__set__('isVaultedStatusForCreditCard', () => false);

            const responseData = {
                payment_source: {
                    card: {
                        id: 'pdj4dqwn',
                        name: 'name',
                        expiry: '25-01',
                        brand: 'Visa',
                        last_digits: '0001',
                        attributes: {
                            vault: {
                                status: 'APPROVE',
                                id: 'pdj4dqwn',
                                customer: {
                                    id: 'customerId'
                                }
                            }
                        }
                    }
                },
                customer: { id: 'customer-id' },
                id: '07eenafy'
            };

            const billingAddressAsString = 'billing-address-as-a-string';

            getPaymentInstruments.returns(['pi1', 'pi2']);

            expect(creditCardHelper.saveCreditCardToCustomerWallet(responseData, billingAddressAsString)).to.be.undefined;
            expect(setCreditCardHolder.calledWithExactly('name')).to.be.false;
            expect(setCreditCardExpirationMonth.calledWithExactly(1)).to.be.false;
            expect(setCreditCardExpirationYear.calledWithExactly(25)).to.be.false;
            expect(setCreditCardType.calledWithExactly('visa')).to.be.false;
        });

        it('should use customer profile from helper', () => {
            customer.profile.custom.payPalCustomerId = 'pp-customer-id';
            customer.profile.custom.payPalSavedCardsPaymentTokens = '*pdj4dqwn*';

            const billingAddressAsString = 'billing-address-as-a-string';
            const responseData = {
                payment_source: {
                    card: {
                        id: 'pdj4dqwn',
                        name: 'name',
                        expiry: '25-01',
                        brand: 'Visa',
                        last_digits: '0001'
                    }
                },
                customer: { id: 'customer-id' },
                id: '07eenafy',
                isWebHook: true
            };

            getCustomerProfile.withArgs(responseData.customer.id).returns(undefined);
            creditCardHelper.__set__('isUniqueCreditCardToken', () => false);

            expect(creditCardHelper.saveCreditCardToCustomerWallet(responseData, billingAddressAsString)).to.be.undefined;
            expect(setCreditCardHolder.calledWithExactly('name')).to.be.false;
            expect(setCreditCardExpirationMonth.calledWithExactly(1)).to.be.false;
            expect(setCreditCardExpirationYear.calledWithExactly(25)).to.be.false;
            expect(setCreditCardType.calledWithExactly('visa')).to.be.false;
        });

        it('should return undefined if credit card token is not unique', () => {
            customer.profile.custom.payPalCustomerId = 'pp-customer-id';
            customer.profile.custom.payPalSavedCardsPaymentTokens = '*pdj4dqwn*';

            const billingAddressAsString = 'billing-address-as-a-string';
            const responseData = {
                payment_source: {
                    card: {
                        id: 'pdj4dqwn',
                        name: 'name',
                        expiry: '25-01',
                        brand: 'Visa',
                        last_digits: '0001'
                    }
                },
                customer: { id: 'customer-id' },
                id: '07eenafy'
            };

            expect(creditCardHelper.saveCreditCardToCustomerWallet(responseData, billingAddressAsString)).to.be.undefined;
            expect(setCreditCardHolder.calledWithExactly('name')).to.be.false;
            expect(setCreditCardExpirationMonth.calledWithExactly(1)).to.be.false;
            expect(setCreditCardExpirationYear.calledWithExactly(25)).to.be.false;
            expect(setCreditCardType.calledWithExactly('visa')).to.be.false;
        });
    });

    describe('completeSavedCcOrder', () => {
        const purchaseUnit = {};
        const order = {
            custom: {}
        };

        before(() => {
            paymentInstrument.paymentTransaction = {
                transactionID: 'transactionId'
            };

            createOrder.returns({
                resp: {
                    id: 'orderId'
                }
            });

            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            createOrder.reset();
            createErrorLog.reset();
            dw.system.Transaction.wrap.restore();
        });

        it('should be a function', () => {
            expect(creditCardHelper.completeSavedCcOrder).to.be.a('function');
        });

        it('should return an object', () => {
            expect(creditCardHelper.completeSavedCcOrder(purchaseUnit, order, paymentInstrument)).to.be.an('object');
        });

        it('should return authorize === true if order is created', () => {
            expect(creditCardHelper.completeSavedCcOrder(purchaseUnit, order, paymentInstrument)).that.deep.equal({
                authorized: true
            });
        });

        it('should return an error object if createOrder thrown an error', () => {
            const errorMsg = 'An error occurred';

            createOrder.returns({
                err: errorMsg
            });

            expect(creditCardHelper.completeSavedCcOrder(purchaseUnit, order, paymentInstrument)).that.deep.equal({
                error: true,
                authorized: false,
                fieldErrors: [],
                serverErrors: [errorMsg],
                message: errorMsg
            });

            expect(createErrorLog.calledOnce).to.be.true;
        });
    });

    describe('getCustomerData', () => {
        const lineItemCtnr = {
            customerEmail: 'email',
            billingAddress: {
                phone: '9234567890'
            }
        };

        after(() => {
            customer.profile.custom = {};
        });

        it('should be a function', () => {
            expect(creditCardHelper.getCustomerData).to.be.a('function');
        });

        it('should return an object with email_address and phone', () => {
            expect(creditCardHelper.getCustomerData(lineItemCtnr)).that.deep.equal({
                email_address: lineItemCtnr.customerEmail,
                phone: {
                    phone_number: {
                        national_number: lineItemCtnr.billingAddress.phone
                    }
                }
            });
        });

        it('should return an object with email_address, phone and id', () => {
            customer.profile.custom.payPalCustomerId = 'customerId';

            expect(creditCardHelper.getCustomerData(lineItemCtnr)).that.deep.equal({
                email_address: lineItemCtnr.customerEmail,
                phone: {
                    phone_number: {
                        national_number: lineItemCtnr.billingAddress.phone
                    }
                },
                id: customer.profile.custom.payPalCustomerId
            });
        });
    });

    describe('getVerificationMethod', () => {
        const getVerificationMethod = creditCardHelper.__get__('getVerificationMethod');

        it('should return a verification method SCA_WHEN_REQUIRED', () => {
            prefs.verifyCardOnAccountPage = 'SCA_WHEN_REQUIRED';

            expect(getVerificationMethod()).to.equal('SCA_WHEN_REQUIRED');
        });

        it('should return a verification method SCA_ALWAYS ', () => {
            prefs.verifyCardOnAccountPage = 'SCA_ALWAYS';

            expect(getVerificationMethod()).to.equal('SCA_ALWAYS');
        });

        it('should return null, if verification is disabled', () => {
            prefs.verifyCardOnAccountPage = 'DISABLED';

            expect(getVerificationMethod()).to.be.null;
        });
    });

    describe('getCreditCardFields', () => {
        const form = {
            dwfrm_paypalCreditCard_cardName: 'Visa',
            dwfrm_paypalCreditCard_cardNumber: '4111111111111111',
            dwfrm_paypalCreditCard_cardExpirationDate: '2028-05',
            dwfrm_paypalCreditCard_cardSecurityCode: '371'
        };

        before(() => {
            getBillingAddressFromForm.returns({
                address_line_1: 'Address line1',
                address_line_2: '',
                admin_area_1: 'Texas',
                admin_area_2: 'City',
                postal_code: 'IO-315',
                country_code: 'US'
            });
            creditCardHelper.__set__('getVerificationMethod', () => null);
        });

        after(() => {
            getBillingAddressFromForm.reset();
            creditCardHelper.__ResetDependency__('getVerificationMethod');
        });

        it('should return the object which contains all the properties required for API request without verification method', () => {
            const result = creditCardHelper.getCreditCardFields(form);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('name', 'number', 'expiry', 'security_code', 'billing_address', 'experience_context');
            expect(result.experience_context).to.have.all.keys('return_url', 'cancel_url');
            expect(result).to.not.have.property('verification_method');
        });

        it('should return the object which contains all the properties required for API request and verification method', () => {
            creditCardHelper.__set__('getVerificationMethod', () => 'SCA_WHEN_REQUIRED');

            const result = creditCardHelper.getCreditCardFields(form);

            expect(result).to.be.an('object');
            expect(result).to.have.all.keys('name', 'number', 'expiry', 'security_code', 'billing_address', 'experience_context', 'verification_method');
            expect(result.experience_context).to.have.all.keys('return_url', 'cancel_url');
        });
    });

    describe('deleteCreditCardFromWallet', () => {
        const removePaymentInstrument = stub();

        before(() => {
            customer.profile.wallet = {
                removePaymentInstrument: removePaymentInstrument
            };
            customer.profile.custom.payPalSavedCardsPaymentTokens = '*fewfgee*dwdwdw*';
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            customer.profile.wallet = {};
            customer.profile.custom.payPalSavedCardsPaymentTokens = '';

            removePaymentInstrument.reset();
            dw.system.Transaction.wrap.restore();
        });

        it('payment instrument should be deleted from wallet', () => {
            const pi = {
                name: 'name',
                expiry: '25-01',
                brand: 'Visa',
                last_digits: '0001',
                creditCardToken: 'dwdwdw'
            };

            creditCardHelper.deleteCreditCardFromWallet(pi);

            expect(removePaymentInstrument.calledOnce).to.be.true;
            expect(removePaymentInstrument.calledWithExactly(pi)).to.be.true;
            expect(customer.profile.custom.payPalSavedCardsPaymentTokens).to.equal('*fewfgee*');
        });
    });

    describe('setDefaultCard', () => {
        const mockCreditCard = { custom: { payPalDefaultCard: false } };

        before(() => {
            getCustomerPaymentInstruments.returns([mockCreditCard]);
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            dw.system.Transaction.wrap.restore();
            getCustomerPaymentInstruments.reset();
        });

        afterEach(() => {
            mockCreditCard.custom.payPalDefaultCard = false;
        });

        it('should set new default credit card', () => {
            creditCardHelper.setDefaultCard();

            expect(mockCreditCard.custom.payPalDefaultCard).to.be.true;
        });

        it('should not set new default credit card, because there is no more saved payment instruments', () => {
            getCustomerPaymentInstruments.returns([]);

            creditCardHelper.setDefaultCard();

            expect(mockCreditCard.custom.payPalDefaultCard).to.be.false;
        });
    });

    describe('getDefaultCard', () => {
        before(() => {
            getCustomerPaymentInstruments.returns([
                { cardName: 'FirstCard', custom: { payPalDefaultCard: false } },
                { cardName: 'SecondCard', custom: { payPalDefaultCard: false } },
                { cardName: 'ThirdCard', custom: { payPalDefaultCard: true } },
                { cardName: 'FourthCard', custom: { payPalDefaultCard: false } }
            ]);
        });

        after(() => {
            getCustomerPaymentInstruments.reset();
        });

        it('should return default credit card from customer payment instruments', () => {
            const result = creditCardHelper.getDefaultCard();

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({ cardName: 'ThirdCard', custom: { payPalDefaultCard: true } });
        });
    });

    describe('updateSavedCreditCardBA', () => {
        const savedPI = {
            custom: {
                paypalCreditCardBillingAddress: 'paypalCreditCardBillingAddress-1'
            }
        };

        before(() => {
            getCustomerPiByCreditCardToken.returns(savedPI);
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            getCustomerPiByCreditCardToken.reset();
            dw.system.Transaction.wrap.restore();
        });

        afterEach(() => {
            dw.system.Transaction.wrap.resetHistory();
        });

        it('should not update paypalCreditCardBillingAddress, because the same address was already saved', () => {
            const pi = {
                custom: {
                    paypalCreditCardBillingAddress: 'paypalCreditCardBillingAddress-1'
                }
            };

            creditCardHelper.updateSavedCreditCardBA(pi);

            expect(dw.system.Transaction.wrap.calledOnce).to.be.false;
        });

        it('should update paypalCreditCardBillingAddress, because different address was already saved', () => {
            const pi = {
                custom: {
                    paypalCreditCardBillingAddress: 'paypalCreditCardBillingAddress-2'
                }
            };

            creditCardHelper.updateSavedCreditCardBA(pi);

            expect(dw.system.Transaction.wrap.calledOnce).to.be.true;
            expect(savedPI.custom.paypalCreditCardBillingAddress).to.equal('paypalCreditCardBillingAddress-2');
        });
    });

    describe('prepareBodyForCreateSetupToken', () => {
        it('should return an object with formatted fields', () => {
            expect(creditCardHelper.prepareBodyForCreateSetupToken({
                number: '4111 1111 1111 1111',
                expiry: '12 / 2033'
            })).to.be.deep.equal({
                payment_source: {
                    card: {
                        expiry: '2033-12',
                        number: '4111111111111111'
                    }
                }
            });
        });

        it('should return an object with formatted fields', () => {
            expect(creditCardHelper.prepareBodyForCreateSetupToken({
                number: '4111 1111 1111 1111',
                expiry: '12 / 33'
            })).to.be.deep.equal({
                payment_source: {
                    card: {
                        expiry: '2033-12',
                        number: '4111111111111111'
                    }
                }
            });
        });
    });

    describe('validateCardAccountPage', () => {
        it('should return an object without error if card holder name is valid', () => {
            expect(creditCardHelper.validateCardAccountPage('name', 'ValidName')).to.be.deep.equal({
                isError: false
            });
        });

        it('should return an object with error if card holder name is invalid', () => {
            expect(creditCardHelper.validateCardAccountPage('name', '.Invalid..Name...')).to.be.deep.equal({
                isError: true,
                fieldName: 'card-holder-name',
                errorMessage: 'Field is invalid. Please enter a valid value.'
            });
        });

        it('should return an object without error if expiration date field is valid', () => {
            expect(creditCardHelper.validateCardAccountPage('expiry', '2033-12')).to.be.deep.equal({
                isError: false
            });
        });

        it('should return an object with error if expiration date field is invalid', () => {
            expect(creditCardHelper.validateCardAccountPage('expiry', '2033-15')).to.be.deep.equal({
                isError: true,
                fieldName: 'expiration-date',
                errorMessage: 'Field is invalid. Please enter a valid value.'
            });
        });

        it('should return an object with error if credit card is expired', () => {
            expect(creditCardHelper.validateCardAccountPage('expiry', '2002-12')).to.be.deep.equal({
                isError: true,
                fieldName: 'expiration-date',
                errorMessage: 'Expired'
            });
        });
    });

    describe('isUniqueCreditCardToken', () => {
        const isUniqueCreditCardToken = creditCardHelper.__get__('isUniqueCreditCardToken');
        const creditCartTokenTest = 'dwdwdw';

        const payInst1 = {
            creditCardToken: '123456ASD'
        };

        const payInst2 = {
            creditCardToken: creditCartTokenTest
        };

        const payInstResult = {
            toArray: () => [payInst1, payInst2]
        };

        before(() => {
            getPaymentInstruments.withArgs(payPalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD).returns(payInstResult);
        });

        after(() => {
            getPaymentInstruments.reset();
        });

        it('should be a function', () => {
            expect(isUniqueCreditCardToken).to.be.a('function');
        });

        it('should return false if credit card token is present in a wallet', () => {
            expect(isUniqueCreditCardToken(customerPaymentInstruments, creditCartTokenTest)).to.be.false;
        });

        it('should return true if credit card token is not present in a wallet', () => {
            payInst2.creditCardToken = '1234asdF';
            expect(isUniqueCreditCardToken(customerPaymentInstruments, creditCartTokenTest)).to.be.true;
        });

        it('should return true if wallet is empty', () => {
            getPaymentInstruments.withArgs(payPalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD).returns({
                toArray: () => []
            });

            expect(isUniqueCreditCardToken(customerPaymentInstruments, creditCartTokenTest)).to.be.true;
        });
    });

    describe('isSavingCreditCardAvailable', () => {
        let savedCreditCards;

        const isSavingCreditCardAvailable = creditCardHelper.__get__('isSavingCreditCardAvailable');
        const card1 = {
            creditCardHolder: 'Kuzmich',
            creditCardExpirationYear: 2026,
            creditCardExpirationMonth: 1,
            creditCardType: 'Visa',
            paymentMethod: 'PAYPAL_CREDIT_CARD'
        };

        const card2 = {
            creditCardHolder: 'Sliverofstraw',
            creditCardExpirationYear: 2027,
            creditCardExpirationMonth: 4,
            creditCardType: 'MasterCard',
            paymentMethod: 'PAYPAL_CREDIT_CARD'
        };

        const card3 = {
            creditCardHolder: 'Shrek',
            creditCardExpirationYear: 2025,
            creditCardExpirationMonth: 10,
            creditCardType: 'Visa',
            paymentMethod: 'PAYPAL_CREDIT_CARD'
        };

        it('should be a function', () => {
            expect(isSavingCreditCardAvailable).to.be.a('function');
        });

        it('should return false if quantity of cards is equal to limit value', () => {
            savedCreditCards = [card1, card2, card3];
            expect(isSavingCreditCardAvailable(savedCreditCards)).to.be.false;
        });

        it('should return true if quantity of cards is less than limit value', () => {
            savedCreditCards = [card1, card2];
            expect(isSavingCreditCardAvailable(savedCreditCards)).to.be.true;
        });

        it('should return false if quantity of cards is greater than limit value', () => {
            savedCreditCards = [card1, card2, card3];
            prefs.creditCardVaultLimit = 2;
            expect(isSavingCreditCardAvailable(savedCreditCards)).to.be.false;
        });

        it('should return true if cards limit is unlimited', () => {
            prefs.creditCardVaultLimit = payPalConstants.CC_SAVE_LIMIT_UNLIMITED;
            expect(isSavingCreditCardAvailable(savedCreditCards)).to.be.true;
        });
    });

    describe('setStoredCredential function', () => {
        const setStoredCredential = creditCardHelper.__get__('setStoredCredential');

        const createExpectedResult = (payment_initiator, payment_type, usage) => ({
            payment_initiator,
            payment_type,
            usage
        });

        it('should return correct data for sale flow with vault disabled and no vault ID', () => {
            const orderData = { body: { intent: payPalConstants.INTENT_CAPTURE } };
            const paymentSourceData = { card: { vault_id: null, attributes: { vault: null } } };
            const result = setStoredCredential(orderData, paymentSourceData);

            expect(result).to.deep.equal(createExpectedResult('CUSTOMER', 'ONE_TIME', 'DERIVED'));
        });

        it('should return correct data for sale flow with vault enabled while not saving card', () => {
            const orderData = { body: { intent: payPalConstants.INTENT_CAPTURE } };
            const paymentSourceData = { card: { vault_id: null, attributes: { vault: null } } };

            prefs.creditCardVaultModeEnabled = true;

            const result = setStoredCredential(orderData, paymentSourceData);

            expect(result).to.deep.equal(createExpectedResult('CUSTOMER', 'ONE_TIME', 'DERIVED'));
        });

        it('should return correct data for sale flow with vault enabled while saving card', () => {
            const orderData = { body: { intent: payPalConstants.INTENT_CAPTURE } };
            const paymentSourceData = {
                card: { vault_id: null, attributes: { vault: { store_in_vault: 'ON_SUCCESS' } } }
            };

            prefs.creditCardVaultModeEnabled = true;

            const result = setStoredCredential(orderData, paymentSourceData);

            expect(result).to.deep.equal(createExpectedResult('CUSTOMER', 'ONE_TIME', 'FIRST'));
        });

        it('should return correct data for sale flow with vaulted card', () => {
            const orderData = { body: { intent: payPalConstants.INTENT_CAPTURE } };
            const paymentSourceData = { card: { vault_id: 'vaulted_card_id', attributes: { vault: {} } } };
            const result = setStoredCredential(orderData, paymentSourceData);

            expect(result).to.deep.equal(createExpectedResult('CUSTOMER', 'ONE_TIME', 'SUBSEQUENT'));
        });

        it('should return correct data for authorize flow with no vault ID', () => {
            const orderData = { body: { intent: payPalConstants.INTENT_AUTHORIZE } };
            const paymentSourceData = { card: { vault_id: null, attributes: { vault: null } } };
            const result = setStoredCredential(orderData, paymentSourceData);

            expect(result).to.deep.equal(createExpectedResult('CUSTOMER', 'ONE_TIME', 'DERIVED'));
        });
    });

    describe('processCardData function', () => {
        const lineItemCtnr = {
            customerEmail: 'email',
            billingAddress: {
                phone: '9234567890'
            }
        };

        const orderData = {
            body: {
                intent: 'CAPTURE'
            }
        };

        const paymentSourceData = {
            card: {
                vault_id: null,
                attributes: {
                    vault: {
                        store_in_vault: 'ON_SUCCESS'
                    }
                }
            }
        };

        const processCardData = creditCardHelper.__get__('processCardData');

        const getCustomerDataStub = stub();
        const setStoredCredentialStub = stub();

        creditCardHelper.__set__('setStoredCredential', setStoredCredentialStub);
        creditCardHelper.__set__('getCustomerData', getCustomerDataStub);

        beforeEach(() => {
            getCustomerDataStub.reset();
            setStoredCredentialStub.reset();
        });

        after(() => {
            creditCardHelper.__ResetDependency__('setStoredCredential');
            creditCardHelper.__ResetDependency__('getCustomerData');
        });

        it('should call setStoredCredential and getCustomerData when 3D Secure is enabled', () => {
            prefs.isThreeDSecureEnabled = true;

            processCardData(lineItemCtnr, orderData, paymentSourceData);

            expect(setStoredCredentialStub.calledOnce).to.be.true;
            expect(getCustomerDataStub.calledOnce).to.be.true;
        });

        it('should not call setStoredCredential and getCustomerData when 3D Secure is disabled', () => {
            prefs.isThreeDSecureEnabled = false;

            processCardData(lineItemCtnr, orderData, paymentSourceData);

            expect(setStoredCredentialStub.called).to.be.false;
            expect(getCustomerDataStub.called).to.be.true;
        });
    });

    describe('completeFastlaneOrder', () => {
        const purchaseUnit = {};
        const order = {
            custom: {}
        };

        before(() => {
            session = {
                privacy: {
                    paymentToken: 'feruwfie'
                }
            };

            paymentInstrument.paymentTransaction = {
                transactionID: 'transactionId'
            };

            createOrder.returns({
                resp: {
                    id: 'orderId'
                }
            });

            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            createOrder.reset();
            createErrorLog.reset();
            dw.system.Transaction.wrap.restore();
            session.privacy = null;
        });

        it('should be a function', () => {
            expect(creditCardHelper.completeFastlaneOrder).to.be.a('function');
        });

        it('should return an object', () => {
            prefs.isThreeDSecureEnabled = false;

            expect(creditCardHelper.completeFastlaneOrder(purchaseUnit, order, paymentInstrument)).to.be.an('object');
        });

        it('should return authorize === true if order is created', () => {
            prefs.isThreeDSecureEnabled = false;

            expect(creditCardHelper.completeFastlaneOrder(purchaseUnit, order, paymentInstrument)).that.deep.equal({
                authorized: true
            });
        });

        it('should return an error object if createOrder thrown an error', () => {
            const errorMsg = 'An error occurred';

            createOrder.returns({
                err: errorMsg
            });

            expect(creditCardHelper.completeFastlaneOrder(purchaseUnit, order, paymentInstrument)).that.deep.equal({
                error: true,
                authorized: false,
                fieldErrors: [],
                serverErrors: [errorMsg],
                message: errorMsg
            });

            expect(createErrorLog.calledOnce).to.be.true;
        });

        it('should return an error object if status is DECLINED', () => {
            getTransactionStatus.returns('DECLINED');

            expect(creditCardHelper.completeFastlaneOrder(purchaseUnit, order, paymentInstrument)).that.deep.equal({
                error: true,
                errorMessage: 'The card has been declined. Try using another one.'
            });
        });

        it('should return an object when isThreeDSecureEnabled', () => {
            prefs.isThreeDSecureEnabled = true;

            expect(creditCardHelper.completeFastlaneOrder(purchaseUnit, order, paymentInstrument)).to.be.an('object');
        });
    });
});
