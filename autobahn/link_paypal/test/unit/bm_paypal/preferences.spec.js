const { bm_paypal: { preferencesPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
// eslint-disable-next-line object-curly-newline
const { it, describe, after } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const fakeGetCurrent = stub(dw.system.Site, 'getCurrent');
const fakeGetCustomPreferenceValue = stub().returns(JSON.stringify({}));

fakeGetCurrent.returns({
    getCustomPreferenceValue: fakeGetCustomPreferenceValue
});

fakeGetCustomPreferenceValue.withArgs('PP_Button_Location').returns('');
fakeGetCustomPreferenceValue.withArgs('PP_Google_Pay_Button_Location').returns('');
fakeGetCustomPreferenceValue.withArgs('PP_Message_Button_Location').returns('');

const preferences = proxyquire(preferencesPath, {
    'dw/system/Site': dw.system.Site,
    'dw/svc/LocalServiceRegistry': {
        createService: () => ({
            configuration: {
                credential: {
                    user: 'client-id'
                }
            }
        })
    },
    '~/cartridge/scripts/helpers/coreHelpers': {
        tryParseJSON: text => JSON.parse(text)
    }
});

describe('paypalPreferences', () => {
    after(() => {
        fakeGetCurrent.restore();
        fakeGetCustomPreferenceValue.reset();
    });

    it('should return an object', () => {
        expect(preferences)
            .to.be.a('object')
            .that.has.all.keys([
                'ocapiConfig', 'webdavConfig', 'simplifiedDisputePage', 'isTransactionLogEnabled',
                'clientId', 'paypalMerchantId', 'buttonStyles', 'cardFieldsStyles', 'paypalButtonMessagesLocation',
                'payPalButtonLocation', 'payLaterButtonEnabled', 'debitCreditButtonEnabled',
                'venmoButtonLocation', 'googlePayButtonLocation', 'applePayButtonLocation', 'defaultLocale', 'merchantName'
            ]);
    });
});
