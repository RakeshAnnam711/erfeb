/* eslint-disable no-underscore-dangle */

'use strict';

/**
 * Represents CountryShippingDetailsData
 * @constructor
 * @param {Object} countryData - country data
 */
function CountryShippingDetailsData(countryData) {
    this._data = countryData; // private property
}

CountryShippingDetailsData.prototype.STATUS_AVAILABLE = 'active';
CountryShippingDetailsData.prototype.STATUS_NOT_AVAILABLE = 'noShippingMethodsAvailable';

CountryShippingDetailsData.prototype.getStatus = function () {
    return this._data.status;
};

CountryShippingDetailsData.prototype.isAvailable = function () {
    return this._data.status === this.STATUS_AVAILABLE;
};

CountryShippingDetailsData.prototype.getShippingRates = function () {
    return this.isAvailable() ? this._data.shippingRates : null;
};

module.exports = CountryShippingDetailsData;
