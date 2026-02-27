'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CatalogFeedGenerateOperation
 * @constructor
 * @param {Object} data - Operation data
 * @param {Object} result - Result object
 */
function CatalogFeedGenerateOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CatalogFeedGenerateOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorCode - Error code
 * @param {string} errorMessage - Error message
 * @throws {Error}
 */
CatalogFeedGenerateOperation.prototype.triggerError = function (errorCode, errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorCode = errorCode;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Generate Catalog file
 * @throws {Error}
 */
CatalogFeedGenerateOperation.prototype.run = function () {
    var File = require('dw/io/File');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var fileUtils = require('*/cartridge/scripts/util/globale/file');
    var file = null;

    try {
        logger.info('Catalog Feed configuration:\n{0}', JSON.stringify(this.operationData.data));

        // validate data/config
        var validateConfigStatus = this.validateCatalogFeedConfig(this.operationData.data);
        if (validateConfigStatus.isError()) {
            this.triggerError(107, 'Validation of configuration is failed! Error: ' + validateConfigStatus.getMessage());
        }

        // set locale
        var setLocaleStatus = this.setLocale(this.operationData.data.localeId);
        if (setLocaleStatus.isError()) {
            this.triggerError(107, 'Setting of locale is failed! Error: ' + setLocaleStatus.getMessage());
        }

        // get products iterator start position
        var productsStartPositionCurrentRun = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geCatalogFeedStartPosition);

        // get products iterator data
        var productsIteratorData = this.getProductsIterator(
            this.operationData.data.catalogId,
            globaleHelpers.consts.geCatalogFeed.DEFAULT_EXPORT_START_POSITION,
            productsStartPositionCurrentRun,
            this.operationData.data.processProductsPerRunCount
        );
        if (productsIteratorData.status.isError()) {
            this.triggerError(107, 'Getting catalog iterator data is failed! Error: ' + productsIteratorData.status.getMessage());
        }
        var productsIterator = productsIteratorData.productsIterator;
        var productsStartPositionNextRun = productsIteratorData.productsStartPositionNextRun;

        // create file
        file = fileUtils.createFile(
            (File.IMPEX + this.operationData.data.folderPath),
            this.operationData.data.fileName,
            this.operationData.data.fileType
        );
        var fileWriter = fileUtils.createFileWriter(file);
        var streamWriter = fileUtils.createStreamWriter(
            fileWriter,
            this.operationData.data.fileType,
            this.operationData.data.fileSeparator,
            this.operationData.data.fileQuote
        );

        // get feed last run time
        var feedLastRun = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geCatalogFeedLastRun);

        // write file and get status data
        var writeFileStatus = this.writeCatalogFeedFile(
            productsIterator,
            fileWriter,
            streamWriter,
            this.operationData.data,
            feedLastRun
        );
        streamWriter.close();
        fileWriter.close();
        if (writeFileStatus.status.isError()) {
            this.triggerError(107, 'Writing of catalog feed file is failed! Error: ' + writeFileStatus.status.getMessage());
        }

        // remove file if were processed 0 products
        if (writeFileStatus.processedProducts === 0) {
            logger.info('Since no exportable products found in catalog - the catalog file will be deleted.');
            if (file && !file.remove()) {
                logger.error('Cannot remove catalog feed file: {0}', file.fullPath);
            }
        }

        // update feed start position
        globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geCatalogFeedStartPosition, productsStartPositionNextRun);
        logger.info('Updated catalog feed start position: {0}', productsStartPositionNextRun);

        // update feed last run time only if feed doesn't work in delta mode or if it works in delta mode and next start position is 0
        if (
            this.operationData.data.processOnlyModifiedProducts !== true
            || (this.operationData.data.processOnlyModifiedProducts === true && productsStartPositionNextRun === 0)
        ) {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geCatalogFeedLastRun, new Date());
            logger.info('Updated catalog feed last run time to: {0}', new Date());
        }
    } catch (e) {
        // remove file if it was created and error exists
        if (file && !file.remove()) {
            logger.error('Cannot remove catalog feed file: {0}', file.fullPath);
        }
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = CatalogFeedGenerateOperation;
