'use strict';

/**
 * Uploads file from IMPEX/* to Global-e SFTP folder
 * @param {string} fileType - File type
 * @param {Object} data - Input data
 * @returns {dw.system.Status} - operation status
 */
function moveToArchieve(fileType, data) {
    var Status = require('dw/system/Status');
    var File = require('dw/io/File');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    try {
        // find the IMPEX/* folder
        var folder = new File(File.getRootDirectory(File.IMPEX), data.impex.folderPath);
        if (!folder || !folder.isDirectory()) {
            throw new Error('Cannot find IMPEX folder by path: ' + (File.getRootDirectory(File.IMPEX).fullPath + data.impex.folderPath));
        }

        // find files to archive
        var testFileName = new RegExp('.*\.' + fileType + '$', 'i'); // eslint-disable-line no-useless-escape
        var files = folder.listFiles(function (file) {
            return testFileName.test(file.name);
        });
        if (!files || files.empty) {
            return new Status(Status.OK);
        }

        // create the IMPEX/* archive folder
        var archiveFolderPath = data.impex.archiveFolderPath || (data.impex.folderPath + File.SEPARATOR + 'archive');
        var archiveFolder = new File(File.getRootDirectory(File.IMPEX), archiveFolderPath);
        if (!archiveFolder || (!archiveFolder.isDirectory() && !archiveFolder.mkdirs())) {
            throw new Error('Cannot create IMPEX archive folder by path: ' + (File.getRootDirectory(File.IMPEX).fullPath + data.impex.folderPath));
        }

        // archive and zip files
        var filesIter = files.iterator();
        var zippedFiles = [];
        var failedZippedFiles = [];
        while (filesIter.hasNext()) {
            var zippingFile = filesIter.next();
            var filePath = zippingFile.fullPath;
            var zipArchiveFile = new File(archiveFolder.fullPath + File.SEPARATOR + zippingFile.name + '.zip');
            if (!zipArchiveFile.createNewFile()) {
                logger.error('Cannot create zip archive {0} for uploaded file {1}!', zipArchiveFile.fullPath, zippingFile.name);
            } else {
                try {
                    zippingFile.zip(zipArchiveFile);
                    zippedFiles.push(filePath + '.zip');
                    zippingFile.remove();
                } catch (e) {
                    failedZippedFiles.push(filePath);
                }
            }
        }
        if (zippedFiles.length > 0) {
            logger.info('Successfully Zipped Files:\n{0}', zippedFiles.join('\n'));
        }
        if (failedZippedFiles.length > 0) {
            logger.error('Failed Zip Files:\n{0}', failedZippedFiles.join('\n'));
        }
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        moveToArchieve: {
            enumerable: true,
            value: moveToArchieve
        }
    });
};
