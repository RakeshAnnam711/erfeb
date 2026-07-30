'use strict';

var mockFactories = require('../../../../../../../mock/factories/index');
var assert = require('chai').assert;

var globaleHelpers = mockFactories.scripts.helpers.globaleHelpers;
var productAttribute = mockFactories.models.globale.sendCart.product.decorators.productAttribute;

var object = Object.create(null);
productAttribute(object);

describe('models/globale/sendCart/product/decorators/productAttribute.js', function () {
    describe('getProductAttributeByPref', function () {
        it('Function', function () {
            assert.isFunction(object.getProductAttributeByPref);
        });

        it('productClassCode exists(Search by system attribute)', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName, 'ID');
            object.apiProduct = { ID: 'TestProductClassCode' };
            assert.equal(object.getProductAttributeByPref('geProductClassCodePropName'), 'TestProductClassCode');
        });

        it('productClassCode doesn\'t exist(Search by system attribute)', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName, 'IDs');
            assert.equal(object.getProductAttributeByPref('geProductClassCodePropName'), null);
        });

        it('productClassCode exists(Search by custom attribute)', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName, 'custom.productClassCode');
            object.apiProduct = { custom: { productClassCode: 'TestProductClassCode' } };
            assert.equal(object.getProductAttributeByPref('geProductClassCodePropName'), 'TestProductClassCode');
        });

        it('productClassCode doesn\'t exist(Search by custom attribute)', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName, 'custom.productClassCodeNE');
            assert.equal(object.getProductAttributeByPref('geProductClassCodePropName'), null);
        });
    });
});
