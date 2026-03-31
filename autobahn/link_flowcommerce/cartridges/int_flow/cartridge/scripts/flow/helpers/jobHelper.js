'use strict';

var File = require('dw/io/File');
var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

var FLOW_FOLDER = 'flow/' + FlowHelper.siteId;

var paths = {
    IMPEX_FOLDER: File.IMPEX + '/src',
    FLOW_FOLDER: FLOW_FOLDER,
    EXPORT_FOLDER: FLOW_FOLDER + '/export',
    CONFIGURATION_FOLDER: FLOW_FOLDER + '/configuration',
    PRICEBOOK_FOLDER: FLOW_FOLDER + '/pricebooks',
    SHIPPINGMETHODS_FOLDER: FLOW_FOLDER + '/shippingmethods',
    FRAUDCHECK_FOLDER: FLOW_FOLDER + '/fraudcheck',
    PRICEBOOK_ARCHIVE_FOLDER: FLOW_FOLDER + '/pricebooks/archive',
    SHIPPINGMETHODS_ARCHIVE_FOLDER: FLOW_FOLDER + '/shippingmethods/archive',
    FRAUDCHECK_ARCHIVE_FOLDER: FLOW_FOLDER + '/fraudcheck/archive'
};

/**
 * Gets the Flow SFTP Service from the Local Service Registry
 * @returns {dw.svc.FTPService} URL
 */
function getSFTPService() {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    return LocalServiceRegistry.createService('FlowSFTP', {
        createRequest: function (service, req) {
            var params = req.params || [];

            switch (params.length) {
                case 3:
                    service.setOperation(req.operation, params[0], params[1], params[2]);
                    break;
                case 2:
                    service.setOperation(req.operation, params[0], params[1]);
                    break;
                case 1:
                    service.setOperation(req.operation, params[0]);
                    break;
                case 0:
                    service.setOperation(req.operation);
                    break;
                default:
                    throw new Error('jobHelper.js - FlowSFTP - createRequest - Could not parse parameters');
            }
        },

        parseResponse: function (service, resp) {
            return resp;
        }
    });
}

/**
 * Sets the credentials of the SFTP Service
 * @param {dw.svc.FTPService} service - SFTP Service
 */
function setSFTPCredentials(service) {
    service.setCredentialID('FlowSFTP-' + FlowHelper.organizationId);
}

/**
 * Gets the path to a file in the Flow folder
 * @param {string} path - File path relative to the Impex folder
 * @param {boolean} relative - Flag to indicate whether to include the Impex folder path
 * @returns {string} The file path
 */
function getJobFilePath(path, relative) {
    return relative ? path : paths.IMPEX_FOLDER + '/' + path;
}

/**
 * Creates the daily folder structure in the archive folder
 * @param {string} dailyFolderPath - Daily archive folder path
 */
function createDailyArchiveFolder(dailyFolderPath) {
    var dailyFolder = new File(getJobFilePath(dailyFolderPath));

    if (!dailyFolder.exists()) {
        dailyFolder.mkdirs();
    }
}

/**
 * Archives the file in the archive folder
 * @param {dw.io.File} file - File to be archived
 * @param {string} archiveFolderPath - Path to the archive folder
 */
function archiveFile(file, archiveFolderPath) {
    var date = (new Date()).toISOString().substring(0, 10);
    var dailyArchiveFolderPath = archiveFolderPath + '/' + date;
    var archivedFilePath = dailyArchiveFolderPath + '/' + file.getName();
    var archivedFile;

    createDailyArchiveFolder(dailyArchiveFolderPath);

    archivedFile = new File(getJobFilePath(archivedFilePath));
    if (archivedFile.exists()) {
        archivedFile.remove();
    }

    file.copyTo(archivedFile);
    file.remove();
}

/**
 * Creates a CSV File class
 * @param {string} path - Impex file path
 * @returns {CSVFile} CSV File
 */
function createCSVFile(path) {
    var CSVFile = require('*/cartridge/scripts/flow/models/csvFile');

    if (!path) {
        return null;
    }

    return new CSVFile(getJobFilePath(path));
}

/**
 * Creates the Flow file structure
 */
function createFolders() {
    var folder = new File(getJobFilePath(paths.EXPORT_FOLDER));

    if (!folder.exists()) {
        folder.mkdirs();
    }

    folder = new File(getJobFilePath(paths.CONFIGURATION_FOLDER));

    if (!folder.exists()) {
        folder.mkdirs();
    }

    folder = new File(getJobFilePath(paths.PRICEBOOK_ARCHIVE_FOLDER));

    if (!folder.exists()) {
        folder.mkdirs();
    }

    folder = new File(getJobFilePath(paths.SHIPPINGMETHODS_ARCHIVE_FOLDER));

    if (!folder.exists()) {
        folder.mkdirs();
    }

    folder = new File(getJobFilePath(paths.FRAUDCHECK_ARCHIVE_FOLDER));

    if (!folder.exists()) {
        folder.mkdirs();
    }
}

/**
 * Removes a folder
 * @param {dw.io.File} folder - Folder to be removed
 */
function removeFolder(folder) {
    var filesToDelete = folder.listFiles();
    var i;

    for (i = 0; i < filesToDelete.length; i++) {
        filesToDelete[i].remove();
    }

    folder.remove();
}

/**
 * Executes a pipeline with the given parameters
 * @param {string} pipeline - Pipeline
 * @param {Object} params - Parameter Map to pass into pipeline
 */
function runPipeline(pipeline, params) {
    var Pipeline = require('dw/system/Pipeline');

    var output = Pipeline.execute(pipeline, params);

    if (output.EndNodeName === 'ERROR') {
        FlowHelper.logger.error('jobHelper.js - {0} - ErrorCode: {1} - ErrorMsg: {2}', pipeline, output.ErrorCode, output.ErrorMsg);
        throw new Error('Error running pipeline ' + pipeline);
    }
}

module.exports = {
    archiveFile: archiveFile,
    createCSVFile: createCSVFile,
    createFolders: createFolders,
    getJobFilePath: getJobFilePath,
    getSFTPService: getSFTPService,
    setSFTPCredentials: setSFTPCredentials,
    removeFolder: removeFolder,
    runPipeline: runPipeline,
    paths: paths
};
