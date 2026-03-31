'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var geServiceMgr = mockFactories.scripts.factories.globale.geServiceMgr;

describe('scripts/factories/globale/geServiceMgr.js', function () {
    describe('getOcapiJwtService', function () {
        it('function', function () {
            assert.isFunction(geServiceMgr.getOcapiJwtService);
        });
    });
});

describe('scripts/factories/globale/geServiceMgr.js', function () {
    describe('getOcapiSessionBridgeService', function () {
        it('function', function () {
            assert.isFunction(geServiceMgr.getOcapiSessionBridgeService);
        });
    });
});

describe('scripts/factories/globale/geServiceMgr.js', function () {
    describe('getScapiJwtService', function () {
        it('function', function () {
            assert.isFunction(geServiceMgr.getScapiJwtService);
        });
    });
});
