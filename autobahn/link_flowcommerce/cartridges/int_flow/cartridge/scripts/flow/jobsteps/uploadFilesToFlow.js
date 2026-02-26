'use strict';

/**
 * Uploads files from the Flow Export Folder to Flow via SFTP
 * @param {Object} options - Job options
 * @returns {dw.system.Status} Status Code
 */
function uploadFilesToFlow(options) {
    var Status = require('dw/system/Status');
    var File = require('dw/io/File');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');
    var collections = require('*/cartridge/scripts/util/collections');

    var remoteFolder = options.remoteFolder;
    var service = JobHelper.getSFTPService();
    var localFolder = new File(JobHelper.getJobFilePath(JobHelper.paths.EXPORT_FOLDER));
    var children;

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    if (options.disabled) {
        return new Status(Status.OK, null, 'Export Files to Flow step skipped.');
    }

    if (!localFolder.exists()) {
        return new Status(Status.OK, null, 'Process finished no files to upload');
    }

    JobHelper.setSFTPCredentials(service);

    try {
        children = localFolder.listFiles(function (file) {
            return file.isFile();
        });

        collections.forEach(children, function (file) {
            var remoteFile = remoteFolder + '/' + file.getName();

            var result = service.call({
                operation: 'putBinary',
                params: [remoteFile, file]
            });

            if (result.ok) {
                file.remove();
            } else {
                throw new Error('Error sending File to Flow: ' + file.getName());
            }
        });
    } catch (e) {
        FlowHelper.logger.error(e.message);
        return new Status(Status.ERROR, null, e.message);
    }

    return new Status(Status.OK, null, 'Files successfully uploaded to Flow.');
}

exports.uploadFilesToFlow = uploadFilesToFlow;
