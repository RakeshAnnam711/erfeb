'use strict';

/**
 * Uploads file from IMPEX/* to Global-e SFTP folder
 * @param {string} fileType - File type
 * @param {Object} data - Input data
 * @param {string} sftpCredentialID - SFTP Credential ID
 * @returns {dw.system.Status} - operation status
 */
function uploadFile(fileType, data, sftpCredentialID) {
    var Status = require('dw/system/Status');
    var File = require('dw/io/File');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');
    var logger = globaleHelpers.getLogger();

    try {
        // find the IMPEX/* folder
        var folder = new File(File.getRootDirectory(File.IMPEX), data.impex.folderPath);
        if (!folder || !folder.isDirectory()) {
            throw new Error('Cannot find IMPEX folder by path: ' + (File.getRootDirectory(File.IMPEX).fullPath + data.impex.folderPath));
        }

        // find files to upload
        var testFileName = new RegExp('.*\.' + fileType + '$', 'i'); // eslint-disable-line no-useless-escape
        var files = folder.listFiles(function (file) {
            return testFileName.test(file.name);
        });
        if (!files || files.empty) {
            logger.info('Nothing to upload to SFTP folder!');
            return new Status(Status.OK);
        }

        // get SFTP Upload service
        var sftpService = geServiceMgr.getSftpUpoadService(sftpCredentialID);

        // upload files to SFTP folder
        var filesIter = files.iterator();
        while (filesIter.hasNext()) {
            var file = filesIter.next();
            sftpService.call(file);
        }
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        uploadFile: {
            enumerable: true,
            value: uploadFile
        }
    });
};
