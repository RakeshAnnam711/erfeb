/* eslint-disable no-param-reassign */

'use strict';

/**
 * Set custom attributes data
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setCustomAttributesData(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var customAttributeHelpers = require('*/cartridge/scripts/helpers/customAttributeHelpers');

    var customAttributesData = globaleHelpers.getUrlParametersValue(payload.UrlParameters, globaleHelpers.consts.urlParameters.customAttributesData);
    if (customAttributesData) {
        customAttributeHelpers.setCustomAttributesData(order, customAttributesData);
    }
    this.addNote('Customer attributes of SFCC order/product line items/price adjusments have been updated from payload.UrlParameters');

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setCustomAttributesData', {
        value: setCustomAttributesData
    });
};
