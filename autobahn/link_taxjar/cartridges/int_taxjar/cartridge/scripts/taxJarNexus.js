
'use strict';

var Logger = require('dw/system/Logger');
var taxJarService = require('*/cartridge/scripts/taxJarService');
var CacheMgr = require('dw/system/CacheMgr');
var Site = require('dw/system/Site');

/**
 * Retrieves nexus data from cache if present
 *
 * @return {(string|undefined)} - JSON formatted string containing nexus data or undefined if value is not in cache
 */
function getNexusFromCache() {
    var siteId = Site.current.ID;
    var cache = CacheMgr.getCache('TaxJarTaxNexusCache');
    var cacheValue = cache.get(siteId + 'taxjarNexus');
    return cacheValue;
}

/**
 * Inserts nexus data into cache
 *
 * @param {string} value - JSON formatted string containing nexus data
 */
function addNexusToCache(value) {
    var siteId = Site.current.ID;
    var cache = CacheMgr.getCache('TaxJarTaxNexusCache');
    cache.put(siteId + 'taxjarNexus', value);
}

/**
 * Retrives nexus data
 *
 * @return {Object} - Object containing nexus data
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
 * Determines whether or not a given location has nexus
 *
 * @param  {string} countryCode - Two-letter ISO country code of the country where the order is shipped to
 * @param  {string} stateCode - Two-letter ISO state code where the order shipped to.
 * @return {boolean} - Whether the location has nexus
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
