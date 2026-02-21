'use strict';

var mockFactories = require('../../../../../../mock/factories/index');
var assert = require('chai').assert;

var globaleSession = mockFactories.models.globale.session;
var globaleHelpers = mockFactories.scripts.helpers.globaleHelpers;
var productClassCoefficientRate = mockFactories.models.globale.price.decorators.productClassCoefficientRate;

describe('models/globale/price/decorators/productClassCoefficientRate.js', function () {
    describe('productClassCoefficientRate', function () {
        it('property', function () {
            var object = Object.create(null);
            productClassCoefficientRate(object);
            assert.property(object, 'productClassCoefficientRate');
        });

        it('product doesn\'t exist', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName, 'custom.productClassCode');
            var object = Object.create(null);
            productClassCoefficientRate(object);
            assert.equal(object.productClassCoefficientRate, null);
        });

        it('product exists, ProductClassCode doesn\'t exist', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName, 'custom.productClassCode');
            var object = Object.create(null);
            productClassCoefficientRate(object);
            object.product = { custom: { productClassCode: 'TestProductClassCodeNA' } };
            assert.equal(object.productClassCoefficientRate, null);
        });

        it('product exists, ProductClassCode exists', function () {
            var object = Object.create(null);
            globaleSession.set('geCountry', 'US');
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName, 'custom.productClassCode');
            object.product = { custom: { productClassCode: 'TestProductClassCode' } };
            productClassCoefficientRate(object);
            assert.equal(object.productClassCoefficientRate, 1.3);
            globaleSession.set('geCountry', 'GB');
        });
    });
});
