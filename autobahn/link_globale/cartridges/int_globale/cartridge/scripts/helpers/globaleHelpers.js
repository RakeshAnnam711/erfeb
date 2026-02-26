'use strict';

/**
 * globaleHelpers provides easy access to Global-e Configuration and helper functions.
 * All Site Preferences, custom attributes of any System Object should be prefixed with 'ge*',
 * and named with using lower camel case style,
 * for example 'geEnabled' (SitePreference), geInternationalPrice (PriceAdjustment custom attribute).
 */

var paymentMethod = {
    GLOBALE: 'GLOBALE'
};

var salutation = {
    Mr: 1,
    Mrs: 2,
    Miss: 3,
    Ms: 4
};

var customAttr = {
    product: {
        geRestrictedCountries: 'geRestrictedCountries',
        geIsForbidden: 'geIsForbidden',
        geVatRates: 'geVatRates',
        geIsGiftCard: 'geIsGiftCard',
        geCountriesExclusions: 'geCountriesExclusions'
    },
    promotion: {
        geDiscountType: 'geDiscountType',
        geDoNotConvert: 'geDoNotConvert',
        geLoyaltyPromotion: 'geLoyaltyPromotion',
        geFreeShippingMethod: 'geFreeShippingMethod',
        geDiscountPrice: 'geDiscountPrice'
    },
    priceAdjustment: {
        geName: 'geName',
        geDescription: 'geDescription',
        gePrice: 'gePrice',
        geVatRate: 'geVatRate',
        geLocalVatRate: 'geLocalVatRate',
        geInternationalPrice: 'geInternationalPrice',
        geCouponCode: 'geCouponCode',
        geDiscountCode: 'geDiscountCode',
        geLoyaltyVoucherCode: 'geLoyaltyVoucherCode',
        geDiscountType: 'geDiscountType',
        geOriginalPriceAdjustmentPrice: 'geOriginalPriceAdjustmentPrice'
    },
    pricebook: {
        geNotApplicableForDynamic: 'geNotApplicableForDynamic',
        geBasePricebook: 'geBasePricebook',
        geFixedPricebook: 'geFixedPricebook',
        geApplicableToCountries: 'geApplicableToCountries',
        geApplicableToCurrencies: 'geApplicableToCurrencies',
        geApplicableToMerchantId: 'geApplicableToMerchantId',
        geCachePriceBook: 'geCachePriceBook',
        geCachePriceBookCombinations: 'geCachePriceBookCombinations'
    },
    shippingMethod: {
        isGeShippingMethod: 'isGeShippingMethod',
        geCarrier: 'geCarrier',
        geCarrierName: 'geCarrierName',
        geCarrierTitle: 'geCarrierTitle'
    },
    productLineItem: {
        geCartItemId: 'geCartItemId',
        geCartItemOptionId: 'geCartItemOptionId',
        geInternationalPrice: 'geInternationalPrice',
        geDiscountedPrice: 'geDiscountedPrice',
        geInternationalDiscountedPrice: 'geInternationalDiscountedPrice',
        geInternationalDiscountedPriceInMerchantCurrency: 'geInternationalDiscountedPriceInMerchantCurrency',
        geParentCartItemId: 'geParentCartItemId',
        gePrice: 'gePrice',
        gePriceBeforeGlobaleDiscount: 'gePriceBeforeGlobaleDiscount',
        gePriceBeforeRoundingRate: 'gePriceBeforeRoundingRate',
        geRoundingRate: 'geRoundingRate',
        geVatRate: 'geVatRate',
        geOriginalPriceBookTotalPrice: 'geOriginalPriceBookTotalPrice',
        geDiscountedPriceForCustoms: 'geDiscountedPriceForCustoms',
        geInternationalDiscountedPriceForCustoms: 'geInternationalDiscountedPriceForCustoms',
        geListPrice: 'geListPrice',
        geInternationalListPrice: 'geInternationalListPrice',
        geLineItemInternationalPrice: 'geLineItemInternationalPrice',
        geIsBackOrdered: 'geIsBackOrdered',
        geBackOrderDate: 'geBackOrderDate',
        geCustomerVATRate: 'geCustomerVATRate',
        geProductSubsidy: 'geProductSubsidy',
        geInternationalProductSubsidy: 'geInternationalProductSubsidy',
        geIsGiftCard: 'geIsGiftCard'
    },
    order: {
        // Loyalty Program
        geLoyaltyPointsSpent: 'geLoyaltyPointsSpent',
        geLoyaltyPointsEarned: 'geLoyaltyPointsEarned',
        geLoyaltyCode: 'geLoyaltyCode',
        // basic attributes
        geCartToken: 'geCartToken',
        geOrderNumber: 'geOrderNumber',
        geIsReplacementOrder: 'geIsReplacementOrder',
        geOriginalOrderNumber: 'geOriginalOrderNumber',
        geOriginalMerchantOrderNumber: 'geOriginalMerchantOrderNumber',
        geOriginalMerchantInternalOrderNumber: 'geOriginalMerchantInternalOrderNumber',
        geDiscountedShippingPriceMerchantCurrency: 'geDiscountedShippingPriceMerchantCurrency',
        geDutiesAndTaxesSubsidy: 'geDutiesAndTaxesSubsidy',
        geTotalProductsNetPrice: 'geTotalProductsNetPrice',
        geShippingSubsidy: 'geShippingSubsidy',
        geDeliveryStoreId: 'geDeliveryStoreId',
        geBarCode: 'geBarCode',
        geCurrencyCode: 'geCurrencyCode',
        gePriceCoefficientRate: 'gePriceCoefficientRate',
        geAllowEmailsFromMerchant: 'geAllowEmailsFromMerchant',
        geAllowDirectCommunicationFromMerchant: 'geAllowDirectCommunicationFromMerchant',
        geCartId: 'geCartId',
        geStatusCode: 'geStatusCode',
        geReceivedOrderStatusUpdates: 'geReceivedOrderStatusUpdates',
        geOrderCancellationReasonCode: 'geOrderCancellationReasonCode',
        geTotalDutiesAndTaxesPrice: 'geTotalDutiesAndTaxesPrice',
        geSuppressPersonalInformation: 'geSuppressPersonalInformation',
        geOrderDocuments: 'geOrderDocuments',
        geUSSalesTax: 'geUSSalesTax',
        geCashOnDeliveryFeeMc: 'geCashOnDeliveryFeeMc',
        geMerchantShippingVATRate: 'geMerchantShippingVATRate',
        geNonProductTotalSubsidy: 'geNonProductTotalSubsidy',
        geInternationalNonProductTotalSubsidy: 'geInternationalNonProductTotalSubsidy',
        geOrderCreationSource: 'geOrderCreationSource',
        geOrderCreationSourceInfo: 'geOrderCreationSourceInfo',
        geIsTaxExemption: 'geIsTaxExemption',
        geOrderType: 'geOrderType',
        geCookieConsent: 'geCookieConsent',
        geIsOrderCreatedFallbackScenario: 'geIsOrderCreatedFallbackScenario',
        geIsGiftWrappingRequired: 'geIsGiftWrappingRequired',
        geIsOrderCreatedPayByLinkScenario: 'geIsOrderCreatedPayByLinkScenario',
        // International Details
        geRoundingRate: 'geRoundingRate',
        geIsFreeShipping: 'geIsFreeShipping',
        geFreeShippingCouponCode: 'geFreeShippingCouponCode',
        geShippingMethodCode: 'geShippingMethodCode',
        geShippingMethodName: 'geShippingMethodName',
        geTotalCustomerDiscounts: 'geTotalCustomerDiscounts',
        geOrderTrackingNumber: 'geOrderTrackingNumber',
        geOrderTrackingUrl: 'geOrderTrackingUrl',
        geTotalDiscountedShippingPrice: 'geTotalDiscountedShippingPrice',
        geShippingMethodTypeCode: 'geShippingMethodTypeCode',
        geShippingMethodTypeName: 'geShippingMethodTypeName',
        geDeliveryDaysFrom: 'geDeliveryDaysFrom',
        geDeliveryDaysTo: 'geDeliveryDaysTo',
        geConsignmentFee: 'geConsignmentFee',
        geSizeOverchargeValue: 'geSizeOverchargeValue',
        geRemoteAreaSurcharge: 'geRemoteAreaSurcharge',
        geCustomerCurrencyCode: 'geCustomerCurrencyCode',
        geTotalPrice: 'geTotalPrice',
        geTransactionCurrencyCode: 'geTransactionCurrencyCode',
        geTransactionTotalPrice: 'geTransactionTotalPrice',
        geTotalShippingPrice: 'geTotalShippingPrice',
        geSameDayDispatch: 'geSameDayDispatch',
        geSameDayDispatchCost: 'geSameDayDispatchCost',
        geDoNotChargeVat: 'geDoNotChargeVat',
        geTotalDutiesPrice: 'geTotalDutiesPrice',
        geCcfPrice: 'geCcfPrice',
        geTotalCcfPrice: 'geTotalCcfPrice',
        geDutiesGuaranteed: 'geDutiesGuaranteed',
        geOrderWaybillNumber: 'geOrderWaybillNumber',
        geShippingMethodStatusCode: 'geShippingMethodStatusCode',
        geShippingMethodStatusName: 'geShippingMethodStatusName',
        gePaymentMethodCode: 'gePaymentMethodCode',
        gePaymentMethodName: 'gePaymentMethodName',
        geOrderDeliveryDate: 'geOrderDeliveryDate',
        geCustomerComments: 'geCustomerComments',
        geIsSplitOrder: 'geIsSplitOrder',
        geOtVoucherCode: 'geOtVoucherCode',
        geOtCurrencyCode: 'geOtCurrencyCode',
        geOtVoucherAmount: 'geOtVoucherAmount',
        gePrePayOffered: 'gePrePayOffered',
        geCashOnDeliveryFee: 'geCashOnDeliveryFee',
        geTotalVatAmount: 'geTotalVatAmount',
        geShippingVATRate: 'geShippingVATRate',
        geCustomerUSSalesTax: 'geCustomerUSSalesTax',
        geTotalDutiesPaidByCustomerPrice: 'geTotalDutiesPaidByCustomerPrice',
        // Shipping Address
        geShippingAddress1: 'geShippingAddress1',
        geShippingAddress2: 'geShippingAddress2',
        geShippingCity: 'geShippingCity',
        geShippingCityRegion: 'geShippingCityRegion',
        geShippingCompany: 'geShippingCompany',
        geShippingCountryCode: 'geShippingCountryCode',
        geShippingCountryName: 'geShippingCountryName',
        geShippingEmail: 'geShippingEmail',
        geShippingFax: 'geShippingFax',
        geShippingFirstName: 'geShippingFirstName',
        geShippingLastName: 'geShippingLastName',
        geShippingMiddleName: 'geShippingMiddleName',
        geShippingPhone1: 'geShippingPhone1',
        geShippingPhone2: 'geShippingPhone2',
        geShippingSalutation: 'geShippingSalutation',
        geShippingStateCode: 'geShippingStateCode',
        geShippingStateOrProvince: 'geShippingStateOrProvince',
        geShippingZip: 'geShippingZip',
        // Billing Address
        geBillingAddress1: 'geBillingAddress1',
        geBillingAddress2: 'geBillingAddress2',
        geBillingCity: 'geBillingCity',
        geBillingCityRegion: 'geBillingCityRegion',
        geBillingCompany: 'geBillingCompany',
        geBillingCountryCode: 'geBillingCountryCode',
        geBillingCountryName: 'geBillingCountryName',
        geBillingEmail: 'geBillingEmail',
        geBillingFax: 'geBillingFax',
        geBillingFirstName: 'geBillingFirstName',
        geBillingLastName: 'geBillingLastName',
        geBillingMiddleName: 'geBillingMiddleName',
        geBillingPhone1: 'geBillingPhone1',
        geBillingPhone2: 'geBillingPhone2',
        geBillingSalutation: 'geBillingSalutation',
        geBillingStateCode: 'geBillingStateCode',
        geBillingStateOrProvince: 'geBillingStateOrProvince',
        geBillingZip: 'geBillingZip',
        // Customer Shipping Address
        geCustomerShippingAddress1: 'geCustomerShippingAddress1',
        geCustomerShippingAddress2: 'geCustomerShippingAddress2',
        geCustomerShippingCity: 'geCustomerShippingCity',
        geCustomerShippingCityRegion: 'geCustomerShippingCityRegion',
        geCustomerShippingCompany: 'geCustomerShippingCompany',
        geCustomerShippingCountryCode: 'geCustomerShippingCountryCode',
        geCustomerShippingCountryName: 'geCustomerShippingCountryName',
        geCustomerShippingEmail: 'geCustomerShippingEmail',
        geCustomerShippingFax: 'geCustomerShippingFax',
        geCustomerShippingFirstName: 'geCustomerShippingFirstName',
        geCustomerShippingLastName: 'geCustomerShippingLastName',
        geCustomerShippingMiddleName: 'geCustomerShippingMiddleName',
        geCustomerShippingPhone1: 'geCustomerShippingPhone1',
        geCustomerShippingPhone2: 'geCustomerShippingPhone2',
        geCustomerShippingSalutation: 'geCustomerShippingSalutation',
        geCustomerShippingStateCode: 'geCustomerShippingStateCode',
        geCustomerShippingStateOrProvince: 'geCustomerShippingStateOrProvince',
        geCustomerShippingZip: 'geCustomerShippingZip',
        // Customer Billing Address
        geCustomerBillingAddress1: 'geCustomerBillingAddress1',
        geCustomerBillingAddress2: 'geCustomerBillingAddress2',
        geCustomerBillingCity: 'geCustomerBillingCity',
        geCustomerBillingCityRegion: 'geCustomerBillingCityRegion',
        geCustomerBillingCompany: 'geCustomerBillingCompany',
        geCustomerBillingCountryCode: 'geCustomerBillingCountryCode',
        geCustomerBillingCountryName: 'geCustomerBillingCountryName',
        geCustomerBillingEmail: 'geCustomerBillingEmail',
        geCustomerBillingFax: 'geCustomerBillingFax',
        geCustomerBillingFirstName: 'geCustomerBillingFirstName',
        geCustomerBillingLastName: 'geCustomerBillingLastName',
        geCustomerBillingMiddleName: 'geCustomerBillingMiddleName',
        geCustomerBillingPhone1: 'geCustomerBillingPhone1',
        geCustomerBillingPhone2: 'geCustomerBillingPhone2',
        geCustomerBillingSalutation: 'geCustomerBillingSalutation',
        geCustomerBillingStateCode: 'geCustomerBillingStateCode',
        geCustomerBillingStateOrProvince: 'geCustomerBillingStateOrProvince',
        geCustomerBillingZip: 'geCustomerBillingZip',
        // Payment Address
        gePdOwnerFirstName: 'gePdOwnerFirstName',
        gePdOwnerLastName: 'gePdOwnerLastName',
        gePdOwnerName: 'gePdOwnerName',
        gePdPaymentMethodName: 'gePdPaymentMethodName',
        gePdPaymentMethodCode: 'gePdPaymentMethodCode',
        gePdCountryName: 'gePdCountryName',
        gePdCountryCode: 'gePdCountryCode',
        gePdStateCode: 'gePdStateCode',
        gePdStateOrProvince: 'gePdStateOrProvince',
        gePdCity: 'gePdCity',
        gePdZip: 'gePdZip',
        gePdAddress1: 'gePdAddress1',
        gePdAddress2: 'gePdAddress2',
        gePdPhone1: 'gePdPhone1',
        gePdPhone2: 'gePdPhone2',
        gePdFax: 'gePdFax',
        gePdEmail: 'gePdEmail',
        gePdPaymentMethodTypeCode: 'gePdPaymentMethodTypeCode',
        gePdCardNumber: 'gePdCardNumber',
        gePdCVVNumber: 'gePdCVVNumber',
        gePdExpirationDate: 'gePdExpirationDate',
        // Mixed Orders
        geMixedOrdersMainOrderID: 'geMixedOrdersMainOrderID',
        geMixedOrdersSubOrdersIDs: 'geMixedOrdersSubOrdersIDs',
        geMixedOrdersSuccessfullyUpdated: 'geMixedOrdersSuccessfullyUpdated'
    },
    orderAddress: {
        geDeliveryStoreId: 'geDeliveryStoreId',
        geVATRegistrationNumber: 'geVATRegistrationNumber',
        geCustomerTaxId: 'geCustomerTaxId',
        geCityRegion: 'geCityRegion'
    },
    customerAddress: {
        geCityRegion: 'geCityRegion'
    },
    basket: {
        geCartId: 'geCartId',
        geCartToken: 'geCartToken',
        geMerchantOrderId: 'geMerchantOrderId',
        geIsOrderCreatedFallbackScenario: 'geIsOrderCreatedFallbackScenario',
        geIsOrderCreatedPayByLinkScenario: 'geIsOrderCreatedPayByLinkScenario'
    },
    paymentTransaction: {
        gePaymentMethodName: 'gePaymentMethodName',
        gePaymentMethodType: 'gePaymentMethodType',
        gePaymentAmountInCustomerCurrency: 'gePaymentAmountInCustomerCurrency',
        gePaymentDetails: 'gePaymentDetails',
        geAlternativePaymentDetails: 'geAlternativePaymentDetails',
        geAmountCustomerCurrency: 'geAmountCustomerCurrency'
    },
    giftCertificateLineItem: {
        geInternationalPrice: 'geInternationalPrice',
        geCurrencyCode: 'geCurrencyCode',
        initialBalance: 'initialBalance',
        currentBalance: 'currentBalance',
        geCartItemId: 'geCartItemId',
        gePrice: 'gePrice',
        originalCurrencyCode: 'originalCurrencyCode',
        geGiftCertificateID: 'geGiftCertificateID'
    },
    giftCertificate: {
        geCurrencyCode: 'geCurrencyCode',
        originalCurrencyCode: 'originalCurrencyCode',
        initialBalance: 'initialBalance',
        currentBalance: 'currentBalance',
        geInternationalPrice: 'geInternationalPrice'
    },
    profile: {
        geSalutation: 'geSalutation'
    }
};

