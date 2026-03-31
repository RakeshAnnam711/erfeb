'use strict';

/**
 * Represents SendCartData
 * @constructor
 * @param {dw.order.Basket} basket - SFCC basket
 */
function SendCartData(basket) {
    var Resource = require('dw/web/Resource');

    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleBasketHelpers = require('*/cartridge/scripts/helpers/globaleBasketHelpers');

    this.basket = basket;

    this.getData = function () {
        var basketSnapShot = globaleBasketHelpers.getStorefrontBasketSnapshot(this.basket);
        var products = this.getProducts();
        var discounts = this.getDiscounts();

        return {
            version: Resource.msg('version', 'globale', null),
            SessionId: this.getSessionId(),
            AuthToken: this.getAuthToken(),
            CountryCode: globaleSession.get('geCountry'),
            clientIP: globaleRequest.get('httpRemoteAddress'),
            Currency: this.getCurrencyData(this.basket),
            PriceModification: this.getPriceModification(),
            Culture: this.getCultureData(),
            LocalShippingOptions: this.getLocalShippingOptions(this.basket),
            Products: products,
            CartToken: this.basket.custom[globaleHelpers.customAttr.basket.geCartToken],
            MerchantCartToken: this.basket.UUID,
            MerchantCartHash: basketSnapShot.getHash(),
            MerchantCartSnapShot: basketSnapShot.getData(),
            HubId: this.getHubId(),
            PaymentInstallments: null,
            UserDetails: this.getUserDetails(),
            UrlParameters: this.getUrlParameters(this.basket),
            Discounts: discounts,
            VATRegistration: this.getVATRegistrationData(),
            FreeShipping: this.getFreeShippingData(),
            VoucherData: null,
            LoyaltyData: this.getCartLoyaltyData(discounts),
            rateData: this.getCurrencyRateData(),
            WebStoreCode: this.getWebStoreCode(),
            WebStoreInstanceCode: this.getWebStoreInstanceCode(),
            LoyaltyPoints: this.getLoyaltyPoints(),
            AllowMailsFromMerchant: this.getAllowMailsFromMerchant(),
            AllowDirectCommunicationFromMerchant: this.getAllowDirectCommunicationFromMerchant(),
            CartId: null,
            CookieConsent: this.getCookieConsent(),
            MerchantOrderId: this.basket.custom[globaleHelpers.customAttr.basket.geMerchantOrderId]
        };
    };
}

SendCartData.prototype = Object.create({
    basket: null,
    isTaxationBasedOnAdjustedPrice: false
});

module.exports = SendCartData;
