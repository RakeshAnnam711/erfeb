'use strict';

/**
 * Sets PaymentDetails to SFCC Order custom attributes
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - set payment attributes status
 */
function setPaymentAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var fieldMapping = {
        OwnerFirstName: globaleHelpers.customAttr.order.gePdOwnerFirstName,
        OwnerLastName: globaleHelpers.customAttr.order.gePdOwnerLastName,
        OwnerName: globaleHelpers.customAttr.order.gePdOwnerName,
        PaymentMethodName: globaleHelpers.customAttr.order.gePdPaymentMethodName,
        PaymentMethodCode: globaleHelpers.customAttr.order.gePdPaymentMethodCode,
        CountryName: globaleHelpers.customAttr.order.gePdCountryName,
        CountryCode: globaleHelpers.customAttr.order.gePdCountryCode,
        StateCode: globaleHelpers.customAttr.order.gePdStateCode,
        StateOrProvince: globaleHelpers.customAttr.order.gePdStateOrProvince,
        City: globaleHelpers.customAttr.order.gePdCity,
        Zip: globaleHelpers.customAttr.order.gePdZip,
        Address1: globaleHelpers.customAttr.order.gePdAddress1,
        Address2: globaleHelpers.customAttr.order.gePdAddress2,
        Phone1: globaleHelpers.customAttr.order.gePdPhone1,
        Phone2: globaleHelpers.customAttr.order.gePdPhone2,
        Fax: globaleHelpers.customAttr.order.gePdFax,
        Email: globaleHelpers.customAttr.order.gePdEmail,
        PaymentMethodTypeCode: globaleHelpers.customAttr.order.gePdPaymentMethodTypeCode,
        CardNumber: globaleHelpers.customAttr.order.gePdCardNumber,
        CVVNumber: globaleHelpers.customAttr.order.gePdCVVNumber,
        ExpirationDate: globaleHelpers.customAttr.order.gePdExpirationDate
    };

    var paymentDetails = payload.PaymentDetails;
    Object.keys(fieldMapping).forEach(function (geField) {
        if ((geField in paymentDetails) && paymentDetails[geField] !== null) {
            var attrName = fieldMapping[geField];
            var attrValue = decodeURIComponent(paymentDetails[geField]);
            if ((geField === 'PaymentMethodName') && (attrValue.toLowerCase() === 'undefined')) {
                attrValue = null;
            }
            order.custom[attrName] = attrValue; // eslint-disable-line no-param-reassign
        }
    });
    this.addNote('PaymentDetails has been stored to SFCC Order custom attributes');
    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setPaymentAttributes', {
        value: setPaymentAttributes
    });
};