var prefsCache = {};
var preferenceKeys = {
    geEnabled: 'geEnabled',
    geResetCurrencyCodeOnCountryChange: 'geResetCurrencyCodeOnCountryChange',
    geCookieLifetime: 'geCookieLifetime',
    geEnableStockReservation: 'geEnableStockReservation',
    geStockReservationTime: 'geStockReservationTime',
    geEnableCartValidationCAPIBasket: 'geEnableCartValidationCAPIBasket',
    geEnableCartValidationErrors: 'geEnableCartValidationErrors',
    geCookieDomain: 'geCookieDomain',
    geClientJsMerchantId: 'geClientJsMerchantId',
    geClientJsBaseUrl: 'geClientJsBaseUrl',
    geClientJsSource: 'geClientJsSource',
    geProductClassCodePropName: 'geProductClassCodePropName',
    geDefaultShippingMethod: 'geDefaultShippingMethod',
    geProductGroupCodePropName: 'geProductGroupCodePropName',
    geProductCodeSecondaryPattern: 'geProductCodeSecondaryPattern',
    geProductGroupCodeSecondaryPattern: 'geProductGroupCodeSecondaryPattern',
    geWeightAttributeKey: 'geWeightAttributeKey',
    geHeightAttributeKey: 'geHeightAttributeKey',
    geWidthAttributeKey: 'geWidthAttributeKey',
    geLengthAttributeKey: 'geLengthAttributeKey',
    geVolumeAttributeKey: 'geVolumeAttributeKey',
    geProductImageViewType: 'geProductImageViewType',
    geApiUrl: 'geApiUrl',
    geMerchantGuid: 'geMerchantGuid',
    addNotes: 'geAddNotes',
    geReturnPortalUrl: 'geReturnPortalUrl',
    geCatalogFeedConfig: 'geCatalogFeedConfig',
    geCatalogFeedLastRun: 'geCatalogFeedLastRun',
    geCatalogFeedStartPosition: 'geCatalogFeedStartPosition',
    geRestrictedItemsFeedConfig: 'geRestrictedItemsFeedConfig',
    geRestrictedItemsFeedLastRun: 'geRestrictedItemsFeedLastRun',
    geSearchableProductsPromotionId: 'geSearchableProductsPromotionId',
    geLoyaltyPromotionSpentPointsFactor: 'geLoyaltyPromotionSpentPointsFactor',
    geLoyaltyPromotionEarnedPointsFactor: 'geLoyaltyPromotionEarnedPointsFactor',
    geCustomObjectsCacheSettings: 'geCustomObjectsCacheSettings',
    geOCAPIDomain: 'geOCAPIDomain',
    geOCAPIVersion: 'geOCAPIVersion',
    geOCAPIClientId: 'geOCAPIClientId',
    geSCAPIShortCode: 'geSCAPIShortCode',
    geSCAPIVersion: 'geSCAPIVersion',
    geSCAPIOrganizationId: 'geSCAPIOrganizationId',
    geSCAPIClientId: 'geSCAPIClientId',
    geSCAPIClientSecret: 'geSCAPIClientSecret',
    geSCAPIRedirectURI: 'geSCAPIRedirectURI',
    geSCAPIAuthType: 'geSCAPIAuthType',
    geRSAPublicKey: 'geRSAPublicKey',
    geRSAPrivateKey: 'geRSAPrivateKey',
    geAESPrivateKey: 'geAESPrivateKey',
    geJWTAuthEnabled: 'geJWTAuthEnabled',
    geJWTAuthPublicKey: 'geJWTAuthPublicKey',
    geJWTAuthAlgorythm: 'geJWTAuthAlgorythm',
    geJWTAuthIssuer: 'geJWTAuthIssuer',
    geMetadataCustomAttributes: 'geMetadataCustomAttributes',
    geUseCustomProductInventoryLists: 'geUseCustomProductInventoryLists',
    geSplitOrderPayments: 'geSplitOrderPayments',
    geTaxJurisdictionId: 'geTaxJurisdictionId',
    geEnableNativeGiftCertificates: 'geEnableNativeGiftCertificates',
    geWebStoreUUID: 'geWebStoreUUID',
    geCAPIType: 'geCAPIType'
};

