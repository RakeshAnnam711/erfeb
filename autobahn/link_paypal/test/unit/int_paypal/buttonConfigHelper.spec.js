const { expect } = require('chai');
const { int_paypal: { buttonConfigHelperPath } } = require('../path.json');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const payPalPrefs = {
    cwppButtonStyles: {
        'login': {
            theme: 'blue', buttonType: 'CWP', buttonSize: 'md', buttonShape: 'rect'
        },
        'billing': {
            theme: 'blue', buttonType: 'CWP', buttonSize: 'lg', buttonShape: 'pill'
        }
    },
    disableFundingList: [],
    enabledLPMs: [],
    instanceType: 'sandbox'
};

const paypalConstants = {
    PAGE_FLOW_LOGIN: 'login',
    PAGE_FLOW_BILLING: 'billing',
    PRODUCTION_SYSTEM_TYPE: 'PRODUCTION',
    DEVELOPMENT_SYSTEM_TYPE: 'TEST'
};

const Resource = {
    msg: stub()
};

const dwSystemTest = {
    PRODUCTION_SYSTEM: 0
};

const getLocaleWithHyphen = stub();

const buttonConfigHelper = require('proxyquire').noCallThru()(buttonConfigHelperPath, {
    '*/cartridge/config/preferences': payPalPrefs,
    '*/cartridge/scripts/paypal/utils': {
        getClientId: () => 'client-id'
    },
    '*/cartridge/config/urls': {
        cwppUrl: 'cwpp-url'
    },
    '*/cartridge/config/sdkConfig': {
        cwppScores: 'address'
    },
    '*/cartridge/config/constants': paypalConstants,
    '*/cartridge/scripts/util/basicHelpers': {
        getLocaleWithHyphen: getLocaleWithHyphen
    },
    'dw/web/Resource': Resource,
    'dw/system/System': dwSystemTest
});

describe('buttonConfigHelper file', () => {
    describe('getAvailableLPMSArray', () => {
        before(() => {
            payPalPrefs.enabledLPMs = ['mybank'];
            payPalPrefs.disableFundingList = ['bancontact', 'venmo'];
        });

        after(() => {
            payPalPrefs.enabledLPMs = [];
            payPalPrefs.disableFundingList = [];
        });

        it('if disableFundingList contains lpm', () => {

            expect(buttonConfigHelper.getAvailableLPMSArray()).to.be.an('array').that.includes('mybank');
        });

        it('if disableFundingList contains all available LPMs', () => {
            payPalPrefs.disableFundingList.push('mybank');

            expect(buttonConfigHelper.getAvailableLPMSArray()).to.be.an('array').that.is.empty;
        });
    });

    describe('getLPMSMessages', () => {
        const POPUP_CLOSED_MSG = 'Customer closed Local Payment Window before authorizing';
        const PAYMENT_NOT_PROCEED_MSG = 'Please wait while your payment is being processed.';

        before(() => {
            Resource.msg.withArgs('locale.payment.method.popup.closed.message', 'locale', null).returns(POPUP_CLOSED_MSG);
            Resource.msg.withArgs('locale.payment.method.payment.not.proceed.message', 'locale', null).returns(PAYMENT_NOT_PROCEED_MSG);
        });

        after(() => {
            Resource.msg.reset();
        });

        it('should return LPM messages', () => {
            const result = buttonConfigHelper.getLPMSMessages();

            expect(result).to.have.property('closedPopupErrorMsg').to.be.equal(POPUP_CLOSED_MSG);
            expect(result).to.have.property('paymentNotProceedMsg').to.be.equal(PAYMENT_NOT_PROCEED_MSG);
        });
    });

    describe('createCwppButtonConfig', () => {
        const configKeysResult = [
            'fullPage', 'responseType', 'containerid', 'scopes',
            'theme', 'buttonSize', 'buttonShape', 'buttonType', 'labelType',
            'appid', 'locale', 'returnurl', 'authend'
        ];

        const originalRequest = request;

        before(() => {
            request.getLocale = () => 'default';
            getLocaleWithHyphen.returns('en-us');
        });

        after(() => {
            getLocaleWithHyphen.reset();
            request = originalRequest;
        });

        it('should return an object with config for login flow', () => {
            const val = buttonConfigHelper.createCwppButtonConfig('login');

            expect(val).to.be.an('object').that.is.not.empty;
            expect(val).to.have.all.keys(configKeysResult);
        });

        it('should return an object with config for billing flow', () => {
            const val = buttonConfigHelper.createCwppButtonConfig('billing');

            expect(val).to.be.an('object').that.is.not.empty;
            expect(val).to.have.all.keys(configKeysResult);
        });

        it('should return empty object for minicart flow', () => {
            const val = buttonConfigHelper.createCwppButtonConfig('minicart');

            expect(val).to.be.an('object').that.is.empty;
        });

        it('should return empty object for cart flow', () => {
            const val = buttonConfigHelper.createCwppButtonConfig('cart');

            expect(val).to.be.an('object').that.is.empty;
        });

        it('should return empty object for pdp flow', () => {
            const val = buttonConfigHelper.createCwppButtonConfig('pdp');

            expect(val).to.be.an('object').that.is.empty;
        });
    });

    describe('getInstanceType', () => {
        it('should return sandbox instance type', () => {
            expect(buttonConfigHelper.getInstanceType()).to.be.equal('TEST');
        });
    });
});
