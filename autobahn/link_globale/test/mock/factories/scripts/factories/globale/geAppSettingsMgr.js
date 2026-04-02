'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';

var geAppSettingsMgr = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/factories/globale/geAppSettingsMgr', {
    '*/cartridge/scripts/util/globale/values': require('../../util/globale/values')
});

geAppSettingsMgr.getPlatformSetting = function (name) {
    var result = null;
    switch (name) {
        case 'sfccLanguagesConfiguration':
            result =
            {
                'RefArchGlobal': {
                    'enabled': true,
                    'countriesConfig': {
                        'CH': [
                            'de_CH',
                            'fr_CH'
                        ]
                    },
                    'languagesConfig': {
                        'de_CH': {
                            'culture': 'de',
                            'label': 'German'
                        },
                        'fr_CH': {
                            'culture': 'fr',
                            'label': 'French'
                        }
                    }
                },
                'RefArch': {
                    'enabled': true,
                    'countriesConfig': {
                        'CH': [
                            'de_CH',
                            'fr_CH'
                        ]
                    },
                    'languagesConfig': {
                        'de_CH': {
                            'culture': 'de',
                            'label': 'German'
                        },
                        'fr_CH': {
                            'culture': 'fr',
                            'label': 'French'
                        }
                    }
                }
            };
            break;
        case 'sfccShippingSwitcherConfiguration':
            result =
            {
                'RefArchGlobal': {
                    'redirectToSamePage': true,
                    'redirectToSamePageAcrossSites': true
                },
                'RefArch': {
                    'redirectToSamePage': true,
                    'redirectToSamePageAcrossSites': false
                }
            };
            break;
        case 'sfccCultureMapping':
            result = { 'CH': 'fr', 'en_GB': 'en-GB' };
            break;
        case 'sfccCheckoutCultureMapping':
            result = { 'US': 'en-US', 'en_GB': 'en-GB' };
            break;
        case 'sfccDefaultCountryCodeMapping':
            result = { 'defaultSiteConfig': { 'defaultCountryCode': 'GB' } };
            break;
        case 'sfccParseCountryCodeFromRequestLocale':
            result = false;
            break;
        default:
            break;
    }

    return result;
};

module.exports = geAppSettingsMgr;