var customObjectKeys = {
    coAppSettings: 'GLOBALE_APP_SETTINGS',
    coCountries: 'GLOBALE_COUNTRIES',
    coCountryCoefficients: 'GLOBALE_COUNTRY_COEFFICIENTS',
    coProductClassCoefficients: 'GLOBALE_PRODUCT_CLASS_COEFFICIENTS',
    coCultures: 'GLOBALE_CULTURES',
    coCurrencies: 'GLOBALE_CURRENCIES',
    coCurrencyRates: 'GLOBALE_CURRENCY_RATES',
    coRoundingRules: 'GLOBALE_ROUNDING_RULES',
    coHubDetails: 'GLOBALE_HUB_DETAILS',
    coGiftCards: 'DEMO_GLOBALE_GIFT_CARDS',
    coLoyaltyCards: 'DEMO_GLOBALE_LOYALTY_CARDS',
    coRestrictedItems: 'GLOBALE_RESTRICTED_ITEMS',
    coOrderNotification: 'GLOBALE_ORDER_NOTIFICATION',
    coInventoryNotification: 'GLOBALE_INVENTORY_NOTIFICATION'
};

var consts = {
    geId: 'Globale',
    geCookieName: 'GlobalE_Data',
    hubKey: 'ActiveHubDetails',
    basedOnPrice: 'basedOnPrice',
    gePaymentType: 'GlobalePayment',
    geGiftCardPaymentType: 'GlobaleGiftCard',
    geLoyaltyCardPaymentType: 'GlobaleLoyaltyCard',
    JSONStringLength: 6000000,
    notificationOrderStatusUpdate: 'OrderStatusUpdate',
    notificationOrderDispatchUpdate: 'OrderDispatchUpdate',
    notificationOrderRefundUpdate: 'OrderRefundUpdate',
    notificationOrderRMAUpdate: 'OrderRMAUpdate',
    notificationOrderRMACreate: 'OrderRMACreate',
    notificationInventoryVoidReservation: 'VoidReservation',
    typeSingleOrder: 'SingleOrder',
    typeMixedOrdersMainOrder: 'MixedOrdersMainOrder',
    typeMixedOrdersSubOrder: 'MixedOrdersSubOrder',
    geAddresses: {
        PRIMARY_SHIPPING: 'PrimaryShipping',
        SECONDARY_SHIPPING: 'SecondaryShipping',
        PRIMARY_BILLING: 'PrimaryBilling',
        SECONDARY_BILLING: 'SecondaryBilling',
        GLOBALE_SHIPPING_PREFIX: 'geShipping',
        CUSTOMER_SHIPPING_PREFIX: 'geCustomerShipping',
        GLOBALE_BILLING_PREFIX: 'geBilling',
        CUSTOMER_BILLING_PREFIX: 'geCustomerBilling'
    },
    productID: 'productID',
    priceStrategy: {
        FIXED: 'FIXED',
        DYNAMIC: 'DYNAMIC'
    },
    urlParameters: {
        customAttributesData: 'customAttributesData',
        isTaxationBasedOnAdjustedPrice: 'isTaxationBasedOnAdjustedPrice',
        sfccCartHash: 'sfccCartHash'
    },
    orderNo: {
        ORDER_CREATE_BYPASS_NO: '-1',
        ORDER_CREATE_FORCE_NEW_NO: '-2'
    },
    geCatalogFeed: {
        DEFAULT_EXPORT_START_POSITION: 0,
        // Catalog Feed JSON configuration. The default values of OPTIONAL settings
        DEFAULT_PROCESS_PRODUCTS_PER_RUN_COUNT: 0,
        DEFAULT_FILE_TYPE: 'csv',
        DEFAULT_FILE_SEPARATOR: ',',
        DEFAULT_FILE_QUOTE: '"',
        DEFAULT_PROCESS_ONLY_ONLINE_PRODUCTS: false,
        DEFAULT_ADD_MASTER_PRODUCTS: false,
        DEFAULT_ADD_VARIATION_GROUP_PRODUCTS: false,
        // Catalog Feed JSON configuration. The default values of REQUIRED settings
        DEFAULT_IMPEX_FOLDER_PATH: null,
        DEFAULT_IMPEX_ARCHIVE_FOLDER_PATH: null,
        DEFAULT_SFTP_CREDENTIALS_IDS: null,
        DEFAULT_FILE_NAME: null,
        DEFAULT_COLUMNS: null,
        DEFAULT_LOCALE_ID: null,
        DEFAULT_CATALOG_ID: null,
        DEFAULT_PROCESS_ONLY_MODIFIED_PRODUCTS: null
    },
    capi: {
        ORDER_CREATE_REQUEST_PARAM: 'c_geOrderCreateRequest',
        RESERVED_ORDER_NO_PARAM: 'c_geReservedOrderNo',
        COUNTRY_CODE_PARAM: 'c_geCountryCode',
        CURRENCY_CODE_PARAM: 'c_geCurrencyCode',
        GET_CART_TOKEN_PARAM: 'c_geGetCartToken',
        GET_SDK_INIT_DATA_PARAM: 'c_geGetSDKInitData',
        AUTH_TOKEN_PARAM: 'c_auth_token',
        LOCALE_PARAM: 'locale',
        SITE_ID_PARAM: 'siteId',
        OCAPI_TYPE: 'OCAPI',
        SCAPI_TYPE: 'SCAPI',
        PUBLIC_CLIENT_SCAPI_AUTH_TYPE: 'PublicClient',
        PRIVATE_CLIENT_SCAPI_AUTH_TYPE: 'PrivateClient',
        BASKET_CURRENCY_CODE_PARAM: 'c_geBasketCurrencyCode',
        BASKET_HASH_PARAM: 'c_geBasketHash'
    }
};

