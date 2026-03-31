'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var numbers = mockFactories.scripts.util.globale.numbers;

describe('util/globale/numbers.js', function () {
    describe('round', function () {
        it('function', function () {
            assert.isFunction(numbers.round);
        });

        it('should return 5.50 for 5.495', function () {
            assert.equal(numbers.round(5.495, 2), 5.50);
        });

        it('should return 5.49 for 5.494', function () {
            assert.equal(numbers.round(5.494, 2), 5.49);
        });
    });
});
