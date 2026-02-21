'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents ConvertPriceOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function ConvertPriceOperationData(data) {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var httpParameterMap = globaleRequest.get('httpParameterMap');

    AbstractOperationData.call(this, data);
    this.productId = httpParameterMap.isParameterSubmitted('productId') && !httpParameterMap.productId.isEmpty()
        ? httpParameterMap.productId.stringValue
        : null;
    this.originalPrice = httpParameterMap.isParameterSubmitted('originalPrice') && !httpParameterMap.originalPrice.isEmpty() && !isNaN(httpParameterMap.originalPrice.doubleValue) // eslint-disable-line no-restricted-globals
        ? httpParameterMap.originalPrice.doubleValue
        : null;
    this.isDiscount = httpParameterMap.isParameterSubmitted('isDiscount') && !httpParameterMap.isDiscount.isEmpty() && httpParameterMap.isDiscount.booleanValue;
}

/* Inherits AbstractOperationData */
ConvertPriceOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = ConvertPriceOperationData;
