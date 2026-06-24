/* eslint-disable quote-props */

'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents RestrictedItemsFeedUploadOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function RestrictedItemsFeedUploadOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
RestrictedItemsFeedUploadOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorCode - operation data
 * @param {string} errorMessage - result object
 * @throws {Error}
 */
RestrictedItemsFeedUploadOperation.prototype.triggerError = function (errorCode, errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorCode = errorCode;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Upload Restricted Items file to the SFTP destination
 * @param {string} sftpCredentialID - SFTP Credential ID
 * @returns {dw.system.Status} - operation status
 */
RestrictedItemsFeedUploadOperation.prototype.upload = function (sftpCredentialID) {
    var Status = require('dw/system/Status');
    try {
        // upload catalog feed file
        return this.uploadFile(this.operationData.data.impex.fileType || 'csv', this.operationData.data, sftpCredentialID);
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }
};

/**
 * Upload Restricted Items file
 * @throws {Error}
 */
RestrictedItemsFeedUploadOperation.prototype.run = function () {
    var validator = require('*/cartridge/scripts/util/globale/validator');
    var context = this;

    // iniatial validation of operation data
    if (!this.operationData.data) {
        this.triggerError(107, 'Invalid configuration: ' + JSON.stringify(this.operationData.data));
    }
    var result = validator.validate(this.operationData.data, {
        'impex.folderPath': { required: true },
        'impex.fileName': { required: true },
        'sftpCredentialIDs': { required: true }
    });
    if (!result.valid) {
        this.triggerError(107, 'Invalid configuration: ' + JSON.stringify(result));
    }

    // iterate over all SFTP destinations and upload the feed
    this.operationResult.success = true;
    this.operationData.data.sftpCredentialIDs.forEach(function (sftpCredentialID) {
        var uploadStatus = context.upload(sftpCredentialID);
        if (uploadStatus.isError()) {
            context.operationResult.success = false;
            context.triggerError(107, 'Restrictions Feed Upload Error: ' + uploadStatus.getMessage());
        }
    });

    // archieve catalog feed file
    var archieveStatus = this.moveToArchieve(this.operationData.data.impex.fileType || 'csv', this.operationData.data);
    if (archieveStatus.isError()) {
        this.operationResult.success = false;
        this.triggerError(107, 'Restrictions Feed Archivation Error: ' + archieveStatus.getMessage());
    }
};

module.exports = RestrictedItemsFeedUploadOperation;
