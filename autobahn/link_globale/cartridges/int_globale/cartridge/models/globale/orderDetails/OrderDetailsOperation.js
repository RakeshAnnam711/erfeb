'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents OrderDetailsOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function OrderDetailsOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
OrderDetailsOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Retrieves OrderDetails
 * @throws {Error}
 */
OrderDetailsOperation.prototype.run = function () {
    // send request
    var service = require('*/cartridge/scripts/factories/globale/geServiceMgr').getOrderDetailsService();
    var serviceResponse = service.call(JSON.stringify(this.operationData.data));

    // check service response
    if (!serviceResponse.isOk()) {
        // return null;
    }

    var responseObject = JSON.parse(serviceResponse.object.text);
    this.operationResult.success = true;
    this.operationResult.orderDetails = responseObject;

    this.operationResult.success = true;
};

module.exports = OrderDetailsOperation;