var services = {
    appSettings: 'Globale-AppSettings',
    appVersion: 'Globale-AppVersion',
    countries: 'Globale-Countries',
    countryCoefficients: 'Globale-CountryCoefficients',
    locationsDefaultCulturesList: 'Globale-LocationsDefaultCulturesList',
    currencies: 'Globale-Currencies',
    currencyRates: 'Globale-CurrencyRates',
    roundingRules: 'Globale-RoundingRules',
    activeHubDetails: 'Globale-ActiveHubDetails',
    recentProductCountry: 'Globale-RecentProductCountryS',
    sendCart: 'Globale-SendCartV2',
    updateOrderStatus: 'Globale-UpdateOrderStatus',
    createOrderRefund: 'Globale-CreateOrderRefund',
    updateOrderDispatch: 'Globale-UpdateOrderDispatchV2',
    updateRMA: 'Globale-UpdateRMA',
    jwt: 'Globale-JWT',
    shippingDetails: 'Globale-ShippingDetails',
    orderDetails: 'Globale-OrderDetails',
    ocapi: 'Globale-OCAPI',
    scapi: 'Globale-SCAPI',
    sftpUpload: 'Globale-SFTPUpload'
};

var cacheKeys = {
    appSettings: 'appSettings',
    hubDetails: 'hubDetails',
    countries: 'countries',
    countryCoefficients: 'countryCoefficients',
    productClassCoefficients: 'productClassCoefficients',
    cultures: 'cultures',
    currencies: 'currencies',
    currencyRates: 'currencyRates',
    roundingRules: 'roundingRules',
    fixedPriceBooks: 'fixedPriceBooks',
    cachePriceBooks: 'cachePriceBooks',
    priceDisplayFormat: 'priceDisplayFormat',
    geCacheStorage5: 'geCacheStorage5'
};

