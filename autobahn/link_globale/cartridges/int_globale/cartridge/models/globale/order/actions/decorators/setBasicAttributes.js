/* eslint-disable no-param-reassign */

'use strict';

/**
 * Stores Global-e Basic Attributes into SFCC Order
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setBasicAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        order.setCustomerOrderReference(payload.OrderId);
        order.custom[globaleHelpers.customAttr.order.geOrderNumber] = payload.OrderId;
        order.custom[globaleHelpers.customAttr.order.geBarCode] = payload.OrderId;
        order.custom[globaleHelpers.customAttr.order.geCurrencyCode] = payload.CurrencyCode;
        order.custom[globaleHelpers.customAttr.order.geShippingMethodCode] = objectUtils.getValueByPath(payload, 'ShippingMethodCode', null);
        order.custom[globaleHelpers.customAttr.order.gePriceCoefficientRate] = objectUtils.getValueByPath(payload, 'PriceCoefficientRate', null);
        order.custom[globaleHelpers.customAttr.order.geAllowEmailsFromMerchant] = objectUtils.getValueByPath(payload, 'AllowMailsFromMerchant', null);
        order.custom[globaleHelpers.customAttr.order.geAllowDirectCommunicationFromMerchant] = objectUtils.getValueByPath(payload, 'AllowDirectCommunicationFromMerchant', null);
        order.custom[globaleHelpers.customAttr.order.geCartId] = objectUtils.getValueByPath(payload, 'CartId', null);
        order.custom[globaleHelpers.customAttr.order.geRoundingRate] = objectUtils.getValueByPath(payload, 'RoundingRate', null);
        order.custom[globaleHelpers.customAttr.order.geDiscountedShippingPriceMerchantCurrency] = objectUtils.getValueByPath(payload, 'DiscountedShippingPrice', null);
        order.custom[globaleHelpers.customAttr.order.geTotalDutiesAndTaxesPrice] = objectUtils.getValueByPath(payload, 'TotalDutiesAndTaxesPrice', null);
        order.custom[globaleHelpers.customAttr.order.geSuppressPersonalInformation] = objectUtils.getValueByPath(payload, 'IsSupressPersonalInformation', null);
        order.custom[globaleHelpers.customAttr.order.geStatusCode] = objectUtils.getValueByPath(payload, 'StatusCode', null);
        order.custom[globaleHelpers.customAttr.order.geIsSplitOrder] = objectUtils.getValueByPath(payload, 'IsSplitOrder', null);
        order.custom[globaleHelpers.customAttr.order.geOtVoucherCode] = objectUtils.getValueByPath(payload, 'OTVoucherCode', null);
        order.custom[globaleHelpers.customAttr.order.geOtCurrencyCode] = objectUtils.getValueByPath(payload, 'OTCurrencyCode', null);
        order.custom[globaleHelpers.customAttr.order.geOtVoucherAmount] = objectUtils.getValueByPath(payload, 'OTVoucherAmount', null);
        order.custom[globaleHelpers.customAttr.order.geIsFreeShipping] = objectUtils.getValueByPath(payload, 'IsFreeShipping', null);
        order.custom[globaleHelpers.customAttr.order.geFreeShippingCouponCode] = objectUtils.getValueByPath(payload, 'FreeShippingCouponCode', null);
        order.custom[globaleHelpers.customAttr.order.geOrderDocuments] = JSON.stringify(objectUtils.getValueByPath(payload, 'OrderDocuments', {}));
        order.custom[globaleHelpers.customAttr.order.geUSSalesTax] = objectUtils.getValueByPath(payload, 'USSalesTax', null);
        order.custom[globaleHelpers.customAttr.order.geCashOnDeliveryFeeMc] = objectUtils.getValueByPath(payload, 'CashOnDeliveryFee', null);
        order.custom[globaleHelpers.customAttr.order.geMerchantShippingVATRate] = objectUtils.getValueByPath(payload, 'ShippingVATRate', null);
        order.custom[globaleHelpers.customAttr.order.geTotalDutiesPaidByCustomerPrice] = objectUtils.getValueByPath(payload, 'TotalDutiesPaidByCustomerPrice', null);
        order.custom[globaleHelpers.customAttr.order.geNonProductTotalSubsidy] = objectUtils.getValueByPath(payload, 'MerchantDTBreakdown.Subsidy', null);
        order.custom[globaleHelpers.customAttr.order.geInternationalNonProductTotalSubsidy] = objectUtils.getValueByPath(payload, 'InternationalDetails.MerchantDTBreakdown.Subsidy', null);
        order.custom[globaleHelpers.customAttr.order.geOrderCreationSource] = Number(objectUtils.getValueByPath(payload, 'OrderCreationSource', 0));
        order.custom[globaleHelpers.customAttr.order.geOrderCreationSourceInfo] = objectUtils.getValueByPath(payload, 'OrderCreationSourceInfo', null);
        order.custom[globaleHelpers.customAttr.order.geIsTaxExemption] = objectUtils.getValueByPath(payload, 'IsTaxExemption', null);
        order.custom[globaleHelpers.customAttr.order.geCookieConsent] = objectUtils.getValueByPath(payload, 'CookieConsent', 0);
        order.custom[globaleHelpers.customAttr.order.geIsGiftWrappingRequired] = objectUtils.getValueByPath(payload, 'IsGiftWrappingRequired', null);

        this.addNote('Global-e Basic attributes have been stored into SFCC Order');
    } catch (e) {
        return new Status(Status.ERROR, '204', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setBasicAttributes', {
        value: setBasicAttributes
    });
};
