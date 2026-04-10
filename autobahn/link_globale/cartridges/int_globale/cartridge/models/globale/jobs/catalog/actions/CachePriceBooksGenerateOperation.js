'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents CachePriceBooksGenerateOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function CachePriceBooksGenerateOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
CachePriceBooksGenerateOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorCode - operation data
 * @param {string} errorMessage - result object
 * @throws {Error}
 */
CachePriceBooksGenerateOperation.prototype.triggerError = function (errorCode, errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorCode = errorCode;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Generate Catalog file
 * @throws {Error}
 */
CachePriceBooksGenerateOperation.prototype.run = function () {
    var globaleCachingPriceBooksHelpers = require('*/cartridge/scripts/helpers/globaleCachingPriceBooksHelpers');

    // create and write Cache Price Books XML file
    var file = this.createFile('/src/globale/pricebooks', 'globale_pricebooks_{datetime}', 'xml');
    var fileWriter = this.createFileWriter(file);
    var streamWriter = this.createStreamWriter(fileWriter, 'xml');
    var writeStatus = this.writeCachePriceBooksXmlFile(fileWriter, streamWriter, globaleCachingPriceBooksHelpers.generatePriceBooksCombinations());
    streamWriter.close();
    fileWriter.close();

    if (writeStatus.isError()) {
        this.triggerError(109, 'Writing of XML file is failed! Error: ' + writeStatus.getMessage());
    }

    this.operationResult.success = true;
};

module.exports = CachePriceBooksGenerateOperation;
