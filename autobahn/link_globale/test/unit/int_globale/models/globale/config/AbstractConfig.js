'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var AbstractConfig = mockFactories.models.globale.config.AbstractConfig;

describe('models/globale/config/AbstractConfig.js', function () {
    describe('AbstractConfig', function () {
        it('function: AbstractConfig', function () {
            assert.isFunction(AbstractConfig);
        });
    });
});