var hooks = {
    init: 'globale.onInit',
    sendCart: {
        getGuestEmail: 'globale.getGuestEmail',
        getCustomerAddresses: 'globale.getCustomerAddresses',
        getUrlParameters: 'globale.getUrlParameters',
        getPLICustomMetadata: 'globale.getPLICustomMetadata',
        getPliEstimatedDeliveryDate: 'globale.getPliEstimatedDeliveryDate',
        getPliIsBackOrdered: 'globale.getPliIsBackOrdered',
        getAllowMailsFromMerchant: 'globale.getAllowMailsFromMerchant',
        getAllowDirectCommunicationFromMerchant: 'globale.getAllowDirectCommunicationFromMerchant',
        getCookieConsent: 'globale.getCookieConsent',
        beforeSendCartRequest: 'globale.beforeSendCartRequest',
        getPliHubCode: 'globale.getPliHubCode',
        getHubId: 'globale.getHubId'
    },
    checkout: {
        validateCart: 'globale.validateCart',
        beforeApplyCouponCode: 'globale.onBeforeApplyCouponCode',
        beforeRemoveCouponCode: 'globale.onBeforeRemoveCouponCode'
    },
    onGenerateBasketFromPayload: 'globale.onGenerateBasketFromPayload',
    onAfterCreateOrder: 'globale.onAfterCreateOrder',
    onAfterCreateMixedOrder: 'globale.onAfterCreateMixedOrder',
    onBeforePlaceOrder: 'globale.onBeforePlaceOrder',
    onAfterPlaceOrder: 'globale.onAfterPlaceOrder',
    onAfterUpdateOrder: 'globale.onAfterUpdateOrder',
    onAfterUpdateMixedOrders: 'globale.onAfterUpdateMixedOrders',
    onAfterPaymentUpdate: 'globale.onAfterPaymentUpdate',
    onAfterPaymentUpdateMixedOrders: 'globale.onAfterPaymentUpdateMixedOrders',
    onAfterStatusUpdate: 'globale.onAfterStatusUpdate',
    onAfterStatusUpdateMixedOrders: 'globale.onAfterStatusUpdateMixedOrders',
    onAfterShippingUpdate: 'globale.onAfterShippingUpdate',
    onAfterRefund: 'globale.onAfterRefund',
    onAfterGeRmaUpdate: 'globale.onAfterGeRmaUpdate',
    customerRegistration: {
        verification: 'globale.customerVerification',
        registration: 'globale.customerRegistration'
    },
    jobs: {
        outboundOrderStatusUpdate: 'globale.outboundOrderStatusUpdate',
        outboundOrderDispatchUpdate: 'globale.outboundOrderDispatchUpdate',
        outboundOrderRefundUpdate: 'globale.outboundOrderRefundUpdate',
        outboundOrderRMAUpdate: 'globale.outboundOrderRMAUpdate'
    },
    giftCertificate: {
        afterGiftCertificateRefund: 'globale.onAfterGiftCertificateRefund',
        afterGiftCertificateRedeem: 'globale.onAfterGiftCertificateRedeem',
        afterGiftCertificateCreate: 'globale.onAfterGiftCertificateCreate',
        afterGiftCertificateOrderCreate: 'onAfterGiftCertificateOrderCreate'
    },
    inventory: {
        onAfterVoidReservation: 'globale.onAfterVoidReservation'
    },
    payByLink: {
        onAfterCreateOrder: 'globale.onPayByLinkAfterCreateOrder',
        onAfterPlaceOrder: 'globale.onPayByLinkAfterPlaceOrder',
        onBeforeOrderValidate: 'globale.onBeforeOrderValidate',
        onAfterOrderValidate: 'globale.onAfterOrderValidate'
    },
    getProductInventoryListId: 'globale.getProductInventoryListId',
    getProductImageUrl: 'globale.getProductImageUrl'
};

