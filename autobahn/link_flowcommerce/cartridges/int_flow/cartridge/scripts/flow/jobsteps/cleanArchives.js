'use strict';

/**
 * Deletes old daily folders from a given archive folder
 * @param {dw.io.File} archiveFolder - Archive Folder
 * @param {int} fileAgeInDays - Days to keep the folder
 */
function cleanArchiveFolder(archiveFolder, fileAgeInDays) {
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');
    var collections = require('*/cartridge/scripts/util/collections');

    var dayInMills = 86400000;
    var today = new Date();
    var foldersToDelete = [];

    var folderContents = archiveFolder.listFiles(function (file) {
        return file.isDirectory();
    });

    collections.forEach(folderContents, function (folderContent) {
        var dateFields = folderContent.name.split('-');
        var folderDate = new Date(dateFields[0], parseInt(dateFields[1], 10) - 1, dateFields[2]);

        if (today.getTime() - folderDate.getTime() > fileAgeInDays * dayInMills) {
            foldersToDelete.push(folderContent);
        }
    });

    foldersToDelete.forEach(function (folder) {
        JobHelper.removeFolder(folder);
    });
}

/**
 * Cleans the Flow Archive folders
 * @param {Object} options - Job options
 * @returns {dw.system.Status} Status Code
 */
function cleanArchives(options) {
    var File = require('dw/io/File');
    var Status = require('dw/system/Status');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var status = new Status(Status.OK, null, 'Process finished.');
    var fileAgeInDays = options.fileAgeInDays;

    var archiveFolders = [
        new File(JobHelper.getJobFilePath(JobHelper.paths.PRICEBOOK_ARCHIVE_FOLDER)),
        new File(JobHelper.getJobFilePath(JobHelper.paths.SHIPPINGMETHODS_ARCHIVE_FOLDER)),
        new File(JobHelper.getJobFilePath(JobHelper.paths.FRAUDCHECK_ARCHIVE_FOLDER))
    ];

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    archiveFolders.forEach(function (archiveFolder) {
        if (archiveFolder.exists()) {
            try {
                cleanArchiveFolder(archiveFolder, fileAgeInDays);
            } catch (e) {
                status = new Status(Status.ERROR, null, 'Process finished with error deleting files');
                FlowHelper.logger.error('Could not delete archive folder: ' + archiveFolder.getName() + ', ' + e.message);
            }
        }
    });

    return status;
}

exports.cleanArchives = cleanArchives;
