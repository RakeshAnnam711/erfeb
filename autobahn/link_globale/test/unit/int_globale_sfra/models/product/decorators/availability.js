'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Resource = require('../../../../../mock/dw/web/Resource');
var ProductInventoryMgr = require('../../../../../mock/dw/catalog/ProductInventoryMgr');

var restrictionMessageMock = 'Some restriction message';

var sessionMock = {
    get: function (param) {
        var result = null;
        switch (param) {
            case 'geOperatedCountry':
                result = true;
                break;
            default:
                break;
        }
        return result;
    }
};

var ProductMgrMock = {
    getProduct: function (id) {
        return { ID: id };
    }
};

var geProductMgrMock = {
    get: function (id) {
        return {
            ID: id,
            isGeRestricted: function () {
                return true;
            },
            getGeRestrictionMessage: function () {
                return restrictionMessageMock;
            }
        };
    }
};

describe('product availability decorator', function () {
    var availability = proxyquire('../../../../../../cartridges/int_globale_sfra/cartridge/models/product/decorators/availability', {
        '*/cartridge/models/globale/session': sessionMock,
        'dw/web/Resource': Resource,
        'dw/catalog/ProductInventoryMgr': ProductInventoryMgr,
        'dw/catalog/ProductMgr': ProductMgrMock,
        '*/cartridge/scripts/factories/globale/dw/product': geProductMgrMock
    });

    it('should receive product restricted message', function () {
        var object = {};
        availability(object);

        assert.equal(object.availability.messages.length, 1);
        assert.equal(object.availability.messages[0], restrictionMessageMock);
    });

    it('should receive in available 0', function () {
        var object = {};
        availability(object);

        assert.equal(object.available, 0);
    });
});
