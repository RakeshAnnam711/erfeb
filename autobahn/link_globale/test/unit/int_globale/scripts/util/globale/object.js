'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var objectUtils = mockFactories.scripts.util.globale.object;

var testObject = {
    propA: 'valA',
    propB: 'valB',
    propC: {
        propCA: 'valCA',
        propCB: {
            propCBA: 'valCBA'
        }
    }
};

describe('util/globale/object.js', function () {
    describe('getValueByPath', function () {
        it('should return nested value', function () {
            assert.equal(objectUtils.getValueByPath(testObject, 'propA'), 'valA');
            assert.equal(objectUtils.getValueByPath(testObject, 'propC.propCA'), 'valCA');
            assert.equal(objectUtils.getValueByPath(testObject, 'propC.propCB.propCBA'), 'valCBA');
        });

        it('should return default value if property does not exists', function () {
            assert.equal(objectUtils.getValueByPath(testObject, 'propD'), undefined);
            assert.equal(objectUtils.getValueByPath(testObject, 'propC.propCC', false), false);
            assert.equal(objectUtils.getValueByPath(testObject, 'propC.propCC.propCCA', 'default'), 'default');
        });
    });
});