var platformSettings = {
    sfccUseGEShippingPrice: 'sfccUseGEShippingPrice',
    sfccWhitelistedServerIps: 'sfccWhitelistedServerIps',
    sfccSendCartSendHubId: 'sfccSendCartSendHubId',
    sfccLanguagesConfiguration: 'sfccLanguagesConfiguration',
    sfccCartHashValidation: 'sfccCartHashValidation',
    sfccPlaceOrderOnPaymentUpdate: 'sfccPlaceOrderOnPaymentUpdate',
    sfccUseFixedPricesOnly: 'sfccUseFixedPricesOnly',
    sfccCreateNewAddressesFromCheckout: 'sfccCreateNewAddressesFromCheckout',
    sfccCultureMapping: 'sfccCultureMapping',
    sfccCheckoutCultureMapping: 'sfccCheckoutCultureMapping',
    sfccDynamicCountryCurrencyMapping: 'sfccDynamicCountryCurrencyMapping',
    sfccAllowedCurrencies: 'sfccAllowedCurrencies',
    sfccDefaultCountryCodeMapping: 'sfccDefaultCountryCodeMapping',
    sfccParseCountryCodeFromRequestLocale: 'sfccParseCountryCodeFromRequestLocale',
    sfccMerchantBaseCurrencyCode: 'sfccMerchantBaseCurrencyCode',
    sfccShippingSwitcherConfiguration: 'sfccShippingSwitcherConfiguration',
    sfccCachePriceBooksConfig: 'sfccCachePriceBooksConfig',
    sfccJWTAuthConfiguration: 'sfccJWTAuthConfiguration',
    sfccJWTApiAuthConfiguration: 'sfccJWTApiAuthConfiguration',
    sfccKlarnaConfigurations: 'sfccKlarnaConfigurations',
    sfccLocalizationConfiguration: 'sfccLocalizationConfiguration',
    sfccUseProductCodeSecondaryInFulfillmentEnabled: 'sfccUseProductCodeSecondaryInFulfillmentEnabled',
    sfccDoWebStoreValidation: 'sfccDoWebStoreValidation',
    sfccPayByLinkConfigurations: 'sfccPayByLinkConfigurations',
    sfccReconciliationCurrency: 'sfccReconciliationCurrency'
};

/**
 * Returns Global-e Logger
 * @param {string} category - The name of Global-e log category
 * @returns {Object} - Global-e Logger
 */
function getLogger(category) {
    if (!category) {
        category = 'GLOBALE'; // eslint-disable-line no-param-reassign
    }
    var Logger = require('dw/system/Logger');
    var geLogger = Logger.getLogger('GLOBALE', category);
    return {
        info: function () { geLogger.info.apply(geLogger, arguments); },
        debug: function () { geLogger.debug.apply(geLogger, arguments); },
        warn: function () { geLogger.warn.apply(geLogger, arguments); },
        error: function () { geLogger.error.apply(geLogger, arguments); },
        fatal: function () { geLogger.fatal.apply(geLogger, arguments); },
        message: function (error) {
            return Object.keys(error).map(function (el) {
                return el + ': ' + error[el];
            }).join('\n');
        }
    };
}

/**
 * Retrieves Global-e Custom Site Preference value
 * @param {string} key - custom Site Preference key
 * @returns {Object|string|number|null} - The value of custom Site Preference or null
 */
function getPreference(key) {
    var Site = require('dw/system/Site');
    var prefValue;
    if (!(key in prefsCache)) {
        prefValue = Site.current.getCustomPreferenceValue(key);
        if ((typeof prefValue === 'object') && (prefValue !== null) && ('value' in prefValue)) {
            prefValue = prefValue.value;
        }
        prefsCache[key] = prefValue;
    }
    return prefsCache[key];
}

/**
 * Sets Global-e Custom Site Preference value
 * @param {string} key - Custom Site Preference key
 * @param {Object|string|number|null} value - Custom Site Preference value
 */
function setPreference(key, value) {
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');

    Transaction.wrap(function () {
        Site.getCurrent().getPreferences().getCustom()[key] = value;
        delete prefsCache[key];
    });
}

/**
 * Retrieves Global-e JSON Custom Site Preference value
 * @param {string} key - custom Site Preference key
 * @returns {Object} - The JSON value of custom Site Preference or null
 */
function getJSONPreference(key) {
    var jsonPrefValue = null;
    var prefValue = getPreference(key);

    if (prefValue) {
        try {
            jsonPrefValue = JSON.parse(prefValue);
        } catch (e) {
            // error handler
        }
    }

    return jsonPrefValue;
}

/**
 * Retrieves Global-e Set of Strings Custom Site Preference value
 * @param {string} key - custom Site Preference key
 * @param {string} mappingKey - mapping key
 * @returns {Object|null} - The mapped value or null
 */
function getSetOfStringsPreferenceMapVal(key, mappingKey) {
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');

    var logger = getLogger();
    var result = null;
    try {
        var prefValue = getPreference(key);

        prefValue = !prefValue ? [] : prefValue.slice();

        var mapping = arrayUtils.find(prefValue, function (entry) {
            return entry.indexOf(mappingKey + ':') === 0;
        });

        if (mapping !== undefined) {
            var splitedVal = mapping.split(':');
            result = splitedVal.length === 2 ? splitedVal[1].trim() : null;
        }
    } catch (e) {
        logger.error('GLOBALE_PLATFORM_SETTINGS: {0}', logger.message(e));
    }

    return result;
}

/**
 * Retrieves Global-e System Preference value
 * @param {string} key - System Preference key
 * @returns {Object|string|number|null} - The value of System Preference or null
 */
function getSystemPreference(key) {
    var System = require('dw/system/System');
    var prefValue = System.getPreferences().getCustom()[key];
    if ((typeof prefValue === 'object') && (prefValue !== null) && ('value' in prefValue)) {
        prefValue = prefValue.value;
    }
    return prefValue;
}

/**
 * Checks is Global-e enabled
 * @returns {boolean} - Global-e enabled
 */
function isGlobaleEnabled() {
    return !!getPreference(preferenceKeys.geEnabled);
}

/**
 * Checks if the request source is Global-e
 * @return {boolean} - the request source is Global-e
 */
function isGlobaleRequest() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var httpRemoteAddress = globaleRequest.get('httpRemoteAddress');
    var whitelistedServerIps = geAppSettingsMgr.getPlatformSetting(platformSettings.sfccWhitelistedServerIps, '');

    return (httpRemoteAddress && whitelistedServerIps && whitelistedServerIps.indexOf(httpRemoteAddress) !== -1);
}

var globaleAppSettingsCache = null;

/**
 * Returns Global-e AppSettings
 * @param {string} key - custom Site Preference key
 * @returns {Object|null} - The value of custom Site Preference or null
 * @throws {Error} - The AppSettings object should exist
 */
function getGlobaleAppSettings() {
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var globaleObj = geAppSettingsMgr.getGEAppSettings();
    if (!globaleObj) {
        throw new Error('Can\'t get Global-e AppSettings!');
    }

    var globaleAppSettingsCO = globaleObj.getCustom();
    if (!globaleAppSettingsCO.webClientVersion || !globaleAppSettingsCO.clientSettings || !globaleAppSettingsCO.serverSettings) {
        throw new Error('Global-e AppSettings is not complete!');
    }

    var globaleAppSettings = {
        clientSettings: globaleAppSettingsCO.clientSettings,
        serverSettings: globaleAppSettingsCO.serverSettings,
        webClientVersion: globaleAppSettingsCO.webClientVersion,
        apiVersion: globaleAppSettingsCO.apiVersion
    };

    globaleAppSettings.serverSettings = JSON.parse(globaleAppSettings.serverSettings);

    if (globaleAppSettingsCache === null) {
        globaleAppSettingsCache = globaleAppSettings;
    }

    return globaleAppSettingsCache;
}

/**
 * Return root price book for a given price book
 * @param {dw.catalog.PriceBook} priceBook - Provided price book
 * @returns {dw.catalog.PriceBook} root price book
 */
