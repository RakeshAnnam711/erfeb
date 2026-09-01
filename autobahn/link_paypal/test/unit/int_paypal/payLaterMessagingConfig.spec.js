const { int_paypal: { payLaterMessagingConfigPath } } = require('../path.json');

const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const payLaterMessagingConfig = proxyquire(payLaterMessagingConfigPath, {
    'dw/system/Site': {
        current: {
            getCustomPreferenceValue: () => JSON.stringify({
                cart: {},
                pdp: {},
                category: {}
            })
        }
    }
});

describe('payLaterMessagingConfig', () => {
    it('response type should be object', () => {
        expect(payLaterMessagingConfig).to.be.a('object');
    });

    it('response object should has property cart', () => {
        expect(payLaterMessagingConfig).has.property('cart');
    });

    it('response object property cart is object', () => {
        expect(payLaterMessagingConfig.cart).to.be.a('object');
    });

    it('response object should has property pdp', () => {
        expect(payLaterMessagingConfig).has.property('pdp');
    });

    it('response object property pdp is object', () => {
        expect(payLaterMessagingConfig.pdp).to.be.a('object');
    });

    it('response object should has property category', () => {
        expect(payLaterMessagingConfig).has.property('category');
    });

    it('response object property category is object', () => {
        expect(payLaterMessagingConfig.category).to.be.a('object');
    });
});
