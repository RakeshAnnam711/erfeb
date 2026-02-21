'use strict';

/**
 * Calculates and returns Global-e Product API
 * @returns {Object} - Global-e Product API
 */
function getProduct() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
    var gePrice = globalePrice(this.productLineItem.price, this.productLineItem.productID, 1, true, true, true);

    var product = {
        ProductCode: this.getProductCode(),
        ProductGroupCode: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geProductGroupCodePropName),
        ProductCodeSecondary: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geProductCodeSecondaryPattern),
        ProductGroupCodeSecondary: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geProductGroupCodeSecondaryPattern),
        CartItemId: this.getCartItemId(),
        ParentCartItemId: this.getParentCartItemId(),
        CartItemOptionId: this.getCartItemOptionId(),
        Name: this.getProductName(),
        NameEnglish: this.getProductNameEnglish(),
        Description: this.getProductDescription(),
        DescriptionEnglish: this.getProductDescriptionEnglish(),
        Keywords: this.apiProduct.pageKeywords,
        URL: this.getProductUrl(),
        GiftMessage: this.getGiftMessage(),
        GenericHSCode: null,
        OriginCountryCode: null,
        Weight: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geWeightAttributeKey), // decimal
        NetWeight: null, // decimal
        Height: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geHeightAttributeKey), // decimal
        Width: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geWidthAttributeKey), // decimal
        Length: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geLengthAttributeKey), // decimal
        Volume: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geVolumeAttributeKey), // decimal
        NetVolume: null, // decimal
        ImageURL: this.getProductImageUrl(),
        ImageHeight: null, // Int64
        ImageWidth: null, // Int64
        ListPrice: this.getListPrice(this.productLineItem.quantity), // decimal
        OriginalListPrice: this.getOriginalListPrice(this.productLineItem.quantity), // decimal
        SalePrice: this.getSalePrice(), // decimal
        SalePriceBeforeRounding: this.getSalePriceBeforeRounding(this.productLineItem.quantity), // decimal
        LineItemSalePrice: null, // decimal
        OriginalSalePrice: this.getOriginalSalePrice(this.productLineItem.quantity), // decimal
        LineItemOriginalSalePrice: null, // decimal
        SalePriceReason: this.getSalePriceReason(),
        IsFixedPrice: this.priceModel.price.fixedPrice,
        OrderedQuantity: this.productLineItem.quantityValue, // Int64
        DeliveryQuantity: this.productLineItem.quantityValue, // Int64
        IsBundle: this.isBundle(),
        IsVirtual: this.isVirtual(),
        IsBlockedForGlobalE: null,
        HandlingCode: null,
        VATRateType: this.getVatRateTypeDst(), // vatRateType
        LocalVATRateType: this.getVatRateTypeLocal(), // VATRateType
        VATCategory: null, // VATCategory
        Brand: this.getBrand(), // Brand
        Categories: this.getCategories(), // List<Category>
        Attributes: null, // List<Attribute>
        AttributesEnglish: this.getAttributesEnglish(), // List<Attribute>
        IsBackOrdered: this.getIsBackOrdered(),
        BackOrderDate: null,
        EstimatedDeliveryDate: this.getEstimatedDeliveryDate(),
        ProductClassCode: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geProductClassCodePropName),
        PriceCoefficientRate: gePrice.coefficientRate, // decimal
        MetaData: this.getMetadata(), // ProductMetaData
        IsGiftCard: this.isGiftCard(), // boolean
        HubCode: this.getHubCode(),
        Localization: this.getLocalization()
    };
    return product;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProduct', {
        value: getProduct
    });
};
