/* eslint-disable object-curly-newline */

const { bm_paypal: { coreHelpersPath } } = require('../path.json');

const { expect } = require('chai');
const { stub, useFakeTimers } = require('sinon');
const { it, describe, before, after } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const add = stub();
const getTime = stub();
const formatCalendar = stub();

const coreHelpers = proxyquire(coreHelpersPath, {
    'dw/web/Resource': dw.web.Resource,
    'dw/system/System': dw.system.System,
    'dw/system/Logger': dw.system.Logger,
    '~/cartridge/config/constants': {
        INSTANCE_STAGING: 'staging',
        INSTANCE_DEVELOPMENT: 'development',
        INSTANCE_PRODUCTION: 'production'
    },
    'dw/util/Calendar': function() {
        this.add = add;
        this.getTime = getTime;

        return this;
    },
    'dw/util/StringUtils': {
        formatCalendar: formatCalendar
    }
});

describe('coreHelpers file', () => {
    describe('pluralize', () => {
        const word = 'word';

        let value = 1;

        it('result should be equal to "word" if value is set to 1', () => {
            expect(coreHelpers.pluralize(value, word)).to.equal('word');
        });

        it('result should be equal to "words" if value is set to 2', () => {
            value = 2;
            expect(coreHelpers.pluralize(value, word)).to.equal('words');
        });

        it('result should be equal to "words" if value is set to 2 & plural isn\'t null', () => {
            const plural = 'words';

            expect(coreHelpers.pluralize(value, word, plural)).to.equal('words');
        });
    });

    describe('sortByProperty', () => {
        const arr = [
            { status: 'new' },
            { status: 'open' },
            { status: 'new' }
        ];

        it('result should be a sorted array by object property', () => {
            expect(coreHelpers.sortByProperty(arr, 'status')).to.deep.equal([
                { status: 'new' },
                { status: 'new' },
                { status: 'open' }
            ]);
        });
    });

    describe('filterByProperty', () => {
        const arr = [
            { status: 'new' },
            { status: 'open' },
            { status: 'new' }
        ];

        it('result should be a filtered array by object property value', () => {
            expect(coreHelpers.filterByProperty(arr, 'status', 'open')).to.deep.equal([
                { status: 'open' }
            ]);
        });
    });

    describe('isJson', () => {
        it('result returns false if input value not a string', () => {
            expect(coreHelpers.isJson(50)).to.be.false;
            expect(coreHelpers.isJson(3.14)).to.be.false;
            expect(coreHelpers.isJson([])).to.be.false;
            expect(coreHelpers.isJson({})).to.be.false;
            expect(coreHelpers.isJson(null)).to.be.false;
            expect(coreHelpers.isJson(undefined)).to.be.false;
        });

        it('result returns false if input value is not json', () => {
            expect(coreHelpers.isJson('test')).to.be.false;
        });

        it('result returns false if input value is json', () => {
            const jsonObj = JSON.stringify({});
            const jsonArr = JSON.stringify([{}, {}]);

            expect(coreHelpers.isJson(jsonObj)).to.be.true;
            expect(coreHelpers.isJson(jsonArr)).to.be.true;
        });
    });

    describe('tryParseJSON', () => {
        after(() => {
            dw.system.Logger.getLogger.restore();
        });

        it('Result should be a parsed JSON', () => {
            expect(coreHelpers.tryParseJSON(JSON.stringify({}))).to.deep.equal({});
        });

        it('Result should be underfined & an error logged if JSON cannot be parsed', () => {
            const log = {};

            stub(dw.system.Logger, 'getLogger').returns({
                error: () => Object.assign(log, { error: 'error' })
            });

            expect(coreHelpers.tryParseJSON('')).be.undefined;
            expect(log).to.deep.equal({ error: 'error' });
        });
    });

    describe('getInstanceType', () => {
        before(() => {
            Object.assign(dw.system.System, {
                instanceType: 0,
                DEVELOPMENT_SYSTEM: 0,
                PRODUCTION_SYSTEM: 2,
                STAGING_SYSTEM: 1
            });
        });

        after(() => {
            dw.system.System.instanceType = null;
            dw.system.System.STAGING_SYSTEM = null;
            dw.system.System.PRODUCTION_SYSTEM = 0;
            dw.system.System.DEVELOPMENT_SYSTEM = 1;
        });

        it('should return the string `development`', () => {
            dw.system.System.instanceType = 0;
            expect(coreHelpers.getInstanceType()).to.be.equal('development');
        });

        it('should return the string `staging`', () => {
            dw.system.System.instanceType = 1;
            expect(coreHelpers.getInstanceType()).to.be.equal('staging');
        });

        it('should return the string `production`', () => {
            dw.system.System.instanceType = 2;
            expect(coreHelpers.getInstanceType()).to.be.equal('production');
        });

        it('should return an empty string', () => {
            dw.system.System.instanceType = 4;
            expect(coreHelpers.getInstanceType()).to.be.empty;
        });
    });

    describe('checkSetValue', () => {
        before(() => {
            stub(dw.web.Resource, 'msg');

            dw.web.Resource.msg.withArgs('value.set', 'paypalbm', null).returns('set');
            dw.web.Resource.msg.withArgs('value.notset', 'paypalbm', null).returns('not set');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('should return the string `set`', () => {
            expect(coreHelpers.checkSetValue('user-id')).to.be.equal('set');
        });

        it('should return the string `not set`', () => {
            expect(coreHelpers.checkSetValue('')).to.be.equal('not set');
            expect(coreHelpers.checkSetValue(null)).to.be.equal('not set');
            expect(coreHelpers.checkSetValue(undefined)).to.be.equal('not set');
        });
    });

    describe('isObject', () => {
        it('should return true', () => {
            expect(coreHelpers.isObject({})).to.be.true;
            expect(coreHelpers.isObject({ firstName: 'John', lastName: 'Doe' })).to.be.true;
        });

        it('should return false', () => {
            expect(coreHelpers.isObject(5)).to.be.false;
            expect(coreHelpers.isObject([])).to.be.false;
            expect(coreHelpers.isObject(5.5)).to.be.false;
            expect(coreHelpers.isObject(null)).to.be.false;
            expect(coreHelpers.isObject(true)).to.be.false;
            expect(coreHelpers.isObject(false)).to.be.false;
            expect(coreHelpers.isObject('string')).to.be.false;
            expect(coreHelpers.isObject(() => {})).to.be.false;
            expect(coreHelpers.isObject(undefined)).to.be.false;
            expect(coreHelpers.isObject(NaN)).to.be.false;
        });
    });

    describe('getValueByKey', () => {
        const key = 'customer.email.value';
        const fakeKey = 'customer.firstName.value';
        const obj = {
            customer: {
                email: { value: 'test@email.com' }
            }
        };

        const defaultValue = null;

        it('should return email value', () => {
            expect(coreHelpers.getValueByKey(obj, key, defaultValue)).to.equal('test@email.com');
        });

        it('should return default value for deep level', () => {
            expect(coreHelpers.getValueByKey(obj, fakeKey, defaultValue)).to.equal(defaultValue);
        });

        it('should return default value for first level', () => {
            expect(coreHelpers.getValueByKey({ name: 'John' }, 'age', defaultValue)).to.equal(defaultValue);
        });
    });

    describe('isParameterSubmittedAndNotEmpty', () => {
        it('should return false if parameter is not present', () => {
            const httpParameterMap = {};
            const result = coreHelpers.isParameterSubmittedAndNotEmpty(httpParameterMap, 'testParam');

            expect(result).to.be.false;
        });

        it('should return false if parameter is present but empty', () => {
            const httpParameterMap = {
                testParam: { empty: true, submitted: false }
            };

            const result = coreHelpers.isParameterSubmittedAndNotEmpty(httpParameterMap, 'testParam');

            expect(result).to.be.false;
        });

        it('should return false if parameter is present and not empty but not submitted', () => {
            const httpParameterMap = {
                testParam: { empty: false, submitted: false }
            };

            const result = coreHelpers.isParameterSubmittedAndNotEmpty(httpParameterMap, 'testParam');

            expect(result).to.be.false;
        });

        it('should return true if parameter is present, not empty, and submitted', () => {
            const httpParameterMap = {
                testParam: { empty: false, submitted: true }
            };

            const result = coreHelpers.isParameterSubmittedAndNotEmpty(httpParameterMap, 'testParam');

            expect(result).to.be.true;
        });
    });

    describe('getPeriod', () => {
        let clock;

        before(() => {
            clock = useFakeTimers(new Date(2021, 8, 30).getTime());
        });

        after(() => {
            clock.restore();
        });

        afterEach(() => {
            add.reset();
            formatCalendar.reset();
        });

        it('should use default dates when parameters are not submitted', () => {
            formatCalendar.onFirstCall().returns('09/30/2021');
            formatCalendar.onSecondCall().returns('09/01/2021');

            const hm = {
                dateFrom: { stringValue: '' },
                dateTo: { stringValue: '' }
            };

            const period = coreHelpers.getPeriod(hm);

            expect(period.dateFrom).to.equal('09/01/2021');
            expect(period.dateTo).to.equal('09/30/2021');
        });

        it('should use submitted dates when parameters are submitted', () => {
            formatCalendar.onFirstCall().returns('08/31/2021');
            formatCalendar.onSecondCall().returns('08/01/2021');

            const hm = {
                dateFrom: { stringValue: '08/01/2021' },
                dateTo: { stringValue: '08/31/2021' }
            };

            const period = coreHelpers.getPeriod(hm);

            expect(period.dateFrom).to.equal('08/01/2021');
            expect(period.dateTo).to.equal('08/31/2021');
        });
    });

    describe('buildQueryPart', () => {
        it('should return an empty string if values are empty', () => {
            expect(coreHelpers.buildQueryPart('enable-funding', [])).to.be.equal('');
        });

        it('should return query part, and values divided by `,`', () => {
            const result = coreHelpers.buildQueryPart('enable-funding', ['venmo', 'paylater', 'card']);

            expect(result).to.be.equal('&enable-funding=venmo,paylater,card');
        });
    });
});
