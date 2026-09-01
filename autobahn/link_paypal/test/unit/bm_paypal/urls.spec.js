const { bm_paypal: { urlsPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const { describe, it, beforeEach, afterEach } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

describe('paypalUrls', () => {
    let getInstanceTypeStub;

    const loadUrls = () =>
        proxyquire(urlsPath, {
            'dw/web/URLUtils': dw.web.URLUtils,
            '~/cartridge/scripts/helpers/coreHelpers': {
                getInstanceType: getInstanceTypeStub
            }
        });

    beforeEach(() => {
        stub(dw.web.URLUtils, 'url').returns({
            appendCSRFTokenBM: () => ({
                toString: () => '/action'
            }),
            toString: () => '/action'
        });

        getInstanceTypeStub = stub();
    });

    afterEach(() => {
        dw.web.URLUtils.url.restore();
    });

    it('should return an object with all keys', () => {
        getInstanceTypeStub.returns('production');

        const urls = loadUrls();

        expect(urls).to.include.all.keys([
            'applePaySDK',
            'testServiceConnection',
            'cwppConfigUrl',
            'payPalSDK',
            'googlePaySDK',
            'payPalExternalSDK',
            'newTransaction',
            'selfCheck',
            'payLaterConfiguratorSdk'
        ]);
    });

    it('should return production login URL for newTransaction', () => {
        getInstanceTypeStub.returns('production');

        const urls = loadUrls();

        expect(urls.newTransaction).to.equal('https://www.paypal.com/signin');
    });

    it('should return sandbox login URL for newTransaction when not production', () => {
        getInstanceTypeStub.returns('sandbox');

        const urls = loadUrls();

        expect(urls.newTransaction).to.equal('https://www.sandbox.paypal.com/signin');
    });
});
