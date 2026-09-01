const { bm_paypal: { versionsPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const versions = proxyquire(versionsPath, {
    'dw/system/System': {
        compatibilityMode: 2201
    },
    '~/cartridge/config/constants': {
        PARTNER_ATTRIBUTION_ID: 'SFCC_EC_B2C_25_3_0'
    },
    '~/cartridge/scripts/helpers/coreHelpers': {
        getInstanceType: () => 'development'
    }
});

describe('versions', () => {
    it('should return an object', () => {
        expect(versions)
            .to.be.a('object')
            .that.deep.equal({
                SFRA: '7.0.0',
                PLUGIN: '25.3.0',
                PAYPAL: {
                    PARTNER_ATTRIBUTION_ID: 'SFCC_EC_B2C_25_3_0'
                },
                INSTANCE_TYPE: 'development',
                COMPATIBILITY_MODE: 2201
            });
    });
});
