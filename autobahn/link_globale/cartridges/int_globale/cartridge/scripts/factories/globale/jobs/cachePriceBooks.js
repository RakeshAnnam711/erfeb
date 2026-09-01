'use strict';

/**
 * Generates Cache Price Books and stores it in IMPEX/* folder
 * @param {dw.util.Map} args - Job Arguments
 * @returns {dw.system.Status} - operation status
 */
function generate(args) {
    var Status = require('dw/system/Status');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var CachePriceBooksGenerateOperationData = require('*/cartridge/models/globale/jobs/catalog/requests/CachePriceBooksGenerateOperationData');
    var CachePriceBooksGenerateOperationResult = require('*/cartridge/models/globale/jobs/catalog/responses/CachePriceBooksGenerateOperationResult');

    var operationData = new CachePriceBooksGenerateOperationData();
    var operationResult = new CachePriceBooksGenerateOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CachePriceBooksGenerateOperation = require('*/cartridge/models/globale/jobs/catalog/actions/CachePriceBooksGenerateOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/catalog/actions/decorators/index');
        var operationHandler = new CachePriceBooksGenerateOperation(operationData, operationResult);
        operationHandlerDecorators.createFile(operationHandler);
        operationHandlerDecorators.writeCachePriceBooksXmlFile(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('Generate Cache Price Books XML Error: {0} ', logger.message(e));
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

module.exports = {
    generate: generate
};
