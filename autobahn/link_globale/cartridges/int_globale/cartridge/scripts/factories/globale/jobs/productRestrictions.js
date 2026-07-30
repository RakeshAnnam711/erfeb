'use strict';

/**
 * Fetches Global-e ProductRestrictions
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchProductRestrictions(args) {
    var Status = require('dw/system/Status');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var FetchProductRestrictionsOperationData = require('*/cartridge/models/globale/jobs/productRestrictions/operations/data/FetchProductRestrictionsOperationData');
    var FetchProductRestrictionsOperationResult = require('*/cartridge/models/globale/jobs/productRestrictions/operations/result/FetchProductRestrictionsOperationResult');

    var operationData = new FetchProductRestrictionsOperationData();
    var operationResult = new FetchProductRestrictionsOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var FetchProductRestrictionsOperation = require('*/cartridge/models/globale/jobs/productRestrictions/operations/FetchProductRestrictionsOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/productRestrictions/operations/decorators/index');

        var operationHandler = new FetchProductRestrictionsOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchProductRestrictions: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * Imports Global-e ProductRestriction Feeds
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - SFCC Status
 */
function importProductRestrictionFeed(args) {
    var Status = require('dw/system/Status');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var ImportProductRestrictionFeedOperationData = require('*/cartridge/models/globale/jobs/productRestrictions/operations/data/ImportProductRestrictionFeedOperationData');
    var ImportProductRestrictionFeedOperationResult = require('*/cartridge/models/globale/jobs/productRestrictions/operations/result/ImportProductRestrictionFeedOperationResult');

    var operationData = new ImportProductRestrictionFeedOperationData();
    var operationResult = new ImportProductRestrictionFeedOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var ImportProductRestrictionFeedOperation = require('*/cartridge/models/globale/jobs/productRestrictions/operations/ImportProductRestrictionFeedOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/productRestrictions/operations/decorators/index');

        var operationHandler = new ImportProductRestrictionFeedOperation(operationData, operationResult);
        operationHandlerDecorators.updateProductRestrictions(operationHandler);
        operationHandlerDecorators.updateProductVatRates(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_importProductRestrictionFeed: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * Archives Global-e ProductRestriction Feeds
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - SFCC Status
 */
function archiveProductRestrictionFeed(args) {
    var Status = require('dw/system/Status');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var ArchiveProductRestrictionFeedOperationData = require('*/cartridge/models/globale/jobs/productRestrictions/operations/data/ArchiveProductRestrictionFeedOperationData');
    var ArchiveProductRestrictionFeedOperationResult = require('*/cartridge/models/globale/jobs/productRestrictions/operations/result/ArchiveProductRestrictionFeedOperationResult');

    var operationData = new ArchiveProductRestrictionFeedOperationData();
    var operationResult = new ArchiveProductRestrictionFeedOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var ArchiveProductRestrictionFeedOperation = require('*/cartridge/models/globale/jobs/productRestrictions/operations/ArchiveProductRestrictionFeedOperation');
        var operationHandler = new ArchiveProductRestrictionFeedOperation(operationData, operationResult);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_archiveProductRestrictionFeed: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

module.exports = {
    fetchProductRestrictions: fetchProductRestrictions,
    importProductRestrictionFeed: importProductRestrictionFeed,
    archiveProductRestrictionFeed: archiveProductRestrictionFeed
};
