'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents AbstractProductRestrictionOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function AbstractProductRestrictionOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
AbstractProductRestrictionOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Returns the directory for the Impex restriction based on the merchant ID.
 * @return {string} The directory path for the Impex restriction.
 */
AbstractProductRestrictionOperation.prototype.getImpexRestrictionDir = function () {
    const File = require('dw/io/File');
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    const impexDir = File.IMPEX + '/src/globale/recentProductCountryS/{merchantId}/';
    const merchantId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId);

    return impexDir.replace('{merchantId}', merchantId);
};

/**
 * Returns the directory for the Impex archive restriction based on the merchant ID.
 * @return {string} The directory for the Impex archive restriction.
 */
AbstractProductRestrictionOperation.prototype.getImpexArchiveRestrictionDir = function () {
    const File = require('dw/io/File');
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    const impexDir = File.IMPEX + '/src/globale/recentProductCountryS/{merchantId}/archive/';
    const merchantId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId);

    return impexDir.replace('{merchantId}', merchantId);
};

/**
 * Returns the CSV columns map.
 * @return {Object} The CSV columns map.
 */
AbstractProductRestrictionOperation.prototype.getCSVColumnsMap = function () {
    const csvColumnsMap = {
        RequestId: { index: 0, header: 'RequestId' },
        ProductCode: { index: 1, header: 'ProductCode' },
        CountryCode: { index: 2, header: 'CountryCode' },
        IsRestricted: { index: 3, header: 'IsRestricted' },
        IsForbidden: { index: 4, header: 'IsForbidden' },
        VATRateValue: { index: 5, header: 'VATRateType.Rate' },
        IsVerified: { index: 6, header: 'IsVerified' },
        UploadedViaCatalog: { index: 7, header: 'UploadedViaCatalog' }
    };
    return csvColumnsMap;
};

/**
 * Returns the template for the restriction feed file name.
 * @return {string} The template for the restriction feed file name.
 */
AbstractProductRestrictionOperation.prototype.getRestrictionFeedFileNameTemplate = function () {
    return 'ge_restriction_records_{datetime}';
};

/**
 * Returns the regular expression for the restriction feed file name.
 * @return {string} The regular expression for the restriction feed file name.
 */
AbstractProductRestrictionOperation.prototype.getRestrictionFeedFileNameRegExp = function () {
    return 'ge_restriction_records_.*\.csv'; // eslint-disable-line no-useless-escape
};

module.exports = AbstractProductRestrictionOperation;
