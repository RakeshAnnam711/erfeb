'use strict';

/**
 * Calculates and returns Global-e Product API
 * @returns {Object} - Global-e Product API
 */
function getProduct() {
    var Money = require('dw/value/Money');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
    var currencyCode = globaleSession.getCurrency().currencyCode;
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var gePriceValue = this.giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice] || this.giftCertificateLineItem.price.valueOrNull;
    var gePrice = globalePrice(new Money(gePriceValue, currencyCode), this.getProductCode(), 1, false, true, true, true, this.giftCertificateLineItem);

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
        Keywords: null,
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
        ListPrice: this.getListPrice(), // decimal
        OriginalListPrice: this.getOriginalListPrice(), // decimal
        SalePrice: this.getSalePrice(), // decimal
        SalePriceBeforeRounding: this.getSalePriceBeforeRounding(), // decimal
        LineItemSalePrice: null, // decimal
        OriginalSalePrice: this.getOriginalSalePrice(), // decimal
        LineItemOriginalSalePrice: null, // decimal
        SalePriceReason: this.getSalePriceReason(),
        IsFixedPrice: this.priceModel.fixedPrice,
        OrderedQuantity: 1, // Int64
        DeliveryQuantity: 1, // Int64
        IsBundle: this.isBundle(),
        IsVirtual: this.isVirtual(),
        IsBlockedForGlobalE: null,
        HandlingCode: null,
        VATRateType: gePrice.getVatRateType(), // vatRateType
        LocalVATRateType: gePrice.getVatRateType(true), // VATRateType
        VATCategory: null, // VATCategory
        Brand: this.getBrand(), // Brand
        Categories: this.getCategories(), // List<Category>
        Attributes: null, // List<Attribute>
        AttributesEnglish: this.getAttributesEnglish(), // List<Attribute>
        IsBackOrdered: false,
        BackOrderDate: null,
        EstimatedDeliveryDate: this.getEstimatedDeliveryDate(),
        ProductClassCode: this.getProductAttributeByPref(globaleHelpers.preferenceKeys.geProductClassCodePropName),
        PriceCoefficientRate: gePrice.coefficientRate, // decimal
        MetaData: this.getMetadata(), // ProductMetaData
        IsGiftCard: this.isGiftCard(), // boolean
        Localization: this.getLocalization()
    };
    return product;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProduct', {
        value: getProduct
    });
};
