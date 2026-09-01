const { bm_paypal: { ppPaylaterMessagingPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const {
    describe, it
} = require('mocha');

const { expect } = require('chai');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const constants = {
    PAYLATER_MESSAGING_LOCATIONS: ['cart', 'category', 'product_preview'],
    PARTNER_ATTRIBUTION_ID: 'SFCC_EC_B2C_25_3_0'
};

const savedConfig = {
    cart: {
        layout: 'text',
        'text-color': 'white',
        placement: 'cart'
    },
    category: {
        layout: 'flex',
        color: 'black',
        placement: 'category'
    },
    product_preview: {
        layout: 'text',
        'text-color': 'white',
        placement: 'product_preview'
    }
};

const buttonStyles = {
    payLaterMessaging: JSON.stringify(savedConfig)
};

const preferences = {
    buttonStyles: buttonStyles,
    defaultLocale: 'en_US',
    paypalMerchantId: 'test',
    clientId: '12345',
    merchantName: 'Test'
};

const ppPaylaterMessaging = proxyquire(ppPaylaterMessagingPath, {
    '~/cartridge/config/preferences': preferences,
    '~/cartridge/config/constants': constants,
    '~/cartridge/scripts/helpers/coreHelpers': {
        tryParseJSON: () => JSON.parse(buttonStyles.payLaterMessaging)
    }
});

describe('PpPaylaterMessagingModel', () => {
    const expectedResult = {
        bnCode: constants.PARTNER_ATTRIBUTION_ID,
        config: savedConfig,
        locale: preferences.defaultLocale,
        merchantIdentifier: preferences.paypalMerchantId,
        partnerClientId: preferences.clientId,
        partnerName: preferences.merchantName,
        placements: constants.PAYLATER_MESSAGING_LOCATIONS
    };

    it('should create configuration object for Paypal pay later configurator', () => {
        const paylaterMassagingInstance = new ppPaylaterMessaging();

        expect(paylaterMassagingInstance).to.be.an('object');
        expect(paylaterMassagingInstance).to.deep.equals(expectedResult);
    });
});

describe('getPageConfigs', () => {
    const getPageConfigs = ppPaylaterMessaging.__get__('getPageConfigs');

    it('should return available pages configurations', () => {
        expect(getPageConfigs(constants.PAYLATER_MESSAGING_LOCATIONS)).to.deep.equals(savedConfig);
    });
});
