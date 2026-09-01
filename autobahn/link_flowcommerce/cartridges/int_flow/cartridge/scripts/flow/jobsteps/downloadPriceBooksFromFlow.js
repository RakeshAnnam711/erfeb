'use strict';

/**
 * Downloads a Price Book from Flow
 * @param {Object} listedFile - Remote File
 * @param {string} remoteFolder - Remote Folder
 * @param {dw.svc.FTPService} service - FTP Service
 * @returns {boolean} File downloaded status
 */
function downloadPriceBook(listedFile, remoteFolder, service) {
    var File = require('dw/io/File');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');

    var time = (new Date()).toISOString().substring(11, 19).replace(/:/g, '');
    var downloadPath = remoteFolder + '/' + listedFile.name;
    var file = new File(JobHelper.getJobFilePath(JobHelper.paths.PRICEBOOK_FOLDER + '/' + time + '_' + listedFile.name));
    var result;

    if (file.exists()) {
        file.remove();
    }

    result = service.call({
        operation: 'getBinary',
        params: [downloadPath, file]
    });

    if (!result.ok) {
        file.remove();
    }

    return result.ok;
}

/**
 * Downloads the Price Books from Flow via SFTP
 * @param {Object} options - Job options
 * @returns {dw.system.Status} Status Code
 */
function downloadPriceBooksFromFlow(options) {
    var Status = require('dw/system/Status');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var remoteFolder = options.remoteFolder;
    var service = JobHelper.getSFTPService();
    var listResult;
    var files;

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    JobHelper.createFolders();
    JobHelper.setSFTPCredentials(service);

    try {
        listResult = service.call({
            operation: 'list',
            params: [remoteFolder]
        });

        if (listResult.ok) {
            files = listResult.object;

            if (files != null) {
                files.forEach(function (file) {
                    downloadPriceBook(file, remoteFolder, service);
                });
            } else {
                return new Status(Status.OK, null, 'Process finished. No price books to download');
            }
        } else {
            return new Status(Status.ERROR, null, 'Process failed. Unable to list remote folder.');
        }
    } catch (e) {
        FlowHelper.logger.error(e.message);
        return new Status(Status.ERROR, null, e.message);
    }

    return new Status(Status.OK, null, 'Price books successfully downloaded from Flow.');
}

exports.downloadPriceBooksFromFlow = downloadPriceBooksFromFlow;