function getRootPriceBook(priceBook) {
    var rootPriceBook = priceBook;
    while (rootPriceBook.parentPriceBook) {
        rootPriceBook = rootPriceBook.parentPriceBook;
    }
    return rootPriceBook;
}

/**
 * Calculates the Product's List (Standard) Price
 * @param {dw.catalog.ProductPriceModel|GlobalePriceModel} priceModel - SFCC or Global-e Product Price Model
 * @param {boolean|undefined|null} original - If true - will return original list price regardless whether it is Global-e Price Model or not.
 * @param {dw.value.Quantity} qty - Product's quantity
 * @returns {dw.value.Money|GlobaleMoney} - List (Standard) Price
 */
function getProductListPrice(priceModel, original, qty) {
    var Money = require('dw/value/Money');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var price = Money.NOT_AVAILABLE;
    var priceBook;
    if (!priceModel) {
        return price;
    }
    var globaleSession = require('*/cartridge/models/globale/session');
    if (('super' in priceModel) && priceModel.super && original) {
        priceModel = priceModel.super; // eslint-disable-line no-param-reassign
    }
    if (priceModel.price.valueOrNull === null && priceModel.minPrice) {
        return priceModel.minPrice;
    }
    if (globaleSession.get('geOperatedCountry') && (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) && !original) {
        // List Price
        price = priceModel.getFixedPriceBookPrice(true, qty);
        if (!price.available && priceModel.price.available && priceModel.price.fixedPrice) {
            price = priceModel.price;
        }
        if (price.available || globaleSession.get('geUseFixedPricesOnly')) {
            return price;
        }
    }
    if (priceModel.priceInfo && priceModel.priceInfo.priceBook) {
        priceBook = getRootPriceBook(priceModel.priceInfo.priceBook);
        if (qty && qty.value) {
            price = priceModel.getPriceBookPrice(priceBook.ID, qty);
        } else {
            price = priceModel.getPriceBookPrice(priceBook.ID);
        }
    }
    if (!price.available) {
        price = priceModel.price.available ? priceModel.price : priceModel.minPrice;
    }
    return price;
}

/**
 * Set Global-e sesson based on given valuse. This function is mostly used for price conversion in job processes
 * which execute outside of normal storefront session. For example,
 * @example
 * // set global-e session in job context
 * var globaleHelpers = require('{@literal *}/cartridge/scripts/helpers/globaleHelpers');
 * var globalePriceModel = require('{@literal *}/cartridge/scripts/factories/globale/priceModel');
 *
 * globaleHelpers.setSession('UA', 'UAH'); // setSession(countryCode, currencyCode);
 * var priceModel = globalePriceModel(product.priceModel, product);
 * var productPrice = priceModel.price;
 *
 * @param {string} countryCode The country code to set to the session
 * @param {string} currencyCode The currency code to set to the session
 */
function setSession(countryCode, currencyCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleCountryHelpers = require('*/cartridge/scripts/helpers/globaleCountryHelpers');
    var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleCountryCoefficient = require('*/cartridge/models/globale/countryCoefficient');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    // get Global-e AppSettings
    var geAppSettings = globaleHelpers.getGlobaleAppSettings();

    // get Global-e country
    var geCountry = geCountryMgr.getGECountry(countryCode).getCustom();

    // init Global-e session attributes
    globaleSession.setDefaults();
    globaleSession.set('geEnabled', true);
    globaleSession.set('geCountry', countryCode);
    globaleSession.set('geCountryName', geCountry.name);
    globaleSession.set('geCurrency', currencyCode || geCountry.defaultCurrencyCode);
    globaleSession.set('geOperatedCountry', geCountry.isOperatedByGlobalE);
    globaleSession.set('gePriceStrategy', globaleCountryHelpers.isFixedPriceStrategySupported(geAppSettings, geCountry) ? globaleHelpers.consts.priceStrategy.FIXED : globaleHelpers.consts.priceStrategy.DYNAMIC);
    globaleSession.set('geUseFixedPricesOnly', !!geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccUseFixedPricesOnly, false, 'boolean'));
    globaleSession.set('geUseCountryVAT', geCountry.useCountryVAT);
    globaleSession.set('geDefaultCountryVATRate', globaleCountryHelpers.getDefaultVATRateType(geCountry));
    globaleSession.set('geCountryCoefficientIncludeVAT', globaleCountryCoefficient.getIncludeVAT(countryCode));

    // update session pricebooks
    priceBookHelpers.updateApplicablePriceBooks(geCountry.isOperatedByGlobalE);
}

/**
 * Checking if we've reached the limits (API Quotas) for LineItemCtnr
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Order or Basket
 * @returns {boolean} - If it is true - then we have reached the limit
 */
function isNotesLimitReached(lineItemCtnr) {
    var Order = require('dw/order/Order');
    var Basket = require('dw/order/Basket');
    var defaultLimit = 0;
    if (lineItemCtnr instanceof Basket) {
        // Default Limit: 100 (warning at 60)
        defaultLimit = 99;
    } else if (lineItemCtnr instanceof Order) {
        // Default Limit: 1,000 (warning at 600)
        // We leave 100 in reserve, since "history entry" are also taken into account for the order.
        defaultLimit = 900;
    }
    // Checking if we can add another note
    if (lineItemCtnr.getNotes().size() < defaultLimit) {
        return false;
    }
    return true;
}

/**
 * Retrieves client settings
 * @returns {Object} - client settings
 */
function getClientSettings() {
    var logger = getLogger();
    var result = {};
    try {
        var globaleAppSettingsObj = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr').getGEAppSettings();
        var globaleAppSettings = globaleAppSettingsObj ? globaleAppSettingsObj.getCustom() : null;
        if (globaleAppSettings && globaleAppSettings.clientSettings) {
            result = globaleAppSettings.clientSettings;
        }
    } catch (e) {
        result = {};
        logger.error('GLOBALE_CLIENT_SETTINGS: {0}', logger.message(e));
    }
    return result;
}

/**
 * Apply searchable products promotion
 * @param {dw.catalog.SearchModel} apiProductSearch - SearchModel
 * @param {boolean} isExecuteSearch - allow/prevent executing 'search' method of 'dw.catalog.SearchModel' class
 * @returns {dw.catalog.SearchModel} SearchModel
 */
