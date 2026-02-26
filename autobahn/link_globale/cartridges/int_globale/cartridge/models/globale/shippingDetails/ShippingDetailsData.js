'use strict';

var arrayUtils = require('*/cartridge/scripts/util/globale/array');
var CountryShippingDetails = require('*/cartridge/models/globale/shippingDetails/CountryShippingDetailsData');

/**
 * Represents ShippingDetailsData
 * @constructor
 * @param {Object} payload - responce payload
 */
function ShippingDetailsData(payload) {
    this.payload = payload;

    /**
     * Returns country shipping details or null
     * @param {string} countryCode - country code
     * @returns {models/globale/shippingDetails/CountryShippingDetails|null} - country shipping details or null
     */
    this.getCountryData = function (countryCode) {
        var countryData = arrayUtils.find(this.payload, function (countryDataObject) {
            return (('destinationCountry' in countryDataObject) && countryDataObject.destinationCountry === countryCode);
        });

        // ISO-3 country code check
        if (countryData === undefined) {
            var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
            var iso3CountryCode = geCountryMgr.getISO3CountryCode(countryCode);
            if (iso3CountryCode !== null) {
                countryData = arrayUtils.find(this.payload, function (countryDataObject) {
                    return (('destinationCountry' in countryDataObject) && countryDataObject.destinationCountry === iso3CountryCode);
                });
            }
        }

        return countryData !== undefined ? new CountryShippingDetails(countryData) : null;
    };
}

module.exports = ShippingDetailsData;
