'use strict';

var Logger = require('dw/system/Logger');
var taxJarService = require('*/cartridge/scripts/taxJarService');
var CacheMgr = require('dw/system/CacheMgr');
var Site = require('dw/system/Site');

/**
 * Returns cache instance or null when cache is not registered.
 * @returns {dw.system.Cache|null} cache instance
 */
function getNexusCache() {
    try {
        return CacheMgr.getCache('TaxJarTaxNexusCache');
    } catch (e) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').warn(
            'TaxJarTaxNexusCache is not registered. Falling back to non-cached nexus fetch.'
        );
        return null;
    }
}

/**
 * Retrieves nexus data from cache if present
 * @return {(string|undefined)} JSON-formatted nexus data, or undefined
 */
function getNexusFromCache() {
    var siteId = Site.current.ID;
    var cache = getNexusCache();

    if (!cache) {
        return undefined;
    }

    return cache.get(siteId + 'taxjarNexus');
}

/**
 * Inserts nexus data into cache when cache is available
 * @param {string} value JSON-formatted nexus data
 */
function addNexusToCache(value) {
    var siteId = Site.current.ID;
    var cache = getNexusCache();

    if (!cache) {
        return;
    }

    cache.put(siteId + 'taxjarNexus', value);
}

/**
 * Retrieves nexus data, using cache when available
 * @return {Object} nexus data object
 */
function getNexus() {
    var nexus = getNexusFromCache();

    if (!nexus) {
        nexus = taxJarService.getNexus();
        addNexusToCache(nexus);
    } else {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Nexus retrieved from cache: ' + nexus);
    }

    return JSON.parse(nexus);
}

/**
 * Determines whether location has nexus
 * @param {string} countryCode ISO country code
 * @param {string} stateCode ISO state code
 * @return {boolean} nexus state
 */
function hasNexus(countryCode, stateCode) {
    var nexus = getNexus();

    if (nexus === null || !Object.prototype.hasOwnProperty.call(nexus, 'regions')) {
        return true;
    }

    if (nexus.regions.length < 1) {
        return true;
    }

    var keys = Object.keys(nexus.regions);

    for (var i = 0; i < keys.length; i += 1) {
        if (stateCode && countryCode === 'US' && nexus.regions[keys[i]].region_code) {
            if (nexus.regions[keys[i]].country_code === countryCode && nexus.regions[keys[i]].region_code === stateCode) {
                return true;
            }
        } else if (countryCode) {
            if (nexus.regions[keys[i]].country_code === countryCode) {
                return true;
            }
        }
    }

    return false;
}

module.exports = {
    getNexus: getNexus,
    hasNexus: hasNexus,
    getNexusFromCache: getNexusFromCache,
    addNexusToCache: addNexusToCache
};
