'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var url = mockFactories.scripts.util.globale.url;

describe('util/globale/url.js', function () {
    describe('removeParametersFromQueryString', function () {
        it('function', function () {
            assert.isFunction(url.removeParametersFromQueryString);
        });

        it('should return "pid=12345" for ("pid=12345&geCountry=UA&geCurrency=UAH", ["geCountry", "geCurrency"])', function () {
            assert.equal(url.removeParametersFromQueryString('pid=12345&geCountry=UA&geCurrency=UAH', ['geCountry', 'geCurrency']), 'pid=12345');
        });

        it('should return "pid=12345&geCountry=UA" for ("pid=12345&geCountry=UA&geCurrency=UAH", ["geCurrency"])', function () {
            assert.equal(url.removeParametersFromQueryString('pid=12345&geCountry=UA&geCurrency=UAH', ['geCurrency']), 'pid=12345&geCountry=UA');
        });

        it('should return "pid=12345&geCountry=UA&geCurrency=UAH" for ("pid=12345&geCountry=UA&geCurrency=UAH", ["geCountryName"])', function () {
            assert.equal(url.removeParametersFromQueryString('pid=12345&geCountry=UA&geCurrency=UAH', ['geCountryName']), 'pid=12345&geCountry=UA&geCurrency=UAH');
        });

        it('should return "pid=12345&geCountry=UA&geCurrency=UAH" for ("pid=12345&geCountry=UA&geCurrency=UAH")', function () {
            assert.equal(url.removeParametersFromQueryString('pid=12345&geCountry=UA&geCurrency=UAH'), 'pid=12345&geCountry=UA&geCurrency=UAH');
        });

        it('should return "" for if all input arguments are empty', function () {
            assert.equal(url.removeParametersFromQueryString(), '');
        });
    });
});
