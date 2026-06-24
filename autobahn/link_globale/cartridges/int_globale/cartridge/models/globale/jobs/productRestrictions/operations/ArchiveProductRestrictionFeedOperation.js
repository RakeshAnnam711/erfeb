'use strict';

var AbstractProductRestrictionOperation = require('*/cartridge/models/globale/jobs/productRestrictions/operations/AbstractProductRestrictionOperation');

/**
 * Represents ArchiveProductRestrictionFeedOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function ArchiveProductRestrictionFeedOperation(data, result) {
    AbstractProductRestrictionOperation.call(this, data, result);
}

/* Inherits AbstractProductRestrictionOperation */
ArchiveProductRestrictionFeedOperation.prototype = Object.create(AbstractProductRestrictionOperation.prototype);

/**
 * Archives ProductCountry data feeds
 * @throws {Error}
 */
ArchiveProductRestrictionFeedOperation.prototype.run = function () {
    const File = require('dw/io/File');
    const fileUtils = require('*/cartridge/scripts/util/globale/file');

    try {
        let files = fileUtils.getFiles(this.getImpexRestrictionDir(), this.getRestrictionFeedFileNameRegExp()); // eslint-disable-line no-useless-escape
        files.forEach(function (filePath) {
            let zipFilePath = filePath.replace('.csv', '.zip');
            let zippedFile = fileUtils.zipFile(new File(filePath), zipFilePath);
            fileUtils.moveFile(zippedFile, this.getImpexArchiveRestrictionDir());
        }, this);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = ArchiveProductRestrictionFeedOperation;
