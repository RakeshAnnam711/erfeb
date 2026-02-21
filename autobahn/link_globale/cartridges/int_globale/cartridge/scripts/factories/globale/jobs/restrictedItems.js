'use strict';

/**
 * Generates Restricted Items file and stores it in IMPEX/* folder
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - operation status
 */
function generate(args) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var RestrictedItemsFeedGenerateOperationData = require('*/cartridge/models/globale/jobs/catalog/requests/RestrictedItemsFeedGenerateOperationData');
    var RestrictedItemsFeedGenerateOperationResult = require('*/cartridge/models/globale/jobs/catalog/responses/RestrictedItemsFeedGenerateOperationResult');

    var operationData = new RestrictedItemsFeedGenerateOperationData(globaleHelpers.getJSONPreference(globaleHelpers.preferenceKeys.geRestrictedItemsFeedConfig));
    var operationResult = new RestrictedItemsFeedGenerateOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var RestrictedItemsFeedGenerateOperation = require('*/cartridge/models/globale/jobs/catalog/actions/RestrictedItemsFeedGenerateOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/catalog/actions/decorators/index');
        var operationHandler = new RestrictedItemsFeedGenerateOperation(operationData, operationResult);
        operationHandlerDecorators.createFile(operationHandler);
        operationHandlerDecorators.setLocale(operationHandler);
        operationHandlerDecorators.writeRestrictedItemsFeedFile(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('Generate Restricted Items Feed File Error: {0} ', logger.message(e));
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

/**
 * Uploads generated Restricted Items file from IMPEX/* to Global-e SFTP folder
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - operation status
 */
function upload(args) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var RestrictedItemsFeedUploadOperationData = require('*/cartridge/models/globale/jobs/catalog/requests/RestrictedItemsFeedUploadOperationData');
    var RestrictedItemsFeedUploadOperationResult = require('*/cartridge/models/globale/jobs/catalog/responses/RestrictedItemsFeedUploadOperationResult');

    var operationData = new RestrictedItemsFeedUploadOperationData(globaleHelpers.getJSONPreference(globaleHelpers.preferenceKeys.geRestrictedItemsFeedConfig));
    var operationResult = new RestrictedItemsFeedUploadOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var RestrictedItemsFeedUploadOperation = require('*/cartridge/models/globale/jobs/catalog/actions/RestrictedItemsFeedUploadOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/catalog/actions/decorators/index');
        var operationHandler = new RestrictedItemsFeedUploadOperation(operationData, operationResult);
        operationHandlerDecorators.uploadFile(operationHandler);
        operationHandlerDecorators.moveToArchieve(operationHandler);

        // invoke operation handler
        operationHandler.run();

        if (operationHandler.operationResult.success !== true) {
            return new Status(Status.ERROR);
        }
    } catch (e) {
        logger.error('Upload Restricted Items Feed File Error: {0} ', logger.message(e));
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

module.exports = {
    generate: generate,
    upload: upload
};
