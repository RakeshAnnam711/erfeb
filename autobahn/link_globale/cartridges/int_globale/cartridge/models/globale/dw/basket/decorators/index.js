'use strict';

module.exports = {
    geShippingMethod: require('*/cartridge/models/globale/dw/basket/decorators/geShippingMethod'),
    geUpdateCurrency: require('*/cartridge/models/globale/dw/basket/decorators/geUpdateCurrency'),
    geValidateBasket: require('*/cartridge/models/globale/dw/basket/decorators/geValidateBasket'),
    geCollectOriginalDiscountsData: require('*/cartridge/models/globale/dw/basket/decorators/geCollectOriginalDiscountsData'),
    geUpdateDiscounts: require('*/cartridge/models/globale/dw/basket/decorators/geUpdateDiscounts'),
    geUpdateShipments: require('*/cartridge/models/globale/dw/basket/decorators/geUpdateShipments'),
    geSetZeroShippingPrice: require('*/cartridge/models/globale/dw/basket/decorators/geSetZeroShippingPrice'),
    gePreserveOriginalPrices: require('*/cartridge/models/globale/dw/basket/decorators/gePreserveOriginalPrices'),
    geSetDefaultPaymentInstrument: require('*/cartridge/models/globale/dw/basket/decorators/geSetDefaultPaymentInstrument'),
    geSetDefaultBillingAddress: require('*/cartridge/models/globale/dw/basket/decorators/geSetDefaultBillingAddress'),
    geSetDefaultShippingAddress: require('*/cartridge/models/globale/dw/basket/decorators/geSetDefaultShippingAddress'),
    geUpdateProductsCartItemId: require('*/cartridge/models/globale/dw/basket/decorators/geUpdateProductsCartItemId'),
    geUpdateProductsInventoryList: require('*/cartridge/models/globale/dw/basket/decorators/geUpdateProductsInventoryList'),
    gePreserveStorefrontPrices: require('*/cartridge/models/globale/dw/basket/decorators/gePreserveStorefrontPrices')
};
