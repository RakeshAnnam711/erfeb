'use strict';

/**
 * Creates writable file
 * @throws {Error}
 * @param {string|undefined|null} folderPath - folder name
 * @param {string|undefined|null} fileName - file name
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
        var folder = new File(folderPath);
        if (!folder || (!folder.isDirectory() && !folder.mkdirs())) {
            throw new Error('Cannot create folder by path: ', (folderPath));
        }

        // create file
        fileName = fileName.replace(/\{datetime\}/ig, StringUtils.formatCalendar(new Calendar(), 'yyyyMMddHHmmss_S')); // eslint-disable-line no-param-reassign
        file = new File(folder.fullPath + File.SEPARATOR + fileName + (fileType ? '.' + fileType : ''));

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
                break;
            default:
                throw new Error('Not valid file type: ' + fileType);
        }

        // create stream writer
        writer = new StreamWriter(fileWriter, separator, quote);
    } catch (e) {
        logger.error('File Stream Writter cannot be created due the reason: {0}', logger.message(e));
        throw e;
    }

    return writer;
}

/**
 * Loads files from a given directory that match the given pattern
 * Non recursive.
 * Throws Exception if directory does not exist.
 *
 * @param {string} directoryPath (Absolute) Directory path to load from
 * @param {string} filePattern RegEx pattern that the filenames must match
 *
 * @returns {Array} - files array
 */
function getFiles(directoryPath, filePattern) {
    var File = require('dw/io/File');
    var PropertyComparator = require('dw/util/PropertyComparator');

    var directory = new File(directoryPath);

    // We only want existing directories
    if (!directory.isDirectory()) {
        return [];
    }

    var filesList = directory.listFiles();

    filesList.sort(new PropertyComparator('name', true));
    var files = [];

    for (var i = 0; i < filesList.length; i += 1) {
        files.push(filesList[i].name);
    }

    return files.filter(function (filePath) {
        return empty(filePattern) || (!empty(filePattern) && filePath.match(filePattern) !== null);
    }).map(function (filePath) {
        return directoryPath + File.SEPARATOR + filePath;
    });
}

/**
 * Zips the source file and returns the zipped file.
 *
 * @param {dw.io.File} sourceFile - the source file to be zipped
 * @param {string} zipFilePath - the path where the zipped file will be saved
 * @return {dw.io.File} the zipped file
 */
function zipFile(sourceFile, zipFilePath) {
    var File = require('dw/io/File');
    var zippedFile = new File(zipFilePath);

    if (sourceFile.exists()) {
        sourceFile.zip(zippedFile);
        sourceFile.remove();
    }

    return zippedFile;
}

/**
 * Moves the source file to the specified destination directory with the given file name.
 *
 * @param {dw.io.File} sourceFile - the source file to be moved
 * @param {string} dstDirPath - the destination directory path
 * @param {string} dstFileName - the destination file name
 * @return {boolean} true if the file is successfully moved, false otherwise
 */
function moveFile(sourceFile, dstDirPath, dstFileName) {
    var File = require('dw/io/File');
    var dstDir = new File(dstDirPath);
    var dstFile = new File(dstDir.fullPath + (dstFileName || sourceFile.name));

    if (!dstDir.exists()) {
        dstDir.mkdirs();
    }

    return sourceFile.renameTo(dstFile);
}

module.exports = {
    createFile: createFile,
    createFileWriter: createFileWriter,
    createStreamWriter: createStreamWriter,
    getFiles: getFiles,
    zipFile: zipFile,
    moveFile: moveFile
};
