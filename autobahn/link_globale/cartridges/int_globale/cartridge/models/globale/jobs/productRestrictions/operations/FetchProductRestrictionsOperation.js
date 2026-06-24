'use strict';

var AbstractProductRestrictionOperation = require('*/cartridge/models/globale/jobs/productRestrictions/operations/AbstractProductRestrictionOperation');

/**
 * Represents FetchProductRestrictionsOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function FetchProductRestrictionsOperation(data, result) {
    AbstractProductRestrictionOperation.call(this, data, result);

    this.file = null;
    this.fileWriter = null;
    this.streamWriter = null;
}

/* Inherits AbstractProductRestrictionOperation */
FetchProductRestrictionsOperation.prototype = Object.create(AbstractProductRestrictionOperation.prototype);

/**
 * Retrieves the stream writer for the product restrictions operation.
 * @return {dw.io.CSVStreamWriter} - The stream writer used for writing product restriction records.
 */
FetchProductRestrictionsOperation.prototype.getStreamWriter = function () {
    const fileUtils = require('*/cartridge/scripts/util/globale/file');

    const csvColumnsMap = this.getCSVColumnsMap();
    const csvColumnHeaders = [
        csvColumnsMap.RequestId.header,
        csvColumnsMap.ProductCode.header,
        csvColumnsMap.CountryCode.header,
        csvColumnsMap.IsRestricted.header,
        csvColumnsMap.IsForbidden.header,
        csvColumnsMap.VATRateValue.header,
        csvColumnsMap.IsVerified.header,
        csvColumnsMap.UploadedViaCatalog.header
    ];

    if (this.streamWriter === null) {
        this.file = fileUtils.createFile(this.getImpexRestrictionDir(), this.getRestrictionFeedFileNameTemplate(), 'csv');
        this.fileWriter = fileUtils.createFileWriter(this.file);
        this.streamWriter = fileUtils.createStreamWriter(this.fileWriter, 'csv', ',', '"');
        this.streamWriter.writeNext(csvColumnHeaders);
    }

    return this.streamWriter;
};

/**
 * Creates ProductCountry instance using the API response record.
 *
 * @param {Object} productCountryRecord - The API response record.
 * @return {ProductCountry} - The product country object.
 */
FetchProductRestrictionsOperation.prototype.createProductCountry = function (productCountryRecord) {
    const ProductCountry = require('*/cartridge/models/globale/api/ProductCountry');
    const VATRateType = require('*/cartridge/models/globale/api/VATRateType');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    var productCountry = new ProductCountry();

    productCountry.ProductCode = productCountryRecord.ProductCode || null;
    productCountry.CountryCode = productCountryRecord.CountryCode || null;
    productCountry.IsRestricted = productCountryRecord.IsRestricted || false;
    productCountry.IsForbidden = productCountryRecord.IsForbidden || false;
    productCountry.VATRateType = (function (record) {
        var vatRateType = new VATRateType();

        if (('VATRateType' in record) && record.VATRateType) {
            vatRateType.VATRateTypeCode = record.VATRateType.VATRateTypeCode || null;
            vatRateType.Rate = objectUtils.getValueByPath(record.VATRateType, 'Rate', null);
            vatRateType.Name = record.VATRateType.Name || null;
        }

        return vatRateType;
    }(productCountryRecord));
    productCountry.IsVerified = productCountryRecord.IsVerified || false;
    productCountry.UploadedViaCatalog = productCountryRecord.UploadedViaCatalog || false;

    return productCountry;
};

/**
 * Sends FetchProductRestrictions request
 * @throws {Error}
 */
FetchProductRestrictionsOperation.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var logger = globaleHelpers.getLogger();
    var serviceResponse = {};
    var restrictionRecords = [];
    var requestId = 0;

    try {
        var service = geServiceMgr.getProductRestrictionsService();
        var initialServiceUrl = service.getURL();

        do {
            // Fetch Global-e ProductRestrictions
            service.setURL(initialServiceUrl + '&requestId=' + requestId);
            serviceResponse = this.getServiceResponse(service.call());

            if (
                (('Code' in serviceResponse) && serviceResponse.Code) ||
                (('Error' in serviceResponse) && serviceResponse.Error)
            ) {
                throw Error('Impossible to fetch ProductRestrictions: ' + JSON.stringify(serviceResponse));
            }

            restrictionRecords = (('RecentProductCountries' in serviceResponse) && serviceResponse.RecentProductCountries) || [];
            logger.info('Found {0} records', restrictionRecords.length);

            // Save Global-e ProductRestrictions
            restrictionRecords.forEach(function (restrictionRecord) { // eslint-disable-line no-loop-func
                if (
                    ('ProductCode' in restrictionRecord) && restrictionRecord.ProductCode &&
                    ('CountryCode' in restrictionRecord) && restrictionRecord.CountryCode
                ) {
                    var productCountry = this.createProductCountry(restrictionRecord);

                    this.getStreamWriter().writeNext([
                        requestId,
                        productCountry.ProductCode,
                        productCountry.CountryCode,
                        productCountry.IsRestricted,
                        productCountry.IsForbidden,
                        productCountry.VATRateType.Rate,
                        productCountry.IsVerified,
                        productCountry.UploadedViaCatalog
                    ]);
                }
            }, this);

            requestId = (('RequestId' in serviceResponse) && serviceResponse.RequestId) || 0;
        } while (restrictionRecords.length > 0 && requestId !== 0);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    } finally {
        if (this.streamWriter !== null) {
            this.streamWriter.close();
        }

        if (this.fileWriter !== null) {
            this.fileWriter.close();
        }
    }

    this.operationResult.success = true;
};

module.exports = FetchProductRestrictionsOperation;
