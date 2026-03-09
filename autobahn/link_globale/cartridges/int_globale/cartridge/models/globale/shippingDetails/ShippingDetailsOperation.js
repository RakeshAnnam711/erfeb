'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents ShippingDetailsOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function ShippingDetailsOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
ShippingDetailsOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Retrieves ShippingDetails
 * @throws {Error}
 */
ShippingDetailsOperation.prototype.run = function () {
    var ShippingDetailsData = require('*/cartridge/models/globale/shippingDetails/ShippingDetailsData');

    // send request
    var service = require('*/cartridge/scripts/factories/globale/geServiceMgr').getShippingDetailsService();
    var serviceResponse = service.call(JSON.stringify(this.operationData.data));

    // check service response
    if (!serviceResponse.isOk()) {
        // return null;
    }

    var responseObject = JSON.parse(serviceResponse.object.text);
    this.operationResult.success = true;
    this.operationResult.shippingDetails = new ShippingDetailsData(responseObject);

    this.operationResult.success = true;
};

module.exports = ShippingDetailsOperation;
