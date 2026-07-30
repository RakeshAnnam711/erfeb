'use strict';

module.exports = function () {
    var ConvertPriceOperationData = require('*/cartridge/models/globale/priceConversion/requests/ConvertPriceOperationData');
    var ConvertPriceOperationResult = require('*/cartridge/models/globale/priceConversion/responses/ConvertPriceOperationResult');

    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var operationData = new ConvertPriceOperationData();
    var operationResult = new ConvertPriceOperationResult();

    try {
        // validate request data
        if (operationData.productId === null && operationData.originalPrice === null) {
            throw new Error('Invalid request parameters to convert: productId = null; originalPrice = null. At least one of them must not be null!');
        }

        // create action handler
        var ConvertPriceOperation = require('*/cartridge/models/globale/priceConversion/actions/ConvertPriceOperation');
        var actionHandlerDecorators = require('*/cartridge/models/globale/priceConversion/actions/decorators/index');
        var actionHandler = new ConvertPriceOperation(operationData, operationResult);
        actionHandlerDecorators.convertPrice(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_PRICE_CONVERSION: {0}', logger.message(e));

        operationResult.convertedPrice = null;
        operationResult.success = false;
    }

    return operationResult;
};
