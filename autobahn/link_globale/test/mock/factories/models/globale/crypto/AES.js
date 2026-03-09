'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

module.exports = proxyquire('../../../../../../cartridges/int_globale/cartridge/models/globale/crypto/AES', {
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../../scripts/helpers/globaleHelpers'),
    'dw/crypto/SecureRandom': require('../../../../dw/crypto/SecureRandom'),
    'dw/crypto/Encoding': require('../../../../dw/crypto/Encoding'),
    'dw/crypto/Cipher': require('../../../../dw/crypto/Cipher'),
    'dw/util/StringUtils': require('../../../../dw/util/StringUtils')
});
