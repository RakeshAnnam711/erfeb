
'use strict';
var base = module.superModule;

/**
 * (S)FTP service methods (to download and upload files)
 *
 * @module scripts/services/FtpClientHelper
 */

var File = require('dw/io/File');

var FileHelper = require('*/cartridge/scripts/file/FileHelper');

base.prototype.uploadFiles = function (fileList, targetFolder, archiveFolder, recursive) {
    var self = this;

    if (!empty(archiveFolder)) {
        archiveFolder = File.IMPEX + (archiveFolder.charAt(0).equals(File.SEPARATOR) ? archiveFolder : File.SEPARATOR + archiveFolder);
        FileHelper.createDirectory(archiveFolder);
    }

    if (!empty(targetFolder)) {
        // Only attempt to create targetFolder in non _root_ case
        targetFolder = targetFolder.charAt(targetFolder.length - 1).equals(File.SEPARATOR) ? targetFolder : targetFolder + File.SEPARATOR;

        // Try to enter in the directory
        // If this task fails, this means that we cannot create the target folder if it does not exists.
        // It will throw an error and abort the step.
        self.enterDirectory(targetFolder);
    }


    fileList.forEach(function (file) {
        if (recursive) {
            if (file.createDirectory) {
                self.enterDirectory(file.targetFile);
            } else {
                self.uploadFile(file.targetFile, file.sourceFile, archiveFolder);
            }
        } else {
            self.uploadFile(targetFolder, new File(file), archiveFolder);
        }
    });

    return true;
};

module.exports = base;
