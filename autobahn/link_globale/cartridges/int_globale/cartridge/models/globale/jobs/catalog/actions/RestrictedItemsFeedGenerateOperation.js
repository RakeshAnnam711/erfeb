'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents RestrictedItemsFeedGenerateOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function RestrictedItemsFeedGenerateOperation(data, result) {
    AbstractOperation.call(this, data, result);
    this.processedProducts = 0;
    this.processedCategories = 0;
    this.processedBrands = 0;
}

/* Inherits AbstractOperation */
RestrictedItemsFeedGenerateOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorCode - operation data
 * @param {string} errorMessage - result object
 * @throws {Error}
 */
RestrictedItemsFeedGenerateOperation.prototype.triggerError = function (errorCode, errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorCode = errorCode;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Generate Restricted Items file
 * @throws {Error}
 */
RestrictedItemsFeedGenerateOperation.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var validator = require('*/cartridge/scripts/util/globale/validator');
    var file;

    try {
        // iniatial validation of operation data
        if (!this.operationData.data) {
            this.triggerError(107, 'Invalid configuration: ' + JSON.stringify(this.operationData.data));
        }
        var result = validator.validate(this.operationData.data, {
            'impex.folderPath': { required: true },
            'impex.fileName': { required: true },
            scenarios: { required: true }
        });
        if (!result.valid) {
            this.triggerError(107, 'Invalid configuration: ' + JSON.stringify(result));
        }

        // set locale
        var setLocaleStatus = this.setLocale(this.operationData.data.file.locale);
        if (setLocaleStatus && setLocaleStatus.isError()) {
            this.triggerError(108, 'Set locale is failed!Error: ' + setLocaleStatus.getMessage());
        }

        // create and write restricted items feed file
        file = this.createFile(this.operationData.data.impex.folderPath, this.operationData.data.impex.fileName, this.operationData.data.impex.fileType || 'csv');
        var fileWriter = this.createFileWriter(file);
        var streamWriter = this.createStreamWriter(
            fileWriter,
            this.operationData.data.impex.fileType || 'csv',
            this.operationData.data.file.separator || ',',
            this.operationData.data.file.quote || '"'
        );
        var writeStatus = this.writeRestrictedItemsFeedFile(fileWriter, streamWriter, this.operationData.data);
        streamWriter.close();
        fileWriter.close();
        if (writeStatus.isError()) {
            this.triggerError(109, 'Writing of feed file is failed! Error: ' + writeStatus.getMessage());
        }

        // update time of feed last run
        globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geRestrictedItemsFeedLastRun, new Date());
    } catch (e) {
        // remove restricted items feed file if it was created and error exists
        if (file && !file.remove()) {
            logger.error('Cannot remove restricted items file: {0}', file.fullPath);
        }
        throw e;
    }

    // remove restricted items feed file if it was created and were processed 0 products
    if (this.processedProducts === 0 && this.processedCategories === 0 && this.processedBrands === 0) {
        logger.info('Since no exportable restricted items found - the restricted items file will be deleted.');
        if (file && !file.remove()) {
            logger.error('Cannot remove restricted items file: {0}', file.fullPath);
        }
    }

    this.operationResult.success = true;
};

module.exports = RestrictedItemsFeedGenerateOperation;
