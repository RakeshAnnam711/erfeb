/* global describe, it, beforeEach */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

describe('taxJarNexus', function () {
    var cachedNexusStub;
    var cacheStub;
    var taxJarNexusStub;
    var TaxJarNexus;
    var serviceNexusStub;
    var serviceNexusStubString;

    beforeEach(function () {
        cachedNexusStub = {
            regions: [
                {
                    country_code: 'US',
                    country: 'United States',
                    region_code: 'UT',
                    region: 'Utah'
                },
                {
                    country_code: 'US',
                    country: 'United States',
                    region_code: 'CO',
                    region: 'Colorado'
                }
            ]
        };

        serviceNexusStub = {
            regions: [
                {
                    country_code: 'US',
                    country: 'United States',
                    region_code: 'NY',
                    region: 'New York'
                }
            ]
        };

        cacheStub = {
            get: function (cacheKey) { // eslint-disable-line no-unused-vars
                return JSON.stringify(cachedNexusStub);
            },
            put: function (cacheKey, value) {} // eslint-disable-line no-unused-vars
        };

        serviceNexusStubString = JSON.stringify(serviceNexusStub);

        taxJarNexusStub = {
            'dw/system/Logger': {
                getLogger: function (loggerName) { // eslint-disable-line no-unused-vars
                    return {
                        debug: function (message) { // eslint-disable-line no-unused-vars

                        }
                    };
                }
            },
            'dw/system/Site': {
                current: {
                    ID: 'SiteID'
                }
            },
            'dw/system/CacheMgr': {
                getCache: function (cacheID) { // eslint-disable-line no-unused-vars
                    return cacheStub;
                }
            },
            '*/cartridge/scripts/taxJarService': {
                getNexus: function () {
                    return serviceNexusStubString;
                }
            }
        };

        TaxJarNexus = proxyquire('../../../../cartridges/int_taxjar/cartridge/scripts/taxJarNexus', taxJarNexusStub);
    });

    describe('getNexusFromCache', function () {
        it('should return nexus string from the cache', function () {
            var nexus = TaxJarNexus.getNexusFromCache();
            assert.equal(nexus, JSON.stringify(cachedNexusStub));
        });
    });

    describe('addNexusToCache', function () {
        it('should add nexus string to cache', function () {
            var spy = sinon.spy(cacheStub, 'put');
            TaxJarNexus.addNexusToCache('value to add');
            assert.isTrue(spy.calledOnce);
            assert.isTrue(spy.calledWith('SiteIDtaxjarNexus', 'value to add'));
        });
    });

    describe('getNexus', function () {
        it('should retrieve nexus from the cache', function () {
            var nexus = TaxJarNexus.getNexus();
            assert.deepEqual(nexus, cachedNexusStub);
        });

        it('should use service to retreive nexus', function () {
            cachedNexusStub = undefined;
            var nexus = TaxJarNexus.getNexus();
            assert.deepEqual(nexus, serviceNexusStub);
        });

        it('should return null as nexus when nexus request failes', function () {
            cachedNexusStub = undefined;
            serviceNexusStubString = null;
            var nexus = TaxJarNexus.getNexus();
            assert.isNull(nexus);
        });
    });

    describe('hasNexus', function () {
        it('should return true when store has nexus in state', function () {
            var hasNexus = TaxJarNexus.hasNexus('US', 'UT');
            assert.isTrue(hasNexus);
        });

        it('should return true when store has nexus in state', function () {
            var hasNexus = TaxJarNexus.hasNexus('US', 'CO');
            assert.isTrue(hasNexus);
        });

        it('should return false when state is not in nexus', function () {
            var hasNexus = TaxJarNexus.hasNexus('US', 'AZ');
            assert.isFalse(hasNexus);
        });

        it('should return false when country is not in nexus', function () {
            var hasNexus = TaxJarNexus.hasNexus('XX', 'UT');
            assert.isFalse(hasNexus);
        });

        it('should return true when nexus returned from API is empty', function () {
            cachedNexusStub = undefined;
            serviceNexusStubString = JSON.stringify({});
            var hasNexus = TaxJarNexus.hasNexus('US', 'WY');
            assert.isTrue(hasNexus);
        });

        it('should return true when nexus regions returned from API is empty', function () {
            cachedNexusStub = {
                regions: []
            };
            var hasNexus = TaxJarNexus.hasNexus('US', 'UT');
            assert.isTrue(hasNexus);
        });

        it('should return true when nexus is null', function () {
            cachedNexusStub = undefined;
            serviceNexusStubString = null;
            var hasNexus = TaxJarNexus.hasNexus('US', 'WY');
            assert.isTrue(hasNexus);
        });

        it('should return true when store has international nexus', function () {
            cachedNexusStub = {
                regions: [
                    {
                        country_code: 'CA',
                        country: 'Canada',
                        region_code: 'ON',
                        region: 'Ontario'
                    }
                ]
            };
            var hasNexus = TaxJarNexus.hasNexus('CA', 'XX');
            assert.isTrue(hasNexus);
        });
    });
});
