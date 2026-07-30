'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var geConfigurationMgr = mockFactories.scripts.factories.globale.geConfigurationMgr;

describe('scripts/factories/globale/geConfigurationMgr.js', function () {
    describe('getLanguageSwitcherConfig', function () {
        it('function', function () {
            assert.isFunction(geConfigurationMgr.getLanguageSwitcherConfig);
        });
    });
});

describe('scripts/factories/globale/geConfigurationMgr.js', function () {
    describe('getShippingSwitcherConfig', function () {
        it('function', function () {
            assert.isFunction(geConfigurationMgr.getShippingSwitcherConfig);
        });
    });
});
