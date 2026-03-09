'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

require.extensions['.ds'] = require.extensions['.js'];
require('../../../../dw-api-mock/demandware-globals');

describe('DeleteRequest', function () {
    var DeleteRequest = proxyquire('../../../../../cartridges/int_vertex/cartridge/scripts/helper/deleteRequest', {
        '*/cartridge/scripts/lib/generalLogger': {
            error: function () {
                return true;
            },
            debug: function () {
                return true;
            }
        }
    });
    beforeEach(function () {
        request.setHttpHeaders('x-vertex-hmac', 'test');
    });

    it('validateRequestParameters', function () {
        var result = DeleteRequest.validateRequestParameters();
        assert.isObject(result);
        assert.isBoolean(result.ok);
        assert.equal(result.httpStatus, 401);
        assert.isString(result.message);
    });
});
