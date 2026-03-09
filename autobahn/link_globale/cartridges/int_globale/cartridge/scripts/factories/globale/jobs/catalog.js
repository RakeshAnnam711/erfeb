'use strict';

/**
 * Generates Catalog file and stores it in IMPEX/* folder
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - Operation status
 */
function generate(args) {
    var Status = require('dw/system/Status');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var CatalogFeedGenerateOperationData = require('*/cartridge/models/globale/jobs/catalog/requests/CatalogFeedGenerateOperationData');
    var CatalogFeedGenerateOperationResult = require('*/cartridge/models/globale/jobs/catalog/responses/CatalogFeedGenerateOperationResult');

    var catalogFeedConfig = geConfigurationMgr.getCatalogFeedConfig();
    var catalogFeedConfigOutputData = catalogFeedConfig.getConfigOutputData();

    var operationData = new CatalogFeedGenerateOperationData(catalogFeedConfigOutputData);
    var operationResult = new CatalogFeedGenerateOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CatalogFeedGenerateOperation = require('*/cartridge/models/globale/jobs/catalog/actions/CatalogFeedGenerateOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/catalog/actions/decorators/index');
        var operationHandler = new CatalogFeedGenerateOperation(operationData, operationResult);
        operationHandlerDecorators.validateCatalogFeedConfig(operationHandler);
        operationHandlerDecorators.setLocale(operationHandler);
        operationHandlerDecorators.getProductsIterator(operationHandler);
        operationHandlerDecorators.writeCatalogFeedFile(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('Generate Catalog Feed File Error: {0} ', logger.message(e));
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

/**
 * Uploads generated Catalog file from IMPEX/* to Global-e SFTP folder
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - operation status
 */
function upload(args) {
    var Status = require('dw/system/Status');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var CatalogFeedUploadOperationData = require('*/cartridge/models/globale/jobs/catalog/requests/CatalogFeedUploadOperationData');
    var CatalogFeedUploadOperationResult = require('*/cartridge/models/globale/jobs/catalog/responses/CatalogFeedUploadOperationResult');

    var catalogFeedConfig = geConfigurationMgr.getCatalogFeedConfig();
    var catalogFeedConfigOutputData = catalogFeedConfig.getConfigOutputData();

    var operationData = new CatalogFeedUploadOperationData(catalogFeedConfigOutputData);
    var operationResult = new CatalogFeedUploadOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CatalogFeedUploadOperation = require('*/cartridge/models/globale/jobs/catalog/actions/CatalogFeedUploadOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/catalog/actions/decorators/index');
        var operationHandler = new CatalogFeedUploadOperation(operationData, operationResult);
        operationHandlerDecorators.validateCatalogFeedConfig(operationHandler);

        // invoke operation handler
        operationHandler.run();

        if (operationHandler.operationResult.success !== true) {
            return new Status(Status.ERROR);
        }
    } catch (e) {
        logger.error('Upload Catalog Feed File Error: {0} ', logger.message(e));
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

module.exports = {
    generate: generate,
    upload: upload
};
