'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var validator = mockFactories.scripts.util.globale.validator;

var testObject = {
    propA: 'valA',
    propB: 'valB',
    propC: {
        propCA: 'valCA',
        propCB: {
            propCBA: 'valCBA'
        }
    },
    propE: 'valE',
    propF: {
        propFA: 'valFA',
        propFB: {
            propFBA: 'valFBA'
        }
    },
    propG: ''
};

describe('util/globale/validator.js', function () {
    describe('validate', function () {
        it('Required validator', function () {
            assert.deepEqual(
                validator.validate(
                    testObject,
                    {
                        propA: { required: true },
                        propB: { required: true },
                        'propC.propCA': { required: true },
                        'propC.propCB.propCBA': { required: true },
                        'propC.propCC': { required: false }
                    }
                ),
                { valid: true, errors: {} }
            );

            assert.deepEqual(
                validator.validate(
                    testObject,
                    {
                        propA: { required: true },
                        propB: { required: true },
                        propD: { required: true },
                        'propC.propCA': { required: true },
                        'propC.propCB.propCBA': { required: true },
                        'propC.propCC': { required: true }
                    }
                ),
                { valid: false, errors: { 'propC.propCC': ['The value is not provided.'], 'propD': ['The value is not provided.'] } }
            );
        });

        it('In validator', function () {
            assert.deepEqual(
                validator.validate(
                    testObject,
                    {
                        propE: { in: ['valE', 'valEE', ''] },
                        propG: { in: [''] },
                        'propF.propFA': { in: ['valFA', 'valFA1'] },
                        'propF.propFB.propFBA': { in: ['valFBA', 'valFBA1'] }
                    }
                ),
                { valid: true, errors: {} }
            );

            assert.deepEqual(
                validator.validate(
                    testObject,
                    {
                        propE: { in: ['valE', 'valEE', ''] },
                        propG: { in: [''] },
                        'propF.propFA': { in: ['valFA', 'valFA1'] },
                        'propF.propFB.propFBA': { in: ['valFBA', 'valFBA1'] },
                        'propF.propFB.propFBAA': { in: ['', 'propFBAA'] }
                    }
                ),
                { valid: false, errors: { 'propF.propFB.propFBAA': ['The value is not allowed.'] } }
            );
        });

        it('Equals validator', function () {
            assert.deepEqual(
                validator.validate(
                    testObject,
                    {
                        propE: { equals: 'valE' },
                        propG: { equals: '' },
                        'propF.propFA': { equals: 'valFA' },
                        'propF.propFB.propFBA': { equals: 'valFBA' }
                    }
                ),
                { valid: true, errors: {} }
            );

            assert.deepEqual(
                validator.validate(
                    testObject,
                    {
                        propE: { equals: 'valE' },
                        propG: { equals: '' },
                        'propF.propFA': { equals: 'valFA' },
                        'propF.propFB.propFBA': { equals: 'valFBA' },
                        'propF.propFB.propFBAA': { equals: 'propFBAA' }
                    }
                ),
                { valid: false, errors: { 'propF.propFB.propFBAA': ['The value does not match the expected one.'] } }
            );
        });
    });
});
