'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var LanguageSwitcherConfig = mockFactories.models.globale.config.LanguageSwitcherConfig;

describe('models/globale/config/LanguageSwitcherConfig.js', function () {
    describe('LanguageSwitcherConfig', function () {
        it('function: LanguageSwitcherConfig', function () {
            assert.isFunction(LanguageSwitcherConfig);
        });
    });

    var languageSwitcherConfig = new LanguageSwitcherConfig({});
    describe('LanguageSwitcherConfig:getSiteConfig', function () {
        it('function: getSiteConfig', function () {
            assert.isFunction(languageSwitcherConfig.getSiteConfig);
        });
    });

    describe('LanguageSwitcherConfig:isEnabled', function () {
        it('function: isEnabled', function () {
            assert.isFunction(languageSwitcherConfig.isEnabled);
        });
    });

    describe('LanguageSwitcherConfig:getCountriesConfig', function () {
        it('function: getCountriesConfig', function () {
            assert.isFunction(languageSwitcherConfig.getCountriesConfig);
        });
    });

    describe('LanguageSwitcherConfig:getLanguagesConfig', function () {
        it('function: getLanguagesConfig', function () {
            assert.isFunction(languageSwitcherConfig.getLanguagesConfig);
        });
    });
});
