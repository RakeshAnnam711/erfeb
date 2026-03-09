'use strict';

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');
    var requestHelpers = require('*/cartridge/scripts/helpers/requestHelpers');
    var logger = globaleHelpers.getLogger();
    var OrderSendToMerchantRequest = require('*/cartridge/models/globale/order/requests/OrderSendToMerchantRequest');
    var OrderSendToMerchantResponse = require('*/cartridge/models/globale/order/responses/OrderSendToMerchantResponse');
    var OrderSendToMerchantAction = require('*/cartridge/models/globale/order/actions/OrderSendToMerchantAction');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    // init default response
    var responseObj = new OrderSendToMerchantResponse();

    try {
        // get payload
        var jsonPayload = requestHelpers.getPayloadData();
        // redefine request/response/action depending on flow (mixed|single)
        if (requestHelpers.isSubOrdersInPayload(jsonPayload)) { // mixed orders
            OrderSendToMerchantRequest = require('*/cartridge/models/globale/order/requests/OrderSendToMerchantMixedOrdersRequest');
            OrderSendToMerchantResponse = require('*/cartridge/models/globale/order/responses/OrderSendToMerchantMixedOrdersResponse');
            OrderSendToMerchantAction = require('*/cartridge/models/globale/order/actions/OrderSendToMerchantMixedOrdersAction');
        }
        // init response
        responseObj = new OrderSendToMerchantResponse();

        // init request
        var requestObj = new OrderSendToMerchantRequest();

        // perform JWT auth
        requestObj.jwtAuth();

        // Replace Sku with productID from the Metadata object if UseProductCodeSecondaryInFulfillment enabled on Global-e side
        if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccUseProductCodeSecondaryInFulfillmentEnabled, false, 'boolean')) {
            requestHelpers.replaceSku(objectUtils.getValueByPath(requestObj.payload, 'Products', []));
        }

        var requestObjValidate = {
            CurrencyCode: { required: true },
            MerchantGUID: { required: true, equals: { value: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid), caseSensitive: false } },
            MerchantOrderId: { required: true },
            OrderId: { required: true },
            UserId: { required: true },
            CartId: { required: true },
            PrimaryBilling: { required: true },
            SecondaryBilling: { required: true },
            'PrimaryBilling.FirstName': { required: true },
            'PrimaryBilling.LastName': { required: true },
            'PrimaryBilling.CountryCode': { required: true },
            InternationalDetails: { required: true },
            'InternationalDetails.ShippingMethodCode': { required: true },
            'InternationalDetails.CurrencyCode': { required: true },
            DiscountedShippingPrice: { required: true },
            ShippingVATRate: { required: true },
            PrimaryShipping: { required: true },
            'PrimaryShipping.Email': { required: true },
            SecondaryShipping: { required: true },
            'SecondaryShipping.CountryCode': { required: true },
            'Customer.IsEndCustomerPrimary': { required: true },
            'Customer.EmailAddress': { required: true },
            Products: { required: true }, // @TODO implement empty/not empty validator and type validator, notNull
            Discounts: { required: true },
            UrlParameters: { required: true }
        };

        // validate payload
        requestObj.validate(requestObjValidate, requestObj.payload);
        if (!requestObj.validation.valid) {
            throw new Error('Invalid payload: ' + JSON.stringify(requestObj.validation));
        }

        // cart hash validation
        if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccCartHashValidation, false, 'boolean')) {
            let products = objectUtils.getValueByPath(requestObj.payload, 'Products', []);
            if (requestHelpers.isSubOrdersInPayload(requestObj.payload)) {
                requestObj.payload.Subs.forEach(function (subOrderPayload) {
                    let subOrderProducts = objectUtils.getValueByPath(subOrderPayload, 'Products', []);
                    products = products.concat(subOrderProducts);
                });
            }

            var basketSnapShot = globaleBasketHelpers.getSotmBasketSnapshot({ id: null, products: products, total: null }, { products: ['pid', 'qty'] });
            var requestValidationHash = globaleHelpers.getUrlParametersValue(requestObj.payload.UrlParameters, globaleHelpers.consts.urlParameters.sfccCartHash);

            if (basketSnapShot.getHash() !== requestValidationHash) {
                throw new Error('Basket Validation Hash does not match. Basket hash: ' + basketSnapShot.getHash() + '; SnapShot: ' + basketSnapShot.getData() + '.');
            }
        }

        // create action handler
        var actionHandlerDecorators = require('*/cartridge/models/globale/order/actions/decorators/index');
        var actionHandler = new OrderSendToMerchantAction(requestObj, responseObj);
        actionHandlerDecorators.generateBasketFromPayload(actionHandler);
        actionHandlerDecorators.createOrder(actionHandler);
        actionHandlerDecorators.findOrder(actionHandler);
        actionHandlerDecorators.placeOrder(actionHandler);
        actionHandlerDecorators.confirmOrder(actionHandler);
        actionHandlerDecorators.addressAttributes(actionHandler);
        actionHandlerDecorators.orderAddresses(actionHandler);
        actionHandlerDecorators.setCustomerName(actionHandler);
        actionHandlerDecorators.setCustomerId(actionHandler);
        actionHandlerDecorators.setCustomerEmail(actionHandler);
        actionHandlerDecorators.setDeliveryStore(actionHandler);
        actionHandlerDecorators.setBasicAttributes(actionHandler);
        actionHandlerDecorators.setReplacementOrderAttributes(actionHandler);
        actionHandlerDecorators.setInternationalAttributes(actionHandler);
        actionHandlerDecorators.setLoyalty(actionHandler);
        actionHandlerDecorators.updateShippingMethod(actionHandler);
        actionHandlerDecorators.updateCustomerAddresses(actionHandler);
        actionHandlerDecorators.setCustomerComments(actionHandler);
        actionHandlerDecorators.setCustomAttributesData(actionHandler);
        actionHandlerDecorators.updateProductLineItems(actionHandler);
        actionHandlerDecorators.updatePriceAdjustments(actionHandler);
        actionHandlerDecorators.orderNotes(actionHandler);
        actionHandlerDecorators.processDecoratorStatus(actionHandler);
        actionHandlerDecorators.setMixedOrdersAttributes(actionHandler);
        actionHandlerDecorators.setOrderType(actionHandler);

        // invoke action handler
        actionHandler.run();
    } catch (e) {
        logger.error('GLOBALE_ORDER_SOTM_UPDATE: {0}', logger.message(e));
        responseObj.success = false;
        responseObj.errorCode = responseObj.errorCode || 100;
        responseObj.errorMessage = responseObj.errorMessage || (e.message + '; ' + e.stack);
    }

    return responseObj;
};
