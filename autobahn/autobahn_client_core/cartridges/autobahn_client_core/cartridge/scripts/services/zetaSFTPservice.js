'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var SFTPClient = require('dw/net/SFTPClient');

function uploadToZetaSFTP(exportFile, isFirstRun, fileUploadPath) {
    var sftp = new SFTPClient();
    var port = 22;

    // Retrieve credentials
    var svc = LocalServiceRegistry.createService('zeta.sftp.service', {});
    var credential = svc.getConfiguration().getCredential();
    var credentials = {
        host: credential.getURL(),
        user: credential.getUser(),
        password: credential.getPassword()
    };
    var connected = sftp.connect((credentials.host).toString(), port, (credentials.user).toString(), (credentials.password).toString());
    Logger.info("SFTP Connection Attempt: " + (connected ? "Successful" : "Failed"));

    if (!connected) {
        throw new Error('SFTP Connection Failed: ' + sftp.getErrorMessage());
    }
    try {
        var folderPath = fileUploadPath;
        // Check if the directory exists before creating it
        var dirExists = sftp.list(folderPath);
        if (dirExists) {
            Logger.info("Directory already exists: " + folderPath);
            sftp.cd(folderPath); // Navigate to the existing directory
            Logger.info("Changed to directory: " + folderPath);
        } else {
            var dirCreated = sftp.mkdir(folderPath);
            Logger.info("Directory creation (" + folderPath + "): " + dirCreated);
            if (dirCreated) {
                sftp.cd(folderPath); // Navigate to the newly created directory
                Logger.info("Changed to newly created directory: " + folderPath);
            } else {
                throw new Error("Failed to create directory: " + folderPath);
            }
        }
        var remotePath = exportFile.getName(); // File name only since we are already in the directory
        Logger.info("Uploading file to: " + folderPath + "/" + remotePath);
        var success = sftp.putBinary(remotePath, exportFile);
        Logger.info("SFTP Upload Attempt for " + remotePath + ": " + (success ? "Successful" : "Failed"));
        if (!success) {
            throw new Error('SFTP Upload Failed: ' + sftp.getErrorMessage());
        }
    } finally {
        sftp.disconnect();
    }
}

exports.uploadToZetaSFTP = uploadToZetaSFTP;