function applySearchableProductsPromotion(apiProductSearch, isExecuteSearch) {
    /**
     * It is possible to exclude Restricted or Forbidden products from search results
     * In the example below, the exclusion will be done by using the Promotion ID,
     * for example SearchableProducts_AU - will be applied only for Australia,
     * where all Restricted or Forbidden products will be added in 'Qualifying Products' => 'Excluding products',
     * so the promotion will have qualifying products but won't have any discounted products,
     * thus we can filter the search results but the promotional callout message won't be displayed on storefront.
     */
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry')) {
        return apiProductSearch;
    }
    var searchableProductsPromotionId = getPreference(preferenceKeys.geSearchableProductsPromotionId);
    var searchableProductsPromotion;
    if (searchableProductsPromotionId) {
        var PromotionMgr = require('dw/campaign/PromotionMgr');
        var collections = require('*/cartridge/scripts/util/globale/collections');
        searchableProductsPromotionId = searchableProductsPromotionId
            .replace(/\{country\}/ig, globaleSession.get('geCountry'))
            .replace(/\{currency\}/ig, globaleSession.get('geCurrency'));
        var applicablePromotions = PromotionMgr.getActiveCustomerPromotions().getProductPromotions();
        if (applicablePromotions && applicablePromotions.length > 0) {
            searchableProductsPromotion = collections.find(applicablePromotions, function (promotion) { return (promotion.ID === searchableProductsPromotionId); });
        }
        if (searchableProductsPromotion) {
            var ProductSearchModel = require('dw/catalog/ProductSearchModel');
            apiProductSearch.setPromotionID(searchableProductsPromotion.ID);
            apiProductSearch.setPromotionProductType(ProductSearchModel.PROMOTION_PRODUCT_TYPE_QUALIFYING);
            if (isExecuteSearch) {
                apiProductSearch.search();
            }
        }
    }
    return apiProductSearch;
}

/**
 * Returns cookie domain
 * @returns {string} - cookie domain
 * @example cookie domain configuration
 * {"defaultDomain":"www.example.com","en_GB":"www.example.uk"}
 */
function getCookieDomain() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var result = globaleRequest.get('httpHost');
    var locale = globaleRequest.get('locale');
    var cookieDomainConfig = getJSONPreference(preferenceKeys.geCookieDomain);

    // check cookie domain configuration
    if (cookieDomainConfig && (('defaultDomain' in cookieDomainConfig) || (locale in cookieDomainConfig))) {
        if ((locale in cookieDomainConfig) && cookieDomainConfig[locale]) {
            result = cookieDomainConfig[locale];
        } else if (('defaultDomain' in cookieDomainConfig) && cookieDomainConfig.defaultDomain) {
            result = cookieDomainConfig.defaultDomain;
        }
    }

    return result;
}

/**
 * Returns default country code
 * @returns {string|null} - default country code
 */
function getDefaultCountryCode() {
    var Site = require('dw/system/Site');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var locale = globaleRequest.get('locale');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var countryCodeMappingJSON = geAppSettingsMgr.getPlatformSetting(platformSettings.sfccDefaultCountryCodeMapping, {}, 'json');
    var siteCountryCodeConfig = countryCodeMappingJSON[Site.current.ID] || countryCodeMappingJSON.defaultSiteConfig;
    var countryCode = null;

    if (siteCountryCodeConfig && (('defaultCountryCode' in siteCountryCodeConfig) || (locale in siteCountryCodeConfig))) {
        if ((locale in siteCountryCodeConfig) && siteCountryCodeConfig[locale]) {
            countryCode = siteCountryCodeConfig[locale];
        } else if (('defaultCountryCode' in siteCountryCodeConfig) && siteCountryCodeConfig.defaultCountryCode) {
            countryCode = siteCountryCodeConfig.defaultCountryCode;
        }
    }

    return countryCode;
}

/**
 * Returns merchant base currency code
 * @returns {string} - merchant base currency code
 */
function getMerchantBaseCurrencyCode() {
    var Site = require('dw/system/Site');
    var Currency = require('dw/util/Currency');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var currencyCode = geAppSettingsMgr.getPlatformSetting(platformSettings.sfccMerchantBaseCurrencyCode, null, 'string');
    if (!currencyCode || !Currency.getCurrency(currencyCode)) {
        return Site.current.getDefaultCurrency();
    }

    return currencyCode;
}

/**
 * Retrieves Global-e Custom Object attribute value
 * @param {string} key - custom attribute key
 * @param {string} mappingKey - mapping key
 * @returns {Object|null} - The mapped value or null
 */
function getPreferenceMapVal(key, mappingKey) {
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var logger = getLogger();
    var result = null;
    try {
        var prefValue = geAppSettingsMgr.getPlatformSetting(key, {}, 'json');

        result = (prefValue && prefValue[mappingKey]) || null;
    } catch (e) {
        logger.error('GLOBALE_CLIENT_SETTINGS: {0}', logger.message(e));
    }
    return result;
}

/**
 * Checks is Native SFCC Gift Certificates enabled
 * @returns {boolean} - SFCC Gift Certificate enabled
 */
function isNativeGiftCertificateEnabled() {
    return getPreference(preferenceKeys.geEnableNativeGiftCertificates);
}

/**
 * Returns Global-e Klarna On-site messaging configurations
 * @returns {Object|null} - Klarna OSM configuration
 */
function getKlarnaConfigurations() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleSession = require('*/cartridge/models/globale/session');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');

    return geConfigurationMgr.getKlarnaConfigurations(globaleRequest.get('locale'), globaleSession.get('geCountry'));
}

/**
 * Retrieves a value from Global-e UrlParameters
 * @param {Object} urlParameters - UrlParameters from Global-e Payload
 * @param {string} key - UrlParameters key
 * @returns {string|null} - The value from UrlParameters or null
 */
function getUrlParametersValue(urlParameters, key) {
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var result = null;
    try {
        var geParams = JSON.parse(urlParameters);
        if (geParams && Array.isArray(geParams) && geParams.length > 0) {
            var resultParam = arrayUtils.find(geParams, function (param) {
                return param.Key === key;
            });
            result = resultParam ? resultParam.Value : null;
        }
    } catch (e) {
        // handle an error
    }

    return result;
}

module.exports = {
    paymentMethod: paymentMethod,
    salutation: salutation,
    customAttr: customAttr,
    preferenceKeys: preferenceKeys,
    customObjectKeys: customObjectKeys,
    consts: consts,
    services: services,
    cacheKeys: cacheKeys,
    hooks: hooks,
    platformSettings: platformSettings,
    getLogger: getLogger,
    getPreference: getPreference,
    setPreference: setPreference,
    getJSONPreference: getJSONPreference,
    getSetOfStringsPreferenceMapVal: getSetOfStringsPreferenceMapVal,
    getSystemPreference: getSystemPreference,
    isGlobaleEnabled: isGlobaleEnabled,
    isGlobaleRequest: isGlobaleRequest,
    getGlobaleAppSettings: getGlobaleAppSettings,
    getProductListPrice: getProductListPrice,
    getRootPriceBook: getRootPriceBook,
    setSession: setSession,
    isNotesLimitReached: isNotesLimitReached,
    getClientSettings: getClientSettings,
    applySearchableProductsPromotion: applySearchableProductsPromotion,
    getCookieDomain: getCookieDomain,
    getDefaultCountryCode: getDefaultCountryCode,
    getMerchantBaseCurrencyCode: getMerchantBaseCurrencyCode,
    getPreferenceMapVal: getPreferenceMapVal,
    isNativeGiftCertificateEnabled: isNativeGiftCertificateEnabled,
    getKlarnaConfigurations: getKlarnaConfigurations,
    getUrlParametersValue: getUrlParametersValue
};
