/* eslint-disable quote-props */

'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CatalogFeedUploadOperation
 * @constructor
 * @param {Object} data - Operation data
 * @param {Object} result - Result object
 */
function CatalogFeedUploadOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CatalogFeedUploadOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorCode - Error code
 * @param {string} errorMessage - Error message
 * @throws {Error}
 */
CatalogFeedUploadOperation.prototype.triggerError = function (errorCode, errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorCode = errorCode;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Upload Catalog file(s)
 * @param {string} sftpCredentialID - SFTP Credential ID
 * @param {Array} files - Files to upload
 * @returns {dw.system.Status} - operation status
 */
CatalogFeedUploadOperation.prototype.upload = function (sftpCredentialID, files) {
    var File = require('dw/io/File');
    var Status = require('dw/system/Status');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    try {
        // get SFTP Upload service
        var sftpService = geServiceMgr.getSftpUpoadService(sftpCredentialID);

        // upload files to SFTP folder
        files.forEach(function (filePath) {
            var file = new File(filePath);
            sftpService.call(file);
            logger.info(file.name + ': file was uploaded to SFTP folder!');
        });
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
};

/**
 * Archive Catalog file(s)
 * @param {Array} files - Files to upload
 * @returns {dw.system.Status} - operation status
 */
CatalogFeedUploadOperation.prototype.archive = function (files) {
    var Status = require('dw/system/Status');
    var File = require('dw/io/File');
    var fileUtils = require('*/cartridge/scripts/util/globale/file');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    try {
        files.forEach(function (filePath) {
            var file = new File(filePath);
            var zipFilePath = filePath.replace('.' + this.operationData.data.fileType, '.zip');
            var zippedFile = fileUtils.zipFile(file, zipFilePath);
            fileUtils.moveFile(zippedFile, File.IMPEX + this.operationData.data.archiveFolderPath);
            logger.info(file.name + ': file was moved to archive folder!');
        }, this);
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
};

/**
 * Upload Catalog file
 * @throws {Error}
 */
CatalogFeedUploadOperation.prototype.run = function () {
    var File = require('dw/io/File');
    var fileUtils = require('*/cartridge/scripts/util/globale/file');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    // validate data/config
    var validateConfigStatus = this.validateCatalogFeedConfig(this.operationData.data);
    if (validateConfigStatus.isError()) {
        this.triggerError(107, 'Validation of configuration is failed! Error: ' + validateConfigStatus.getMessage());
    }

    // get files to upload
    var files = fileUtils.getFiles(
        File.IMPEX + this.operationData.data.folderPath,
        '.*\.' + this.operationData.data.fileType + '$' // eslint-disable-line no-useless-escape
    );

    if (files && files.length === 0) {
        logger.info('No catalog feed file(s) to upload to SFTP folder!');
        this.operationResult.success = true;
        return;
    }

    // iterate over all SFTP destinations and upload the catalog feed file(s)
    this.operationResult.success = true;
    this.operationData.data.sftpCredentialIDs.forEach(function (sftpCredentialID) {
        var uploadStatus = this.upload(sftpCredentialID, files);
        if (uploadStatus.isError()) {
            this.operationResult.success = false;
            this.triggerError(107, 'Upload of catalog feed file(s) is failed! Error: ' + uploadStatus.getMessage());
        }
    }, this);

    // archieve catalog feed file(s)
    var archiveStatus = this.archive(files);
    if (archiveStatus.isError()) {
        this.operationResult.success = false;
        this.triggerError(107, 'Archivation of catalog feed file(s) is failed! Error: ' + archiveStatus.getMessage());
    }
};

module.exports = CatalogFeedUploadOperation;
