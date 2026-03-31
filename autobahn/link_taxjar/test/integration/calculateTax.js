/* global it, describe */

var assert = require('chai').assert;
var request = require('request-promise');
var requestHelper = require('./requestHelper.js');

describe('checkout tax', function () {
    this.timeout(10000);

    it('tax on product', function () {
        var cookieString;
        var variantID = '701643421084M';
        var quantity = 1;

        var cookieJar = request.jar();
        var myRequest = requestHelper.createBaseRequest(cookieJar);
        myRequest = requestHelper.setAddToCartRequest(myRequest, variantID, quantity);

        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
                cookieString = cookieJar.getCookieString(myRequest.url);
            })
            .then(function () {
                myRequest = requestHelper.setShippingInformationRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (response2) {
                assert.equal(response2.statusCode, 200);
                var bodyAsJson = JSON.parse(response2.body);

                assert.equal(bodyAsJson.order.productQuantityTotal, quantity);
                assert.equal(bodyAsJson.order.totals.subTotal, '$24.00');
                assert.equal(bodyAsJson.order.totals.totalTax, '$1.74');
            });
    });

    it('tax with product percent discount', function () {
        var cookieString;
        var variantID = '682875719029M';
        var quantity = 3;

        var cookieJar = request.jar();
        var myRequest = requestHelper.createBaseRequest(cookieJar);
        myRequest = requestHelper.setAddToCartRequest(myRequest, variantID, quantity);

        return request(myRequest)
            .then(function (addProductResponse) {
                assert.equal(addProductResponse.statusCode, 200);
                cookieString = cookieJar.getCookieString(myRequest.url);
            })
            .then(function () {
                myRequest = requestHelper.setCSRFRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                assert.equal(csrfResponse.statusCode, 200);
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest = requestHelper.setAddCouponRequest(myRequest, 'product', csrfJsonResponse.csrf.tokenName, csrfJsonResponse.csrf.token);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (addCouponResponse) {
                assert.equal(addCouponResponse.statusCode, 200);
            })
            .then(function () {
                myRequest = requestHelper.setShippingInformationRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (setShippingResponse) {
                assert.equal(setShippingResponse.statusCode, 200);
                var bodyAsJson = JSON.parse(setShippingResponse.body);

                assert.equal(bodyAsJson.order.productQuantityTotal, quantity);
                assert.equal(bodyAsJson.order.totals.subTotal, '$44.97');
                assert.equal(bodyAsJson.order.totals.totalTax, '$3.26');
            });
    });

    it('tax on shipping', function () {
        var cookieString;
        var variantID = '740357377119M';
        var quantity = 5;

        var cookieJar = request.jar();
        var myRequest = requestHelper.createBaseRequest(cookieJar);
        myRequest = requestHelper.setAddToCartRequest(myRequest, variantID, quantity);

        return request(myRequest)
            .then(function (addProductResponse) {
                assert.equal(addProductResponse.statusCode, 200);
                cookieString = cookieJar.getCookieString(myRequest.url);

                myRequest = requestHelper.setShippingMethodRequest(myRequest, '001');
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (setShippingMethodResponse) {
                assert.equal(setShippingMethodResponse.statusCode, 200);

                myRequest = requestHelper.setColoradoShippingInformationRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })

            .then(function (setShippingResponse) {
                assert.equal(setShippingResponse.statusCode, 200);
                var bodyAsJson = JSON.parse(setShippingResponse.body);

                assert.equal(bodyAsJson.order.totals.subTotal, '$550.00');
                assert.equal(bodyAsJson.order.totals.totalTax, '$41.04');
            });
    });

    it('tax with shipping discount', function () {
        var cookieString;
        var variantID = '740357377119M';
        var quantity = 5;

        var cookieJar = request.jar();
        var myRequest = requestHelper.createBaseRequest(cookieJar);
        myRequest = requestHelper.setAddToCartRequest(myRequest, variantID, quantity);

        return request(myRequest)
            .then(function (addProductResponse) {
                assert.equal(addProductResponse.statusCode, 200);
                cookieString = cookieJar.getCookieString(myRequest.url);

                myRequest = requestHelper.setCSRFRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                assert.equal(csrfResponse.statusCode, 200);
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest = requestHelper.setAddCouponRequest(myRequest, 'shipping', csrfJsonResponse.csrf.tokenName, csrfJsonResponse.csrf.token);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (addCouponResponse) {
                assert.equal(addCouponResponse.statusCode, 200);

                myRequest = requestHelper.setShippingMethodRequest(myRequest, '001');
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (setShippingMethodResponse) {
                assert.equal(setShippingMethodResponse.statusCode, 200);

                myRequest = requestHelper.setColoradoShippingInformationRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (setShippingResponse) {
                assert.equal(setShippingResponse.statusCode, 200);
                var bodyAsJson = JSON.parse(setShippingResponse.body);

                assert.equal(bodyAsJson.order.totals.subTotal, '$550.00');
                assert.equal(bodyAsJson.order.totals.totalTax, '$40.46');
                assert.equal(bodyAsJson.order.totals.shippingLevelDiscountTotal.formatted, '$8.00');
            });
    });

    it('tax with order percent discount', function () {
        var cookieString;
        var variantID = '883360541815M';
        var quantity = 5;

        var cookieJar = request.jar();
        var myRequest = requestHelper.createBaseRequest(cookieJar);
        myRequest = requestHelper.setAddToCartRequest(myRequest, variantID, quantity);

        return request(myRequest)
            .then(function (addProductResponse) {
                assert.equal(addProductResponse.statusCode, 200);
                cookieString = cookieJar.getCookieString(myRequest.url);
                myRequest = requestHelper.setCSRFRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                assert.equal(csrfResponse.statusCode, 200);
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest = requestHelper.setAddCouponRequest(myRequest, 'orderLevel', csrfJsonResponse.csrf.tokenName, csrfJsonResponse.csrf.token);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (addCouponResponse) {
                assert.equal(addCouponResponse.statusCode, 200);
                myRequest = requestHelper.setShippingInformationRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (setShippingResponse) {
                assert.equal(setShippingResponse.statusCode, 200);
                var bodyAsJson = JSON.parse(setShippingResponse.body);

                assert.equal(bodyAsJson.order.totals.subTotal, '$775.00');
                assert.equal(bodyAsJson.order.totals.orderLevelDiscountTotal.formatted, '$387.50');
                assert.equal(bodyAsJson.order.totals.totalTax, '$28.09');
            });
    });

    it('tax on onsale item with product amount off discount', function () {
        var cookieString;
        var variantID = '682875540326M';
        var quantity = 1;

        var cookieJar = request.jar();
        var myRequest = requestHelper.createBaseRequest(cookieJar);
        myRequest = requestHelper.setAddToCartRequest(myRequest, variantID, quantity);

        return request(myRequest)
            .then(function (addProductResponse) {
                assert.equal(addProductResponse.statusCode, 200);
                cookieString = cookieJar.getCookieString(myRequest.url);
                myRequest = requestHelper.setCSRFRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                assert.equal(csrfResponse.statusCode, 200);
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest = requestHelper.setAddCouponRequest(myRequest, '5ties', csrfJsonResponse.csrf.tokenName, csrfJsonResponse.csrf.token);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (addCouponResponse) {
                assert.equal(addCouponResponse.statusCode, 200);
                myRequest = requestHelper.setShippingInformationRequest(myRequest);
                cookieJar.setCookie(request.cookie(cookieString), myRequest.url);
                return request(myRequest);
            })
            .then(function (setShippingResponse) {
                assert.equal(setShippingResponse.statusCode, 200);
                var bodyAsJson = JSON.parse(setShippingResponse.body);

                assert.equal(bodyAsJson.order.totals.subTotal, '$24.99');
                assert.equal(bodyAsJson.order.totals.totalTax, '$1.81');
            });
    });
});
