/* eslint-disable no-unused-vars, no-underscore-dangle */

'use strict';

function createService(serviceName, config) {
    var service = {
        _local: {},
        serviceName: serviceName,
        configuration: config,
        setRequestMethod: function (requestMethod) {},
        addHeader: function (header, value) {},
        addParam: function (param, value) {},
        setURL: function (url) {
            this._local.url = url;
        },
        call: function (params) {
            var resp = {};
            resp.isOk = function () { return true; };

            switch (this._local.url) {
                case 'https://test-001.sandbox.us01.dx.commercecloud.salesforce.com/s/Sites-RefArchGlobal-Site/dw/shop/v_23_1/baskets/basketId?locale=en-GB':
                case 'https://test-001.sandbox.us01.dx.commercecloud.salesforce.com/s/Sites-RefArchGlobal-Site/dw/shop/v_23_1/baskets/basketId/coupons?locale=en-GB':
                    resp.object = {
                        text: JSON.stringify({ coupon_items: [{ code: 'some_coupon_code', status_code: 'applied' }] })
                    };
                    break;
                case 'https://test-001.sandbox.us01.dx.commercecloud.salesforce.com/s/Sites-RefArchGlobal-Site/dw/shop/v_23_1/customers/auth':
                    resp.object = {
                        getResponseHeader: function (header) {
                            return header;
                        }
                    };
                    break;
                case 'https://test-001.sandbox.us01.dx.commercecloud.salesforce.com/s/Sites-RefArchGlobal-Site/dw/shop/v_23_1/orders':
                    resp.object = {
                        text: JSON.stringify({ order_no: 'order_no', order_token: 'order_token' })
                    };
                    break;
                default:
                    break;
            }

            return resp;
        }
    };
    return service;
}

module.exports = {
    createService: createService
};
