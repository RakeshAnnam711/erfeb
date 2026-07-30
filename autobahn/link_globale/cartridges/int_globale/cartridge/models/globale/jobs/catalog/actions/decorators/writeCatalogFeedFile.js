'use strict';

/**
 * Checks if a product should be skipped based on certain conditions
 * @param {dw.catalog.Product} product - Product
 * @param {boolean} addMasterProducts - Flag to add master products
 * @param {boolean} addVariationGroupProducts - Flag to add variation group products
 * @param {boolean} processOnlyOnlineProducts - Flag to process only online products
 * @param {boolean} processOnlyModifiedProducts - Flag to process only modified products
 * @param {Date|null} catalogFeedLastRun - Catalog Feed Last Run Date
 * @return {boolean} - true if the product should be skipped, false otherwise
 */
function isSkipProduct(product, addMasterProducts, addVariationGroupProducts, processOnlyOnlineProducts, processOnlyModifiedProducts, catalogFeedLastRun) {
    if (
        product.productSet
        || (addMasterProducts !== true && product.master)
        || (addVariationGroupProducts !== true && product.variationGroup)
        || (processOnlyOnlineProducts === true && !product.online)
        || (processOnlyModifiedProducts === true && catalogFeedLastRun && product.getLastModified().getTime() < catalogFeedLastRun.getTime())
    ) {
        return true;
    }
    return false;
}

/**
 * Writes the file headers
 * @param {Array} fileColumns - File columns
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @returns {void}
 */
function writeFileHeaders(fileColumns, streamWriter) {
    var headers = fileColumns.map(function (column) {
        return column.header;
    });
    streamWriter.writeNext(headers);
}

/**
 * Writes a line to the CSV stream
 * @param {dw.catalog.Product} product - Product
 * @param {Array} fileColumns - File columns
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @returns {void}
 */
function writeProductLine(product, fileColumns, streamWriter) {
    var fieldMgr = require('*/cartridge/scripts/globale/catalogFeed/fieldMgr');

    var line = fileColumns.map(function (column) {
        var field = fieldMgr.createField(column, product);
        return field.getValue();
    });
    streamWriter.writeNext(line);
}

/**
 * Writes Catalog File based on ProductMgr iterator and returns status data
 * @param {dw.util.SeekableIterator} productsIterator - Products iterator
 * @param {dw.io.FileWriter} fileWriter - File writer
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @param {Object} config - Catalog feed configuration
 * @param {Date|null} catalogFeedLastRun - Catalog feed last run date
 * @return {Object} - Catalog feed file data
 */
function writeCatalogFeedFile(productsIterator, fileWriter, streamWriter, config, catalogFeedLastRun) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    config = config || {}; // eslint-disable-line no-param-reassign
    var addMasterProducts = config.addMasterProducts === true;
    var addVariationGroupProducts = config.addVariationGroupProducts === true;
    var processOnlyOnlineProducts = config.processOnlyOnlineProducts === true;
    var processOnlyModifiedProducts = config.processOnlyModifiedProducts === true;
    var fileColumns = 'fileColumns' in config ? config.fileColumns : [];

    var processedProducts = 0;

    try {
        // write headers
        writeFileHeaders(fileColumns, streamWriter);

        // write products lines
        while (productsIterator.hasNext()) {
            var product = productsIterator.next();
            try {
                // process variation products of variation group product if its master product is not categorized
                if (product.variationGroup && (product.variationModel.master.categories.length === 0)) {
                    var variantsIterator = product.variants.iterator();

                    while (variantsIterator.hasNext()) {
                        var variant = variantsIterator.next();
                        try {
                            // check if the product should be skipped otherwise write product line
                            if (!isSkipProduct(variant, addMasterProducts, addVariationGroupProducts, processOnlyOnlineProducts, processOnlyModifiedProducts, catalogFeedLastRun)) {
                                writeProductLine(variant, fileColumns, streamWriter);
                                processedProducts++;
                                if (processedProducts % 100 === 0) {
                                    fileWriter.flush();
                                }
                            }
                        } catch (e) {
                            logger.error('Cannot export product {0}. Error: {1}', (variant && variant.ID), logger.message(e));
                        }
                    }
                }

                // check if the product should be skipped otherwise write product line
                if (!isSkipProduct(product, addMasterProducts, addVariationGroupProducts, processOnlyOnlineProducts, processOnlyModifiedProducts, catalogFeedLastRun)) {
                    writeProductLine(product, fileColumns, streamWriter);
                    processedProducts++;
                    if (processedProducts % 100 === 0) {
                        fileWriter.flush();
                    }
                }
            } catch (e) {
                logger.error('Cannot export product {0}. Error: {1}', (product && product.ID), logger.message(e));
            }
        }
        productsIterator.close();
        fileWriter.flush();

        logger.info('File Data. ProcessedProducts: {0}', processedProducts);
    } catch (e) {
        return {
            status: new Status(Status.ERROR, '100', (e.message + '; ' + e.stack))
        };
    }

    return {
        status: new Status(Status.OK),
        processedProducts: processedProducts
    };
}

module.exports = function (object) {
    Object.defineProperties(object, {
        writeCatalogFeedFile: {
            enumerable: true,
            value: writeCatalogFeedFile
        }
    });
};
