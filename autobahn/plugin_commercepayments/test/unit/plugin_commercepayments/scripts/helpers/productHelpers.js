'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var mockSuperModule = require('../../../mockModuleSuperModule.js');
var superModule = {};

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var SalesforcePaymentRequest = require('../../../../mocks/dw/extensions/payments/SalesforcePaymentRequest');

describe('productHelpers', function () {
    before(function () {
        mockSuperModule.create(superModule);
    });
    after(function () {
        mockSuperModule.remove();
    });

    var baseResult;
    var buyNowData;
    var paymentHelpers;
    var productHelpers;
    beforeEach(function () {
        baseResult = {
            product: {}
        };
        buyNowData = {
            basketData: {},
            options: {}
        };
        paymentHelpers = {
            getBuyNowData: sinon.stub().returns(buyNowData)
        };
        superModule.showProductPage = sinon.stub().returns(baseResult);
        productHelpers = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/helpers/productHelpers', {
            'dw/extensions/payments/SalesforcePaymentRequest': SalesforcePaymentRequest,
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    describe('showProductPage', function () {
        it('should call base and set a payment request on the result', function () {
            var querystring = 'querystring';
            var reqPageMetaData = {};
            var usePageDesignerTemplates = {};
            var result = productHelpers.showProductPage(querystring, reqPageMetaData, usePageDesignerTemplates);

            assert.isTrue(superModule.showProductPage.calledOnce);
            assert.isTrue(superModule.showProductPage.calledWith(querystring, reqPageMetaData));

            assert.isNotNull(result.product.paymentRequest);
            assert.equal(result.product.paymentRequest.id, 'buynow');
            assert.equal(result.product.paymentRequest.selector, '.salesforce-buynow-element');
            assert.isTrue(result.product.paymentRequest.setBasketData.calledOnce);
            assert.isTrue(result.product.paymentRequest.setBasketData.calledWith(buyNowData.basketData));
            assert.isTrue(result.product.paymentRequest.setOptions.calledOnce);
            assert.isTrue(result.product.paymentRequest.setOptions.calledWith(buyNowData.options));
        });
    });
});
