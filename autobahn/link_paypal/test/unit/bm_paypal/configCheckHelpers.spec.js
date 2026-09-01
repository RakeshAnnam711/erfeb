const { describe, it, before, after } = require('mocha');

const { expect } = require('chai');
const { stub } = require('sinon');

const { bm_paypal: { configCheckHelpersPath } } = require('../path.json');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const PaymentMgrStub = {
    getPaymentMethod: stub()
};

const ResourceStub = {
    // eslint-disable-next-line max-params
    msgf: stub().callsFake((key, scope, option, args) => `${key} - ${args}`)
};

const SiteStub = {
    getCurrent: stub()
};

const serviceStub = {
    call: stub(),
    getResponse: stub()
};

const configCheckHelpers = require('proxyquire').noCallThru()(configCheckHelpersPath, {
    'dw/web/Resource': ResourceStub,
    'dw/system/Site': SiteStub,
    'dw/order/PaymentMgr': PaymentMgrStub,
    '~/cartridge/config/configCheckFlow': {
        'paymentMethods': [
            {
                'name': 'PayPal',
                'primary': true,
                'id': 'PayPal',
                'processorID': 'PayPalProcessor'
            },
            {
                'name': 'GooglePay',
                'primary': false,
                'id': 'GooglePay',
                'processorID': 'GooglePayProcessor'
            }
        ],
        'flows': [
            { name: 'PaymentFlow', paymentDependency: ['paypal'], prefsDependency: [] },
            { name: 'PreferenceFlow', paymentDependency: [], prefsDependency: ['locale'] }
        ]
    },
    '*/cartridge/scripts/service/paypalREST': () => serviceStub
});

describe('configCheckHelpers file', () => {
    describe('checkPreference', () => {
        const checkPreference = configCheckHelpers.__get__('checkPreference');

        before(() => {
            SiteStub.getCurrent.returns({
                getCustomPreferenceValue: stub().callsFake((prefName) => {
                    switch (prefName) {
                        case 'validPref':
                            return { value: 'validValue' };
                        case 'emptyPref':
                            return { value: '' };
                        case 'nullPref':
                            return { value: '' };
                        default:
                            return { value: undefined };
                    }
                })
            });
        });

        after(() => {
            SiteStub.getCurrent.reset();
        });

        it('should validate preferences correctly', () => {
            const preferences = [
                { name: 'validPref', values: ['validValue'] },
                { name: 'emptyPref', values: ['filled'] },
                { name: 'nullPref', values: ['anyValue'] }
            ];

            const result = checkPreference(preferences);

            expect(result.length).to.equal(1);
            expect(result[0].isValid).to.be.false;
            expect(result[0].alert).to.include('error.unconfigured.preference - nullPref');
        });

        it('should handle preferences with no validation issues', () => {
            const preferences = [
                { name: 'validPref', values: ['validValue'] }
            ];

            const result = checkPreference(preferences);

            expect(result.length).to.equal(0);
        });
    });

    describe('getResponseFromService', function() {
        it('should handle successful service calls', function() {
            const expectedResponse = { data: 'User Info' };

            serviceStub.call.returns({ ok: true });
            serviceStub.getResponse.returns(expectedResponse);

            const result = configCheckHelpers.getResponseFromService();

            expect(serviceStub.call.calledWith({
                method: 'GET',
                path: 'v1/identity/openidconnect/userinfo?schema=openid'
            })).to.be.true;
            expect(result).to.include(expectedResponse);
            expect(result.service).to.equal(serviceStub);
            expect(result.path).to.equal('v1/identity/openidconnect/userinfo?schema=openid');
        });

        it('should handle failed service calls', function() {
            const expectedError = { msg: 'Error', error: 'Service failed' };

            serviceStub.call.returns(expectedError);
            serviceStub.getResponse.returns(null);

            const result = configCheckHelpers.getResponseFromService();

            expect(result.msg).to.equal('Error');
            expect(result.error).to.equal('Service failed');
            expect(result.service).to.equal(serviceStub);
            expect(result.path).to.equal('v1/identity/openidconnect/userinfo?schema=openid');
        });
    });

    describe('checkPaymentMethod', () => {
        after(() => {
            PaymentMgrStub.getPaymentMethod.reset();
        });

        it('should validate payment methods correctly', () => {
            PaymentMgrStub.getPaymentMethod.callsFake((id) => ({
                active: true,
                paymentProcessor: { ID: id + 'Processor' }
            }));

            const payments = ['PayPal', 'GooglePay'];
            const result = configCheckHelpers.checkPaymentMethod(payments);

            expect(result.checkedPayments.length).to.equal(2);
            expect(result.unconfiguredPayments.length).to.equal(0);
        });

        it('should handle inactive and incorrect processor payments', () => {
            PaymentMgrStub.getPaymentMethod.callsFake((id) => ({
                active: id !== 'PayPal',
                paymentProcessor: { ID: 'wrongProcessor' }
            }));

            const payments = ['PayPal', 'GooglePay'];
            const result = configCheckHelpers.checkPaymentMethod(payments);

            expect(result.checkedPayments.length).to.equal(2);
            expect(result.unconfiguredPayments.length).to.equal(2);
        });

        it('should return empty arrays when no payments are provided', () => {
            const result = configCheckHelpers.checkPaymentMethod([]);

            expect(result.checkedPayments).to.be.an('array').that.is.empty;
            expect(result.unconfiguredPayments).to.be.an('array').that.is.empty;
        });
    });

    describe('checkFlow', () => {
        after(() => {
            configCheckHelpers.__ResetDependency__('checkPaymentMethod');
            configCheckHelpers.__ResetDependency__('checkPreference');
        });

        it('should validate flows correctly', () => {
            configCheckHelpers.__set__('checkPaymentMethod', () => ({ unconfiguredPayments: [] }));
            configCheckHelpers.__set__('checkPreference', () => ([]));

            const flows = ['PaymentFlow', 'PreferenceFlow'];
            const result = configCheckHelpers.checkFlow(flows);

            expect(result.length).to.equal(2);
            expect(result[0].isValid).to.be.true;
            expect(result[1].isValid).to.be.true;
        });

        it('should handle unconfigured payment methods', () => {
            configCheckHelpers.__set__('checkPaymentMethod', () => ({
                unconfiguredPayments: [{ alert: 'Payment method not configured' }]
            }));

            const flows = ['PaymentFlow'];
            const result = configCheckHelpers.checkFlow(flows);

            expect(result[0].isValid).to.be.false;
            expect(result[0].errors.payments).to.include('Payment method not configured');
        });

        it('should handle unconfigured preferences', () => {
            configCheckHelpers.__set__('checkPreference', () => (
                [{ alert: 'Preference not configured' }]
            ));

            const flows = ['PreferenceFlow'];
            const result = configCheckHelpers.checkFlow(flows);

            expect(result[0].isValid).to.be.false;
            expect(result[0].errors.prefs).to.include('Preference not configured');
        });

        it('should return default flowObj if flowConfig is not found', () => {
            const flows = ['NonExistentFlow'];

            const result = configCheckHelpers.checkFlow(flows);

            expect(result).to.have.length(1);
            expect(result[0].name).to.equal('NonExistentFlow');
            expect(result[0].isValid).to.be.undefined;
            expect(result[0].errors).to.deep.equal({ payments: [], prefs: [] });
        });

    });
});
