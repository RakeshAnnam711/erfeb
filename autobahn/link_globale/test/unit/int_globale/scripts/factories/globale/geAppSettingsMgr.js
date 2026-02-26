'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var geAppSettingsMgr = mockFactories.scripts.factories.globale.geAppSettingsMgr;

describe('scripts/factories/globale/geAppSettingsMgr.js', function () {
    describe('getPlatformSetting', function () {
        it('function', function () {
            assert.isFunction(geAppSettingsMgr.getPlatformSetting);
        });
    });
});
