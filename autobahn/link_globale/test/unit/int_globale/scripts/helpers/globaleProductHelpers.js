'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;

var globaleProductHelpers = mockFactories.scripts.helpers.globaleProductHelpers;

describe('scripts/helpers/globaleProductHelpers.js', function () {
    describe('getProductVariationGroup', function () {
        it('get product variation group', function () {
            assert.isFunction(globaleProductHelpers.getProductVariationGroup);
            // assert.fail('@TODO: implement verification logic');
        });
    });

    describe('getProductCategories', function () {
        it('get product categories', function () {
            assert.isFunction(globaleProductHelpers.getProductCategories);
            // assert.fail('@TODO: implement verification logic');
        });
    });

    describe('getProductImageUrl', function () {
        it('get product image URL', function () {
            assert.isFunction(globaleProductHelpers.getProductImageUrl);
            // assert.fail('@TODO: implement verification logic');
        });
    });
});
