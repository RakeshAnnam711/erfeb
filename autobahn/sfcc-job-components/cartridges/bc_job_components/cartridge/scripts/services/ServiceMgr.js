'use strict';

var KeyRef = require('dw/crypto/KeyRef');
var FTPClient = require('dw/net/FTPClient');
var SFTPClient = require('dw/net/SFTPClient');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var FtpClientHelper = require('~/cartridge/scripts/services/FtpClientHelper');

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
                hostPort[1] = new Number(hostPort[1]);
            }

            var urls = hostPort.concat([credentials.user, credentials.password]);

            if (!sftp.getConnected() && !sftp.connect.apply(sftp, urls)) {
                throw new Error(sftp.errorMessage);
            }

            return sftp;
        },
        createRequest: function (service) {
            var args = Array.prototype.slice.call(arguments, 1);
            service.setOperation.apply(service, args);
            service.setAutoDisconnect(false);
            return service;
        },
        parseResponse: function (service, result) {
            return result;
        }
    });

    return new FtpClientHelper(ftpService);
};

/*
 * Returns a newly initialized service related to the given {serviceID}
 * If the service does not exists, this method will throw an error
 * This method should only be used to initialize (S)FTP services as the create request is based
 * on the assumption that the service is an instance of the dw.src.FTPService class
 *
 * @param {String} serviceID The service to initialize
 * @param {KeyRef} key The private key alias used for SSH connection.
 * @throw {Error} If the service does not exists in the Business Manager
 *
 * @returns {Object}
 */
module.exports.getFTPServiceForSSH = function (serviceID, keyAlias) {
  var ftpService = LocalServiceRegistry.createService(serviceID, {
    createRequest: function (service) {
      var args = Array.prototype.slice.call(arguments, 1);
      service.setOperation.apply(service, args);
      if (keyAlias != null) {
        service.client.setIdentity(KeyRef(keyAlias));
      }
      return service;
    },
    parseResponse: function (service, result) {
      return result;
    }
  });

  return new FtpClientHelper(ftpService);
};
