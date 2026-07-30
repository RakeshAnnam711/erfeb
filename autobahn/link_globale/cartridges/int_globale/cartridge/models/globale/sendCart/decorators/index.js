'use strict';

module.exports = {
    webStoreCodes: require('*/cartridge/models/globale/sendCart/decorators/webStoreCodes'),
    getPriceModification: require('*/cartridge/models/globale/sendCart/decorators/getPriceModification'),
    getCultureData: require('*/cartridge/models/globale/sendCart/decorators/getCultureData'),
    getLocalShippingOptions: require('*/cartridge/models/globale/sendCart/decorators/getLocalShippingOptions'),
    getProducts: require('*/cartridge/models/globale/sendCart/decorators/getProducts'),
    getUserDetails: require('*/cartridge/models/globale/sendCart/decorators/getUserDetails'),
    getVATRegistrationData: require('*/cartridge/models/globale/sendCart/decorators/getVATRegistrationData'),
    getUrlParameters: require('*/cartridge/models/globale/sendCart/decorators/getUrlParameters'),
    getDiscounts: require('*/cartridge/models/globale/sendCart/decorators/getDiscounts'),
    getFreeShippingData: require('*/cartridge/models/globale/sendCart/decorators/getFreeShippingData'),
    getCurrencyData: require('*/cartridge/models/globale/sendCart/decorators/getCurrencyData'),
    getCurrencyRateData: require('*/cartridge/models/globale/sendCart/decorators/getCurrencyRateData'),
    getCartLoyaltyData: require('*/cartridge/models/globale/sendCart/decorators/getCartLoyaltyData'),
    getLoyaltyPoints: require('*/cartridge/models/globale/sendCart/decorators/getLoyaltyPoints'),
    getSessionId: require('*/cartridge/models/globale/sendCart/decorators/getSessionId'),
    getAuthToken: require('*/cartridge/models/globale/sendCart/decorators/getAuthToken'),
    getHubId: require('*/cartridge/models/globale/sendCart/decorators/getHubId'),
    getAllowMailsFromMerchant: require('*/cartridge/models/globale/sendCart/decorators/allowMailsFromMerchant'),
    getAllowDirectCommunicationFromMerchant: require('*/cartridge/models/globale/sendCart/decorators/allowDirectCommunicationFromMerchant'),
    getCookieConsent: require('*/cartridge/models/globale/sendCart/decorators/getCookieConsent')
};
