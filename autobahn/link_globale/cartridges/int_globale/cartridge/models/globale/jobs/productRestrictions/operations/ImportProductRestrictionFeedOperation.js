'use strict';

var AbstractProductRestrictionOperation = require('*/cartridge/models/globale/jobs/productRestrictions/operations/AbstractProductRestrictionOperation');

/**
 * Represents ImportProductRestrictionFeedOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function ImportProductRestrictionFeedOperation(data, result) {
    AbstractProductRestrictionOperation.call(this, data, result);
}

/* Inherits AbstractProductRestrictionOperation */
ImportProductRestrictionFeedOperation.prototype = Object.create(AbstractProductRestrictionOperation.prototype);

/**
 * Creates ProductCountry instance using the API response record.
 *
 * @param {Array} csvRecord - The API response record.
 * @return {ProductCountry} - The product country object.
 */
ImportProductRestrictionFeedOperation.prototype.createProductCountry = function (csvRecord) {
    const ProductCountry = require('*/cartridge/models/globale/api/ProductCountry');
    const VATRateType = require('*/cartridge/models/globale/api/VATRateType');

    const csvColumnsMap = this.getCSVColumnsMap();
    var productCountry = new ProductCountry();

    productCountry.ProductCode = csvRecord[csvColumnsMap.ProductCode.index] || null;
    productCountry.CountryCode = csvRecord[csvColumnsMap.CountryCode.index] || null;
    productCountry.IsRestricted = csvRecord[csvColumnsMap.IsRestricted.index] === 'true';
    productCountry.IsForbidden = csvRecord[csvColumnsMap.IsForbidden.index] === 'true';
    productCountry.VATRateType = (function (record) {
        var vatRateType = new VATRateType();

        vatRateType.VATRateTypeCode = null;
        vatRateType.Rate = record[csvColumnsMap.VATRateValue.index] || null;
        vatRateType.Name = null;

        return vatRateType;
    }(csvRecord));
    productCountry.IsVerified = csvRecord[csvColumnsMap.IsVerified.index] === 'true';
    productCountry.UploadedViaCatalog = csvRecord[csvColumnsMap.UploadedViaCatalog.index] === 'true';

    return productCountry;
};

/**
 * Imports ProductCountry data feeds
 * @throws {Error}
 */
ImportProductRestrictionFeedOperation.prototype.run = function () {
    const ProductMgr = require('dw/catalog/ProductMgr');
    const File = require('dw/io/File');
    const FileReader = require('dw/io/FileReader');
    const CSVStreamReader = require('dw/io/CSVStreamReader');
    const fileUtils = require('*/cartridge/scripts/util/globale/file');

    try {
        var files = fileUtils.getFiles(this.getImpexRestrictionDir(), this.getRestrictionFeedFileNameRegExp()); // eslint-disable-line no-useless-escape
        files.forEach(function (filePath) {
            let csvFile = new File(filePath);
            let fileReader = new FileReader(csvFile);
            let csvStreamReader = new CSVStreamReader(fileReader, ',', '"', 1);

            var line;
            while ((line = csvStreamReader.readNext()) !== null) { // eslint-disable-line no-cond-assign
                // Each element in the 'line' array represents a field in the CSV line
                let productCountry = this.createProductCountry(line);
                if (productCountry.ProductCode !== null) {
                    let product = ProductMgr.getProduct(productCountry.ProductCode);
                    this.updateProductRestrictions(product, productCountry);
                    this.updateProductVatRates(product, productCountry);
                }
            }

            csvStreamReader.close();
            fileReader.close();
        }, this);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = ImportProductRestrictionFeedOperation;
