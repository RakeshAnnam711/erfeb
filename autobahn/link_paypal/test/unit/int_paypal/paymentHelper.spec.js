/* eslint-disable object-curly-newline */

const { int_paypal: { paymentHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { stub, createStubInstance } = require('sinon');
const { describe, it, before, after, beforeEach } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const originalSession = global.session;

const pluralize = stub();
const customerModel = stub();
const getExpirationMonthDiff = stub();
const sdkConfig = {
    applePayButtonConfig: {
        billing: {
            buttonStyle: 'black',
            type: 'pay'
        },
        cart: {
            buttonStyle: 'black',
            type: 'pay'
        },
        minicart: {
            buttonStyle: 'black',
            type: 'pay'
        },
        pdp: {
            buttonStyle: 'black',
            type: 'pay'
        },
        pvp: {
            buttonStyle: 'black',
            type: 'pay'
        }
    }
};

const prefs = {
    creditCardExpireNotification: -1,
    applePayLabel: 'demo',
    applePaySdk: 'sdk',
    applePayButtonLocation: 'miniCart,cart',
    paypalButtonMessagesLocation: 'MiniCart',
    isPayNowFlowEnabled: false,
    isDigitalGoodsFlowEnabled: false,
    isGooglePayActive: true,
    ppVaultEnabled: true,
    returningCustomerExperienceEnabled: true,
    payPalButtonLocation: 'miniCart,cart,pdp',
    googleMerchantId: '1234567890KH4EVER',
    isFastlanePaymentUiEnabled: false,
    isVenmoEnabled: true
};

const paypalConstants = {
    FLASH_MESSAGE_DANGER: 'danger',
    FLASH_MESSAGE_WARNING: 'warning',
    APPLE_PAY_TOTAL_TYPE_FINAL: 'final',
    PAGE_FLOW_CART: 'cart',
    PAGE_FLOW_BILLING: 'billing',
    PAYMENT_METHOD_ID_APPLE_PAY: 'ApplePay',
    APPLE_PAY_TAB_IMAGE_ALT: 'Apple Pay',
    PAY_LATER_MESSAGING_BANNER: 'payLaterMessagingBanner',
    PAYPAL_BUTTON_MESSAGE: 'paypalButtonMessage',
    WRONG_PAYPAL_BUTTON: 'wrongButton',
    PAYPAL_BUTTON_LOCATION: 'paypal',
    APPLE_PAY_BUTTON_LOCATION: 'applePay',
    GOOGLE_PAY_BUTTON_LOCATION: 'googlePay',
    VENMO_BUTTON_LOCATION: 'venmo'
};

customerModel.FLASH_MESSAGE_DANGER = 'danger';
customerModel.FLASH_MESSAGE_WARNING = 'warning';

const fastlaneStyleOptions = {
    flexible: {
        root: {
            backgroundColorPrimary: '#f9f9f9'
        },
        branding: 'light'
    },
    component: {
        root: {
            backgroundColor: '#f9f9f9'
        },
        input: {
            backgroundColor: '#ffffff'
        }
    }
};

const paymentHelper = proxyquire(paymentHelperPath, {
    'dw/web/Resource': dw.web.Resource,
    'dw/order/PaymentMgr': dw.order.PaymentMgr,
    'dw/system/Transaction': dw.system.Transaction,
    'dw/web/URLUtils': {
        https: () => {
            return 'https://url/with/urlArgs';
        },
        url: () => {
            return 'https://url/with/urlArgs';
        }
    },
    '*/cartridge/models/customer': customerModel,
    '*/cartridge/config/preferences': prefs,
    '*/cartridge/config/constants': paypalConstants,
    '*/cartridge/scripts/util/basicHelpers': {
        pluralize,
        getExpirationMonthDiff
    },
    '~/cartridge/config/sdkConfig': sdkConfig,
    'dw/value/Money': () => ({
        value: 0,
        add: (amount) => amount
    }),
    '~/cartridge/scripts/paypal/helpers/buttonConfigHelper': {
        getInstanceType: () => 'TEST'
    },
    '~/cartridge/config/fastlaneStyleOptions': fastlaneStyleOptions
});

describe('paymentHelper file', () => {
    describe('getExpirationDataForCC', () => {
        const creditCard = {
            creditCardExpirationMonth: 3,
            creditCardExpirationYear: 2023
        };

        const listOfKeys = ['expireNotification', 'expireStyle', 'expireMessage'];

        before(() => {
            stub(dw.web.Resource, 'msg');
            stub(dw.web.Resource, 'msgf');

            pluralize.returns('month');
            getExpirationMonthDiff.returns(8);

            dw.web.Resource.msg.withArgs('paypal.creditcard.expired', 'paypalerrors', null).returns('Expired');
            dw.web.Resource.msg.withArgs('paypal.creditcard.expires.thismonth', 'paypalerrors', null).returns('Expires this month');
            dw.web.Resource.msgf.withArgs('paypal.creditcard.expires', 'paypalerrors', null, 1, 'month').returns('Expires in 1 month');
        });

        after(() => {
            pluralize.reset();
            getExpirationMonthDiff.reset();

            dw.web.Resource.msg.restore();
            dw.web.Resource.msgf.restore();
        });

        it('should return null if expire notification is disabled', () => {
            expect(paymentHelper.getExpirationDataForCC(creditCard)).to.be.null;
        });

        it('should return null if expire notification is enabled and month difference is more than max expire value', () => {
            prefs.creditCardExpireNotification = 0;

            expect(paymentHelper.getExpirationDataForCC(creditCard)).to.be.null;
        });

        it('should return an object if expire notification is enabled (pref equal to -1 - expired)', () => {
            getExpirationMonthDiff.returns(-1);

            const val = paymentHelper.getExpirationDataForCC(creditCard);

            expect(val).to.be.an('object').that.has.all.keys(listOfKeys);

            expect(val).to.be.deep.equal({
                expireNotification: true,
                expireStyle: 'danger',
                expireMessage: 'Expired'
            });
        });

        it('should return an object if expire notification is enabled (pref equal to 1 - expires this month)', () => {
            prefs.creditCardExpireNotification = 1;
            getExpirationMonthDiff.returns(0);

            const val = paymentHelper.getExpirationDataForCC(creditCard);

            expect(val).to.be.an('object').that.has.all.keys(listOfKeys);

            expect(val).to.be.deep.equal({
                expireNotification: true,
                expireStyle: 'warning',
                expireMessage: 'Expires this month'
            });
        });

        it('should return an object if expire notification is enabled (pref equal to 1 - expires in 1 month)', () => {
            prefs.creditCardExpireNotification = 1;
            getExpirationMonthDiff.returns(1);

            const val = paymentHelper.getExpirationDataForCC(creditCard);

            expect(val).to.be.an('object').that.has.all.keys(listOfKeys);

            expect(val).to.be.deep.equal({
                expireNotification: true,
                expireStyle: 'warning',
                expireMessage: 'Expires in 1 month'
            });
        });

        it('should return an object if expire notification is enabled (pref equal to 2 - expires in 2 month)', () => {
            prefs.creditCardExpireNotification = 2;
            pluralize.returns('months');
            getExpirationMonthDiff.returns(2);

            dw.web.Resource.msgf.withArgs('paypal.creditcard.expires', 'paypalerrors', null, 2, 'months').returns('Expires in 2 months');

            const val = paymentHelper.getExpirationDataForCC(creditCard);

            expect(val).to.be.an('object').that.has.all.keys(listOfKeys);

            expect(val).to.be.deep.equal({
                expireNotification: true,
                expireStyle: 'warning',
                expireMessage: 'Expires in 2 months'
            });
        });

        it('should return an object if expire notification is enabled (pref equal to 3 - expires in 3 month)', () => {
            prefs.creditCardExpireNotification = 3;
            pluralize.returns('months');
            getExpirationMonthDiff.returns(3);

            dw.web.Resource.msgf.withArgs('paypal.creditcard.expires', 'paypalerrors', null, 3, 'months').returns('Expires in 3 months');

            const val = paymentHelper.getExpirationDataForCC(creditCard);

            expect(val).to.be.an('object').that.has.all.keys(listOfKeys);
            expect(val).to.be.deep.equal({
                expireNotification: true,
                expireStyle: 'warning',
                expireMessage: 'Expires in 3 months'
            });
        });
    });

    describe('addExpirationDataForCC', () => {
        const creditCard = {
            creditCardExpirationMonth: 12,
            creditCardExpirationYear: 2023
        };

        before(() => {
            stub(paymentHelper, 'getExpirationDataForCC').returns(null);
        });

        after(() => {
            paymentHelper.getExpirationDataForCC.restore();
        });

        it('credit card data should be the same', () => {
            expect(paymentHelper.addExpirationDataForCC(creditCard)).to.be.undefined;
            expect(creditCard).to.deep.equal({
                creditCardExpirationMonth: 12,
                creditCardExpirationYear: 2023
            });
        });

        it('if credit card is expired than credit card will have additional props', () => {
            creditCard.creditCardExpirationMonth = 3;
            paymentHelper.getExpirationDataForCC.returns({
                expireNotification: true,
                expireStyle: 'danger',
                expireMessage: 'Expired'
            });

            expect(paymentHelper.addExpirationDataForCC(creditCard)).to.be.undefined;
            expect(creditCard).to.deep.equal({
                creditCardExpirationMonth: 3,
                creditCardExpirationYear: 2023,
                expireNotification: true,
                expireStyle: 'danger',
                expireMessage: 'Expired'
            });
        });
    });

    describe('getExpirationNotificationForCC', () => {
        let notificationObj = {};

        const creditCard = {
            expireNotification: false,
            expireStyle: 'danger'
        };

        let paymentInstrument = {
            custom: { paypalCreditCardExpirationNotice: null }
        };

        beforeEach(() => {
            notificationObj = {};
        });

        before(() => {
            stub(dw.web.Resource, 'msg');

            global.session = originalSession;
            global.session.custom.ccExpiredNotice = null;

            dw.web.Resource.msg.withArgs('creditcard.notification.expired', 'account', null).returns('credit card notification expired');
            dw.web.Resource.msg.withArgs('creditcard.notification.expiresoon', 'account', null).returns('credit card notification expire soon');
        });

        after(() => {
            global.session = originalSession;

            dw.web.Resource.msg.restore();
        });

        it('if expireNotification equal to false or not exist in object', () => {
            expect(paymentHelper.getExpirationNotificationForCC(notificationObj, creditCard, paymentInstrument)).to.be.undefined;
            expect(notificationObj).to.be.empty;
        });

        it('if expireStyle equal to `danger` and session custom ccExpiredNotice is not true', () => {
            creditCard.expireNotification = true;

            expect(paymentHelper.getExpirationNotificationForCC(notificationObj, creditCard, paymentInstrument)).to.be.undefined;
            expect(notificationObj).to.be.empty;
        });

        it('if expireStyle equal to `danger` and session custom ccExpiredNotice equal to true', () => {
            global.session.custom.ccExpiredNotice = true;

            expect(paymentHelper.getExpirationNotificationForCC(notificationObj, creditCard, paymentInstrument)).to.be.undefined;
            expect(notificationObj).to.be.not.empty;
            expect(notificationObj).to.be.deep.equal({ type: 'danger', message: 'credit card notification expired' });
            expect(global.session.custom).to.not.have.property('ccExpiredNotice');
        });

        it('if expireStyle equal `warning`, paypalCreditCardExpirationNotice equal false and existing type in notificationObj not equal `danger`', () => {
            creditCard.expireStyle = 'warning';

            paymentInstrument = createStubInstance(dw.customer.CustomerPaymentInstrument);
            paymentInstrument.custom.paypalCreditCardExpirationNotice = false;

            expect(paymentHelper.getExpirationNotificationForCC(notificationObj, creditCard, paymentInstrument)).to.be.undefined;
            expect(notificationObj).to.be.not.empty;
            expect(notificationObj).to.be.deep.equal({ type: 'warning', message: 'credit card notification expire soon' });
        });

        it('if expireStyle equal `warning`, paypalCreditCardExpirationNotice equal false and existing type in notificationObj equal `danger`', () => {
            notificationObj = { type: 'danger', message: 'credit card notification expired' };

            expect(paymentHelper.getExpirationNotificationForCC(notificationObj, creditCard, paymentInstrument)).to.be.undefined;
            expect(notificationObj).to.be.not.empty;
            expect(notificationObj).to.be.deep.equal({ type: 'danger', message: 'credit card notification expired' });
        });

        it('if expireStyle equal `warning`, paypalCreditCardExpirationNotice equal true and existing type in notificationObj not equal `danger`', () => {
            paymentInstrument = createStubInstance(dw.customer.CustomerPaymentInstrument);
            paymentInstrument.custom.paypalCreditCardExpirationNotice = true;

            expect(paymentHelper.getExpirationNotificationForCC(notificationObj, creditCard, paymentInstrument)).to.be.undefined;
            expect(notificationObj).to.be.empty;
        });
    });

    describe('addExpirationNotificationForCC', () => {
        const creditCardList = [];

        before(() => {
            global.session = originalSession;
            global.session.custom.ccExpiredNotice = null;

            customerModel.returns({
                addFlashMessage: () => undefined
            });

            stub(dw.web.Resource, 'msg');
            stub(paymentHelper, 'getExpirationDataForCC');

            dw.web.Resource.msg.withArgs('creditcard.notification.expired', 'account', null).returns('credit card notification expired');
            dw.web.Resource.msg.withArgs('creditcard.notification.expiresoon', 'account', null).returns('credit card notification expire soon');
        });

        after(() => {
            global.session = originalSession;
            customerModel.reset();
            paymentHelper.getExpirationDataForCC.restore();
            dw.web.Resource.msg.restore();
        });

        it('should exit from function if list of credit cards is empty', () => {
            expect(paymentHelper.addExpirationNotificationForCC(creditCardList)).to.be.undefined;
        });

        it('if credit card is not expired/expires soon', () => {
            creditCardList.push({
                creditCardExpirationYear: '2023',
                creditCardExpirationMonth: '4',
                creditCardType: 'Visa',
                maskedCreditCardNumber: '***********1119',
                custom: {}
            });

            paymentHelper.getExpirationDataForCC.returns(null);

            expect(paymentHelper.addExpirationNotificationForCC(creditCardList)).to.be.undefined;
        });

        it('if credit card is expires soon', () => {
            paymentHelper.getExpirationDataForCC.returns({
                expireNotification: true,
                expireStyle: 'warning',
                expireMessage: 'Expires in 1 month'
            });

            expect(paymentHelper.addExpirationNotificationForCC(creditCardList)).to.be.undefined;
        });

        it('if credit card is expired', () => {
            paymentHelper.getExpirationDataForCC.returns({
                expireNotification: true,
                expireStyle: 'danger',
                expireMessage: 'Expired'
            });

            expect(paymentHelper.addExpirationNotificationForCC(creditCardList)).to.be.undefined;
        });
    });

    describe('getApplePayConfigs', () => {
        const config = {
            applePayLabel: prefs.merchantName,
            applePayTotalType: paypalConstants.APPLE_PAY_TOTAL_TYPE_FINAL,
            errorMessages: {
                applePayCancelled: 'You\'ve closed the Apple Pay window',
                applePayMerchantVerificationFailed: 'Apple Pay merchant Verification Failed',
                applePayPaymentMethodVerificationFailed: 'Apple Pay Payment Method merchant Verification Failed',
                couldNotAddProductToTheCart: 'Could not add product to the cart'
            },
            buttonConfigs: {
                locale: request.locale,
                color: sdkConfig.applePayButtonConfig.billing.buttonStyle,
                type: sdkConfig.applePayButtonConfig.billing.type
            },
            sdk: prefs.applePaySdk,
            paymentMethodId: paypalConstants.PAYMENT_METHOD_ID_APPLE_PAY,
            tabImageAlt: paypalConstants.APPLE_PAY_TAB_IMAGE_ALT,
            applePayVersion: 4,
            requiredBillingContactFields: ['name', 'phone', 'email', 'postalAddress'],
            flow: 'pdp',
            lineItemsLabels: {
                subTotal: 'subtotal',
                shipping: 'shipping',
                tax: 'tax'
            },
            isDigitalGoodsEnabled: false,
            requiredShippingContactFields: ['phone', 'email'],
            getAmountForShippingOptionUrl: 'https://url/with/urlArgs'
        };

        global.request = { locale: 'en-US' };

        before(() => {
            stub(dw.web.Resource, 'msg');

            dw.web.Resource.msg.withArgs('applepay.popup.cancelled', 'locale', null).returns(
                config.errorMessages.applePayCancelled
            );
            dw.web.Resource.msg.withArgs('applepay.popup.merchant.verification.failed', 'locale', null).returns(
                config.errorMessages.applePayMerchantVerificationFailed
            );
            dw.web.Resource.msg.withArgs('applepay.popup.payment.method.verification.failed', 'locale', null).returns(
                config.errorMessages.applePayPaymentMethodVerificationFailed
            );
            dw.web.Resource.msg.withArgs('applepay.could.not.add.product', 'locale', null).returns(
                config.errorMessages.couldNotAddProductToTheCart
            );
            dw.web.Resource.msg.withArgs('applepay.lineitems.subtotal', 'locale', null).returns(
                config.lineItemsLabels.subTotal
            );
            dw.web.Resource.msg.withArgs('applepay.lineitems.shipping', 'locale', null).returns(
                config.lineItemsLabels.shipping
            );
            dw.web.Resource.msg.withArgs('applepay.lineitems.tax', 'locale', null).returns(
                config.lineItemsLabels.tax
            );
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('should return an object', () => {
            expect(paymentHelper.getApplePayConfigs(paypalConstants.PAGE_FLOW_BILLING))
                .to.be.an('object');
        });

        it('configs.requiredShippingContactFields should contains phone and email if billing page flow', () => {
            config.flow = paypalConstants.PAGE_FLOW_BILLING;

            expect(paymentHelper.getApplePayConfigs(paypalConstants.PAGE_FLOW_BILLING)).to.deep.equal(config);
        });

        it('configs.requiredShippingContactFields should contains phone, email, name, postalAddress if cart page flow', () => {
            config.flow = paypalConstants.PAGE_FLOW_CART;
            config.requiredShippingContactFields.push('name', 'postalAddress');

            expect(paymentHelper.getApplePayConfigs(paypalConstants.PAGE_FLOW_CART)).to.deep.equal(config);
        });
    });

    describe('getAmountPaid', () => {
        let subtractResult = 100;
        let giftCertArray = [];

        const lineItemCtnr = {
            getTotalGrossPrice: () => {
                return {
                    value: 100,
                    subtract: () => {
                        return {
                            value: subtractResult
                        };
                    }
                };
            },
            getCurrencyCode: () => '',
            giftCertificatePaymentInstruments: {
                toArray: () => giftCertArray
            }
        };

        it('should not subtract giftCert amount since it is empty array', () => {
            expect(paymentHelper.getAmountPaid(lineItemCtnr)).to.deep.equal({
                value: 100
            });
        });

        it('should subtract giftCert amount ', () => {
            subtractResult = 50;

            giftCertArray = [{
                getPaymentTransaction: () => {
                    return {
                        getAmount: () => 50
                    };
                }
            }];
            expect(paymentHelper.getAmountPaid(lineItemCtnr)).to.deep.equal({
                value: 50
            });
        });
    });

    describe('isElementEnabled', () => {
        beforeEach(() => {
            prefs.googlePayButtonLocation = 'miniCart,cart,PVP';
            prefs.payLaterMessagingBannerLocation  = 'pdp,cart,category';
            prefs.paypalButtonLocation = 'billing,cart,pdp';
            prefs.applePayButtonLocation = 'minicart,cart,pdp';
            prefs.paypalButtonMessagesLocation = 'minicart, pdp';
            prefs.venmoButtonLocation = 'cart,minicart,pdp,pvp';
        });

        it('should return false for PayPal button on checkout page', () => {
            const result = paymentHelper.isElementEnabled('minicart', paypalConstants.PAYPAL_BUTTON_LOCATION);

            expect(result).to.be.false;
        });

        it('should return true for PayPal button on cart page', () => {
            const result = paymentHelper.isElementEnabled('billing', paypalConstants.PAYPAL_BUTTON_LOCATION);

            expect(result).to.be.true;
        });

        it('should return true for Apple Pay button on checkout page', () => {
            const result = paymentHelper.isElementEnabled('minicart', paypalConstants.APPLE_PAY_BUTTON_LOCATION);

            expect(result).to.be.true;
        });

        it('should return false for Apple Pal button on cart page', () => {
            const result = paymentHelper.isElementEnabled('billing', paypalConstants.APPLE_PAY_BUTTON_LOCATION);

            expect(result).to.be.false;
        });

        it('should return true for Pay Later Messaging Banner on cart page', () => {
            const result = paymentHelper.isElementEnabled('minicart', paypalConstants.PAYPAL_BUTTON_MESSAGE);

            expect(result).to.be.true;
        });

        it('should return false if no targetPage not and no elementType', () => {
            const result = paymentHelper.isElementEnabled(null, null);

            expect(result).to.be.false;
        });

        it('should return false for an empty targetPage value', () => {
            expect(paymentHelper.isElementEnabled('pdp', paypalConstants.WRONG_PAYPAL_BUTTON)).to.be.false;
        });

        it('should return true for GooglePay on minicart page', () => {
            expect(paymentHelper.isElementEnabled('minicart', paypalConstants.GOOGLE_PAY_BUTTON_LOCATION)).to.be.true;
        });

        it('should return true for Venmo on different pages and false if target page is empty', () => {
            expect(paymentHelper.isElementEnabled('cart', paypalConstants.VENMO_BUTTON_LOCATION)).to.be.true;
            expect(paymentHelper.isElementEnabled('minicart', paypalConstants.VENMO_BUTTON_LOCATION)).to.be.true;
            expect(paymentHelper.isElementEnabled('pdp', paypalConstants.VENMO_BUTTON_LOCATION)).to.be.true;
            expect(paymentHelper.isElementEnabled('pvp', paypalConstants.VENMO_BUTTON_LOCATION)).to.be.true;
            expect(paymentHelper.isElementEnabled('', paypalConstants.VENMO_BUTTON_LOCATION)).to.be.false;
        });
    });

    describe('createFastlaneConfig', () => {
        let configObj;

        it('should return object with flexible styles', () => {
            prefs.isFastlanePaymentUiEnabled = false;

            configObj = {
                styles: {
                    root: {
                        backgroundColorPrimary: '#f9f9f9'
                    },
                    branding: 'light'
                }
            };

            expect(paymentHelper.createFastlaneConfig()).to.be.equal(JSON.stringify(configObj));
        });

        it('should return object with components styles', () => {
            prefs.isFastlanePaymentUiEnabled = true;

            configObj = {
                styles: {
                    root: {
                        backgroundColor: '#f9f9f9'
                    },
                    input: {
                        backgroundColor: '#ffffff'
                    }
                }
            };

            expect(paymentHelper.createFastlaneConfig()).to.be.equal(JSON.stringify(configObj));
        });
    });

    describe('sortPaymentInstrumentsByLastModifiedDesc', () => {
        const paymentInstruments = [];
        const oneHourInMilliseconds = 60 * 60 * 1000;

        const paypalDate = new Date();
        const venmoDate = new Date(paypalDate.getTime() + oneHourInMilliseconds * 1);
        const creditCardDate = new Date(paypalDate.getTime() + oneHourInMilliseconds * 2 );

        paymentInstruments.push({ paymentMethod: 'PayPal', lastModified: paypalDate });
        paymentInstruments.push({ paymentMethod: 'Venmo', lastModified: venmoDate });
        paymentInstruments.push({ paymentMethod: 'CREDIT_CARD', lastModified: creditCardDate });

        it('should sort payment instruments by lastModified field (desc)', () => {
            const result = paymentHelper.sortPaymentInstrumentsByLastModifiedDesc(paymentInstruments);

            expect(result).to.deep.equal([
                { paymentMethod: 'CREDIT_CARD', lastModified: creditCardDate },
                { paymentMethod: 'Venmo', lastModified: venmoDate },
                { paymentMethod: 'PayPal', lastModified: paypalDate }
            ]);
        });
    });

    describe('filterValidCustomerCreditCards', () => {
        it('should keep only valid credit cards', () => {
            const customer = {
                customerPaymentInstruments: [
                    {
                        creditCardExpirationYear: '2025',
                        creditCardExpirationMonth: '12',
                        maskedCreditCardNumber: '**** **** **** 1234'
                    },
                    {
                        creditCardExpirationYear: null,
                        creditCardExpirationMonth: '12',
                        maskedCreditCardNumber: '**** **** **** 5678'
                    },
                    {
                        creditCardExpirationYear: '2026',
                        creditCardExpirationMonth: '',
                        maskedCreditCardNumber: '**** **** **** 1111'
                    },
                    {
                        creditCardExpirationYear: '2024',
                        creditCardExpirationMonth: '01',
                        maskedCreditCardNumber: null
                    }
                ]
            };

            paymentHelper.filterValidCustomerCreditCards(customer);

            expect(customer.customerPaymentInstruments).to.have.lengthOf(1);
            expect(customer.customerPaymentInstruments[0].maskedCreditCardNumber).to.equal('**** **** **** 1234');
        });

        it('should clear the array if all cards are invalid', () => {
            const customer = {
                customerPaymentInstruments: [
                    {
                        creditCardExpirationYear: null,
                        creditCardExpirationMonth: null,
                        maskedCreditCardNumber: null
                    }
                ]
            };

            paymentHelper.filterValidCustomerCreditCards(customer);

            expect(customer.customerPaymentInstruments).to.be.an('array').that.is.empty;
        });

        it('should do nothing if array is empty', () => {
            const customer = {
                customerPaymentInstruments: []
            };

            paymentHelper.filterValidCustomerCreditCards(customer);

            expect(customer.customerPaymentInstruments).to.be.an('array').that.is.empty;
        });

        it('should do nothing if customer.customerPaymentInstruments is not an array', () => {
            const customer = { customerPaymentInstruments: null };

            expect(() => paymentHelper.filterValidCustomerCreditCards(customer)).to.not.throw();
        });
    });

    describe('isVenmoEnabled', () => {
        const originalVenmoButtonLocation = prefs.venmoButtonLocation;

        let page = 'pdp';

        before(() => {
            prefs.venmoButtonLocation = 'pdp';
        });

        after(() => {
            prefs.venmoButtonLocation = originalVenmoButtonLocation;
        });

        it('should return true for PDP page', () => {
            expect(paymentHelper.isVenmoEnabled(page)).to.be.true;
        });

        it('should return false for CART page', () => {
            page = 'cart';

            expect(paymentHelper.isVenmoEnabled(page)).to.be.false;
        });

        it('should return false if Venmo is inactive', () => {
            prefs.isVenmoEnabled = false;

            expect(paymentHelper.isVenmoEnabled(page)).to.be.false;
        });
    });
});
