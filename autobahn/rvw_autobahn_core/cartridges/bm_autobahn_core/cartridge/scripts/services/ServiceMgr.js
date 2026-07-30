'use strict';

module.exports = module.superModule;

/*
 * Utilize String Replacer for site preference updates
 */

var FTPClient = require('dw/net/FTPClient');
var SFTPClient = require('dw/net/SFTPClient');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var FtpClientHelper = require('*/cartridge/scripts/services/FtpClientHelper');
var SitePrefReplace = require('*/cartridge/scripts/util/sitePrefStringReplacer');

/**
 * Returns a newly initialized service related to the given {serviceID}
 * If the service does not exists, this method will throw an error
 * This method should only be used to initialize (S)FTP services as the create request is based
 * on the assumption that the service is an instance of the dw.src.FTPService class
 *
 * @param {String} serviceID The service to initialize
 *
 * @throw {Error} If the service does not exists in the Business Manager
 *
 * @returns {Object}
 */
 module.exports.getFTPService = function (serviceID) {
    var ftpService = LocalServiceRegistry.createService(serviceID, {
        initServiceClient: function (service) {
            var configuration = service.getConfiguration();
            var profile = configuration.getProfile();
            var credentials = configuration.getCredential();

            var sftp = configuration.serviceType === 'SFTP' ? new SFTPClient() : new FTPClient();
            sftp.setTimeout(profile.getTimeoutMillis());

            //Produce array [URL, [Optional Port,] User, Pass]
            var hostPort = credentials.getURL().replace(/^.*\/\//gi, '').split(':');
            if (hostPort.length !== 1) {
                // ensure port # is interpreted as string
                if (!Number.isInteger(parseInt(hostPort[1]))) {
                    throw new Error('host port is wrong and cannot be parsed, was given: ' + hostPort[1]);
                } else {
                    hostPort[1] = (parseInt(hostPort[1])) + '';
                }
            }

            var urls = hostPort.concat([credentials.user, credentials.password]);

            urls = SitePrefReplace(urls);

            if (!sftp.getConnected() && !sftp.connect.apply(sftp, urls)) {
                throw new Error(sftp.errorMessage);
            }

            return sftp;
        },
        createRequest: function (service) {
            var args = Array.prototype.slice.call(arguments, 1);
            service.setOperation.apply(service, args);
            return service;
        },
        parseResponse: function (service, result) {
            return result;
        }
    });

    ftpService.setAutoDisconnect(false);
    return new FtpClientHelper(ftpService);
};
