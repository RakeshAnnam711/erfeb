/* eslint-disable no-param-reassign */

'use strict';

/**
 * Sets International Details to SFCC Order custom attributes
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setInternationalAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var valuesUtils = require('*/cartridge/scripts/util/globale/values');

    try {
        order.custom[globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice] = objectUtils.getValueByPath(payload, 'InternationalDetails.DiscountedShippingPrice', null);
        order.custom[globaleHelpers.customAttr.order.geDeliveryDaysFrom] = objectUtils.getValueByPath(payload, 'InternationalDetails.DeliveryDaysFrom', null);
        order.custom[globaleHelpers.customAttr.order.geConsignmentFee] = objectUtils.getValueByPath(payload, 'InternationalDetails.ConsignmentFee', null);
        order.custom[globaleHelpers.customAttr.order.geSizeOverchargeValue] = objectUtils.getValueByPath(payload, 'InternationalDetails.SizeOverchargeValue', null);
        order.custom[globaleHelpers.customAttr.order.geRemoteAreaSurcharge] = objectUtils.getValueByPath(payload, 'InternationalDetails.RemoteAreaSurcharge', null);
        order.custom[globaleHelpers.customAttr.order.geTotalPrice] = objectUtils.getValueByPath(payload, 'InternationalDetails.TotalPrice', null);
        order.custom[globaleHelpers.customAttr.order.geTransactionTotalPrice] = objectUtils.getValueByPath(payload, 'InternationalDetails.TransactionTotalPrice', null);
        order.custom[globaleHelpers.customAttr.order.geSameDayDispatch] = objectUtils.getValueByPath(payload, 'InternationalDetails.SameDayDispatch', null);
        order.custom[globaleHelpers.customAttr.order.geSameDayDispatchCost] = objectUtils.getValueByPath(payload, 'InternationalDetails.SameDayDispatchCost', null);
        order.custom[globaleHelpers.customAttr.order.geDoNotChargeVat] = objectUtils.getValueByPath(payload, 'InternationalDetails.DoNotChargeVAT', null);
        order.custom[globaleHelpers.customAttr.order.geTotalDutiesPrice] = objectUtils.getValueByPath(payload, 'InternationalDetails.TotalDutiesPrice', null);
        order.custom[globaleHelpers.customAttr.order.geCcfPrice] = objectUtils.getValueByPath(payload, 'InternationalDetails.CCFPrice', null);
        order.custom[globaleHelpers.customAttr.order.geTotalCcfPrice] = objectUtils.getValueByPath(payload, 'InternationalDetails.TotalCCFPrice', null);
        order.custom[globaleHelpers.customAttr.order.geDutiesGuaranteed] = objectUtils.getValueByPath(payload, 'InternationalDetails.DutiesGuaranteed', null);
        order.custom[globaleHelpers.customAttr.order.geTotalShippingPrice] = objectUtils.getValueByPath(payload, 'InternationalDetails.TotalShippingPrice', null);
        order.custom[globaleHelpers.customAttr.order.gePrePayOffered] = objectUtils.getValueByPath(payload, 'InternationalDetails.PrePayOffered', null);
        order.custom[globaleHelpers.customAttr.order.geCashOnDeliveryFee] = objectUtils.getValueByPath(payload, 'InternationalDetails.CashOnDeliveryFee', null);
        order.custom[globaleHelpers.customAttr.order.geTotalVatAmount] = objectUtils.getValueByPath(payload, 'InternationalDetails.TotalVATAmount', null);
        order.custom[globaleHelpers.customAttr.order.geShippingVATRate] = objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingVATRate', null);
        order.custom[globaleHelpers.customAttr.order.geCustomerUSSalesTax] = objectUtils.getValueByPath(payload, 'InternationalDetails.USSalesTax', null);

        order.custom[globaleHelpers.customAttr.order.geOrderTrackingNumber] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.OrderTrackingNumber', '')));
        order.custom[globaleHelpers.customAttr.order.geOrderTrackingUrl] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.OrderTrackingUrl', '')));
        order.custom[globaleHelpers.customAttr.order.geShippingMethodCode] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingMethodCode', '')));
        order.custom[globaleHelpers.customAttr.order.geShippingMethodName] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingMethodName', '')));
        order.custom[globaleHelpers.customAttr.order.geShippingMethodTypeCode] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingMethodTypeCode', '')));
        order.custom[globaleHelpers.customAttr.order.geShippingMethodTypeName] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingMethodTypeName', '')));
        order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.CurrencyCode', '')));
        order.custom[globaleHelpers.customAttr.order.geTransactionCurrencyCode] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.TransactionCurrencyCode', '')));
        order.custom[globaleHelpers.customAttr.order.geOrderWaybillNumber] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.OrderWaybillNumber', '')));
        order.custom[globaleHelpers.customAttr.order.gePaymentMethodCode] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.PaymentMethodCode', '')));
        order.custom[globaleHelpers.customAttr.order.gePaymentMethodName] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.PaymentMethodName', '')));

        var geShippingMethodStatusCode = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingMethodStatusCode', '')));
        order.custom[globaleHelpers.customAttr.order.geShippingMethodStatusCode] = geShippingMethodStatusCode.toLowerCase() === 'undefined' ? null : geShippingMethodStatusCode;

        var geShippingMethodStatusName = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.ShippingMethodStatusName', '')));
        order.custom[globaleHelpers.customAttr.order.geShippingMethodStatusName] = geShippingMethodStatusName.toLowerCase() === 'undefined' ? null : geShippingMethodStatusName;

        var geDeliveryDaysTo = objectUtils.getValueByPath(payload, 'InternationalDetails.DeliveryDaysTo', null);
        order.custom[globaleHelpers.customAttr.order.geDeliveryDaysTo] = geDeliveryDaysTo;
        if (geDeliveryDaysTo !== null) {
            var now = new Date();
            var deliveryDate = new Date(now.getTime() + (1000 * 60 * 60 * 24 * geDeliveryDaysTo));
            order.custom[globaleHelpers.customAttr.order.geOrderDeliveryDate] = deliveryDate.toISOString();
        }

        this.addNote('InternationalDetails have been set/updated');
    } catch (e) {
        return new Status(Status.ERROR, '209', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setInternationalAttributes', {
        value: setInternationalAttributes
    });
};
