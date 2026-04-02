'use strict';

/**
 * Creates writable file
 * @throws {Error}
 * @param {string|undefined|null} folderPath - IMPEX folder name
 * @param {string|undefined|null} fileName - IMPEX file name
 * @param {string} fileType - File type
 * @returns {dw.io.File} - Writable file
 */
function createFile(folderPath, fileName, fileType) {
    var StringUtils = require('dw/util/StringUtils');
    var Calendar = require('dw/util/Calendar');
    var File = require('dw/io/File');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var file = null;

    try {
        // create folder
        var folder = new File(File.getRootDirectory(File.IMPEX), folderPath);
        if (!folder || (!folder.isDirectory() && !folder.mkdirs())) {
            throw new Error('Cannot create IMPEX folder by path: ', (File.getRootDirectory(File.IMPEX).fullPath + folderPath));
        }

        // create file
        fileName = fileName.replace(/\{datetime\}/ig, StringUtils.formatCalendar(new Calendar(), 'yyyyMMddHHmmss_S')); // eslint-disable-line no-param-reassign
        file = new File(folder.fullPath + File.SEPARATOR + fileName + '.' + fileType);

        logger.info('File {0} has been created', file.fullPath);
    } catch (e) {
        logger.error('File cannot be created due the reason: {0}', logger.message(e));
        throw e;
    }

    return file;
}

/**
 * Creates FileWriter instance
 * @param {dw.io.File} file - File to write
 * @returns {dw.io.FileWriter} - FileWriter
 */
function createFileWriter(file) {
    var FileWriter = require('dw/io/FileWriter');
    return new FileWriter(file);
}

/**
 * Creates stream writer
 * @throws {Error}
 * @param {dw.io.FileWriter} fileWriter - File writer
 * @param {string} fileType - File type
 * @param {string|undefined|null} separator - File separator
 * @param {string|undefined|null} quote - File quote
 * @returns {dw.io.CSVStreamWriter|dw.io.XMLStreamWriter} - Stream writer
 */
function createStreamWriter(fileWriter, fileType, separator, quote) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var StreamWriter = null;
    var writer = null;

    try {
        // define stream writer class
        switch (fileType) {
            case 'csv':
                StreamWriter = require('dw/io/CSVStreamWriter');
                writer = new StreamWriter(fileWriter, separator, quote);
                break;
            case 'xml':
                StreamWriter = require('dw/io/XMLIndentingStreamWriter');
                writer = new StreamWriter(fileWriter);
                break;
            default:
                throw new Error('Not valid file type: ' + fileType);
        }
    } catch (e) {
        logger.error('File Stream Writter cannot be created due the reason: {0}', logger.message(e));
        throw e;
    }

    return writer;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        createFile: {
            enumerable: true,
            value: createFile
        },
        createStreamWriter: {
            enumerable: true,
            value: createStreamWriter
        },
        createFileWriter: {
            enumerable: true,
            value: createFileWriter
        }
    });
};
