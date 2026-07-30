'use strict';

var GoogleMerchantConstants = require('*/cartridge/scripts/util/googlemerchantConstants');
var enumValue = require('dw/value/EnumValue');
var MarkupText = require('dw/content/MarkupText');
var MediaFile = require('dw/content/MediaFile');

/**
 * This Function generates header for csv file
 * @param {string} exportType Export Type Catalog or Inventory
 * @returns {Array} Header Values Array for CSV file
 */
function generateCSVHeader(exportType) {
    var csvHeaderArray = [];

    if (exportType === GoogleMerchantConstants.EXPORT_TYPE.CATALOG) {
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.ID);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.TITLE);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.DESCRIPTION);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.UPC); // GTIN header
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.IMAGE);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.PRODUCT_LINK);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.CATEGORY);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.BUNDLE);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.MASTER_PRODUCT_ID);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.BRAND);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.PRICE);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.SALEPRICE);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.AVAILABILITY_STATUS);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.INSTOCK_DATE);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.SIZE);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.COLOR);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.MATERIAL);
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.LENGTH); // integer only
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.WIDTH); // integer only
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.HEIGHT); // integer only
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.WEIGHT); // integer only
        csvHeaderArray.push(GoogleMerchantConstants.HEADER_VALUES.ADDTIONAL_IMAGE_LINKS);
    }

    return csvHeaderArray;
}


/**
 * Creates the Product's View Type Array
 * @param {Object} viewTypes View Type
 * @returns {Array} imageViewTypes
 */
function getImageViewTypes(viewTypes) {
    var LinkedHashSet = require('dw/util/LinkedHashSet');
    var ArrayList = require('dw/util/ArrayList');
    var viewTypesArr = viewTypes ? viewTypes.split(GoogleMerchantConstants.FILE_SEPARATOR) : [];
    var viewTypesSet = new LinkedHashSet(new ArrayList(viewTypesArr));
    viewTypesSet.add(GoogleMerchantConstants.IMAGE_TYPES.LARGE);
    viewTypesSet.add(GoogleMerchantConstants.IMAGE_TYPES.MEDIUM);
    viewTypesSet.add(GoogleMerchantConstants.IMAGE_TYPES.SMALL);
    return viewTypesSet.toArray();
}

/**
 * Calculates the Product's Image Absolute URL
 * @param {dw.catalog.Product} product - Product
 * @param {Object} options View Type
 * @returns {string|null} - Product's Image Absolute URL or null
 */
function getProductImage(product, options) {
    var imageTypes = options.viewTypes;
    var imageUrl = null;
    for (var index = 0; index < imageTypes.length; index++) {
        var productImage = product.getImage(imageTypes[index]);
        if (productImage) {
            imageUrl = productImage.getAbsURL().toString();
            break;
        }
    }
    return imageUrl;
}

/**
 * Gets Product Primary Category
 * @param {dw.catalog.Product} product - Product
 * @returns {string} Product's Primary Category Display Name
 */
function getPrimaryCategory(product) {
    var primaryCat = product.primaryCategory;
    if (primaryCat) {
        return primaryCat.displayName;
    } else if (product.isVariant()) {
        var pvm = product.variationModel;
        if (pvm) {
            var masterProduct = pvm.getMaster();
            var masterPrimaryCat = masterProduct.primaryCategory;
            return masterPrimaryCat ? masterPrimaryCat.displayName : '';
        }
    }
    return '';
}

/**
 * Gets Product Assigned Categories
 * @param {dw.catalog.Product} product - Product
 * @returns {string} Product's categories in JSON string
 */
function getOnlineSubCats(product) {
    var onlineCategories = product.getOnlineCategories();
    if (onlineCategories.length === 0) {
        if (product.isVariant()) {
            var pvm = product.variationModel;
            if (pvm) {
                var masterProduct = pvm.getMaster();
                onlineCategories = masterProduct.getOnlineCategories();
            }
        }
    }
    var catArray = [];
    var categoriesItr = onlineCategories.iterator();
    while (categoriesItr.hasNext()) {
        var category = categoriesItr.next();
        var categoryBreadcrumb = category.displayName;
        while (category.parent && category.parent.ID !== 'root') {
            category = category.parent;
            categoryBreadcrumb = categoryBreadcrumb + ' > ' + category.displayName;
        }
        catArray.push(categoryBreadcrumb);
    }
    return catArray.join(GoogleMerchantConstants.FILE_SEPARATOR);
}

/**
 * Return Master Product ID of the Variant
 * @param {dw.catalog.Product} product - Product
 * @returns {string} - Product's Master Id
 */
function getMasterID(product) {
    if (product.isVariant()) {
        var pvm = product.getVariationModel();
        return pvm ? pvm.getMaster().ID : '';
    }
    return '';
}

/**
 * Returns custom values of type object
 * @param {Object} customObj : Non primitive data type object.
 * @returns {Object} custom values
 */
function getCustomValues(customObj) {
    if (customObj instanceof enumValue || customObj instanceof MarkupText) { // Enum of strings display value only.
        return customObj.toString();
    } else if (customObj instanceof MediaFile) {
        return customObj.absURL.toString();
    } else if (Object.keys(customObj).length > 0) {
        var arr = [];
        Object.keys(customObj).forEach(function (key) {
            if (typeof customObj[key] !== 'function' && customObj.hasOwnProperty(key)) { // eslint-disable-line no-prototype-builtins
                arr.push(customObj[key].toString());
            }
        });
        return arr;
    }
    return customObj.toString();
}

/**
 * Returns all custom properties in JSON format
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} JSON of all the custom properties of product
 */
function getAllCustomProps(product) {
    var customJSON = {};
    Object.keys(product.custom).forEach(function (key) {
        if (typeof this.custom[key] !== 'function') {
            if (typeof this.custom[key] === 'object') {
                customJSON[key] = getCustomValues(this.custom[key]);
            } else {
                customJSON[key] = this.custom[key].toString();
            }
        }
    }, product);
    return JSON.stringify(customJSON);
}

/**
 * Returns All Variation Attributes
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} JSON of all the variation attributes and values of product
 */
function getAllVariationAttrs(product) {
    var customJSON = {};
    var pvm = product.getVariationModel();
    var variationAttrs = pvm ? pvm.productVariationAttributes : null;
    if (variationAttrs && (product.isVariant() || product.isVariationGroup())) {
        Object.keys(variationAttrs).forEach(function (key) {
            var varValue = this.getVariationValue(product, variationAttrs[key]);
            customJSON[variationAttrs[key].attributeID] = varValue ? varValue.displayValue : '';
        }, pvm);
        //return JSON.stringify(customJSON);
        return customJSON;
    } else if (variationAttrs && product.isMaster()) {
        Object.keys(variationAttrs).forEach(function (index1) {
            var attrValueArray = [];
            var attrValues = this.getAllValues(variationAttrs[index1]);
            Object.keys(attrValues).forEach(function (index2) {
                this.push(attrValues[index2].displayValue);
            }, attrValueArray);
            customJSON[variationAttrs[index1].attributeID] = attrValueArray.join(GoogleMerchantConstants.FILE_SEPARATOR);
        }, pvm);
        //return JSON.stringify(customJSON);
        return customJSON;
    }
    return '';
}

/**
 * Get Specific Variation Attribute [key]
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} JSON of all the variation attributes and values of product
 */
function getAttr(product, key, units) {
    var attrs = getAllVariationAttrs(product);
    var dimObj = GoogleMerchantConstants.DIMENSIONS;
    var integersOnly = Object.keys(dimObj).map(e => dimObj[e]);
    var value = '';
    if (!empty(attrs)) {
        Object.keys(attrs).forEach(attrKey => {
            if (attrKey == key) {
                if (integersOnly.includes(key)) {
                    value = /^\d+$/.test(attrs[key]) ? attrs[key] + ' ' + units : '';
                } else {
                    value = attrs[key];
                }
            }
        });
    }
    return value;
}

/**
 * Returns All Product Types
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} JSON of all applicable product types of product
 */
function getAllProductTypes(product) {
    var customJSON = {
        bundle: product.isBundle(),
        bundled: product.isBundled(),
        master: product.isMaster(),
        option: product.isOptionProduct(),
        set: product.isProductSet(),
        variant: product.isVariant(),
        variation_group: product.isVariationGroup()
    };
    customJSON.item = !customJSON.master && !customJSON.variant && !customJSON.set &&
        !customJSON.bundle && !customJSON.variation_group && !customJSON.option && !customJSON.bundled;

    return JSON.stringify(customJSON);
}

/**
 * Returns is_bundle
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} JSON of all applicable product types of product
 */
 function getProductBundle(product) {
    return product.isBundle();
}

/**
 * Returns All Product Images
 * @param {dw.catalog.Product} product - Product
 * @param {Object} options View Type
 * @returns {string} all images of product of default type large
 */
function getAllImages(product, options) {
    var imageTypes = options.viewTypes;
    var imageArray = [];
    var count = 0;
    for (var index = 0; index < imageTypes.length; index++) {
        var productImageList = product.getImages(imageTypes[index]);
        if (productImageList && productImageList.length > 0) {
            var productImageListItr = productImageList.iterator();
            while (productImageListItr.hasNext()) {
                var productImage = productImageListItr.next();
                imageArray.push(productImage.getAbsURL().toString());
                // Push only Top 10 images
                ++count;
                if (count === 10) {
                    break;
                }
            }
        }
        if (count === 10) {
            break;
        }
    }
    return imageArray.length > 0 ? imageArray.join(GoogleMerchantConstants.FILE_SEPARATOR) : '';
}

/**
 * Return Short and Long Description
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} JSON of Short and Long Description
 */
function getDescription(product) {
    /* var description = {
        short_description: (product.longDescription ? product.longDescription.toString() : ''),
        long_description: (product.shortDescription ? product.shortDescription.toString() : '')
    }; */
    return product.shortDescription ? product.shortDescription.toString() : '';
}

/**
 * Return Online Status
 * @param {dw.catalog.Product} product - Product
 * @returns {number} 0 or 1
 */
function getOnlineStatus(product) {
    var isOnline = product.online;
    if (isOnline) {
        if (product.isVariant()) {
            var pvm = product.variationModel;
            isOnline = pvm ? pvm.master.online : isOnline;
        }
    }
    return isOnline ? 1 : 0;
}

/**
 * Return Availability Status
 * @param {dw.catalog.Product} product - Product
 * @returns {number} 0 or 1
 */
function isOrderable(product) {
    var avm = product.availabilityModel;
    if (avm) {
        return avm.isOrderable() ? 1 : 0;
    }
    return 0;
}

/**
 * Return Preorder/Backorder Allocation
 * @param {dw.catalog.Product} product - Product
 * @returns {number} allocation
 */
function getPreorderBackorderAllocation(product) {
    var avm = product.availabilityModel;
    if (avm) {
        var inventoryRecord = avm.inventoryRecord;
        if (inventoryRecord && (inventoryRecord.isBackorderable() || inventoryRecord.isPreorderable())) {
            return inventoryRecord.getPreorderBackorderAllocation().value;
        }
    }
    return 0;
}

/**
 * Return Availability Status Message
 * @param {dw.catalog.Product} product - Product
 * @returns {string} instock || preorder || backorder || outofstock
 */
function getAvailabilityStatus(product) {
    var avm = product.availabilityModel;
    if (avm) {
        return avm.availabilityStatus;
    }
    var ProductAvailabilityModel = require('dw/catalog/ProductAvailabilityModel');
    return ProductAvailabilityModel.AVAILABILITY_STATUS_NOT_AVAILABLE;
}

/**
 * Return Product's ATS value
 * @param {dw.catalog.Product} product - Product
 * @returns {number} Product's ATS value
 */
function getATSValue(product) {
    var avm = product.availabilityModel;
    if (avm) {
        var inventoryRecord = avm.inventoryRecord;
        if (inventoryRecord && inventoryRecord.perpetual) {
            return 999999;
        } else if (inventoryRecord && inventoryRecord.ATS) {
            return inventoryRecord.ATS.value;
        }
    }
    return 0;
}

/**
 * Return Product's In Stock Date
 * @param {dw.catalog.Product} product - Product
 * @returns {string} Date String
 */
function getInStockDate(product) {
    var avm = product.availabilityModel;
    var inventoryRecord = avm.inventoryRecord;
    if (inventoryRecord && inventoryRecord.inStockDate) {
        return inventoryRecord.inStockDate.toDateString();
    }
    return '';
}

/**
 * Calculate Promo Price
 * @param {dw.catalog.Product} product - Product
 * @returns {number|string} N/A or Price
 */
function calculatePromoPrice(product) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promoPrice = 'N/A';
    var PROMOTION_CLASS_PRODUCT = require('dw/campaign/Promotion').PROMOTION_CLASS_PRODUCT;
    var promotions = PromotionMgr.getActivePromotions().getProductPromotions(product);
    var promoPriceArray = [];
    if (promotions && promotions.length > 0) {
        var promotionsItr = promotions.iterator();
        while (promotionsItr.hasNext()) {
            var promo = promotionsItr.next();
            if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(PROMOTION_CLASS_PRODUCT) &&
                (promo.isBasedOnCustomerGroups() && !promo.basedOnCoupons && !promo.basedOnSourceCodes)) {
                var promoPriceObj = {};
                var tempPrice = 0;
                if (product.optionProduct) {
                    tempPrice = promo.getPromotionalPrice(product, product.getOptionModel());
                } else {
                    tempPrice = promo.getPromotionalPrice(product);
                }
                promoPriceObj[promo.ID] = tempPrice > 0 ? tempPrice : 'N/A';
                promoPriceArray.push(promoPriceObj);
            }
        }
        return promoPriceArray.length > 0 ? JSON.stringify(promoPriceArray) : promoPrice;
    }
    return promoPrice;
}

/**
 * Calculate PriceBooks Price
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} Price Books Price
 */
function calculatePriceBookPrices(product) {
    var HashMap = require('dw/util/HashMap');
    var priceModel = product.priceModel;
    var priceInfos = priceModel.priceInfos;
    var priceBookMap = new HashMap();
    if (priceInfos) {
        var priceInfosItr = priceInfos.iterator();
        while (priceInfosItr.hasNext()) {
            var priceInfo = priceInfosItr.next();
            var priceBookPrice = {};
            var priceBook = priceInfo.priceBook;
            priceBookPrice[priceBook.ID] = priceInfo.price.value;
            priceBookMap.put(priceBook.ID, priceBookPrice);
            while (priceBook.parentPriceBook) {
                priceBookPrice = {};
                priceBook = priceBook.parentPriceBook;
                priceBookPrice[priceBook.ID] = priceModel.getPriceBookPrice(priceBook.ID).value;
                priceBookMap.put(priceBook.ID, priceBookPrice);
            }
        }
    }
    if (priceBookMap.values().length > 0) {
        return JSON.stringify(priceBookMap.values().toArray());
    }
    return 'N/A';
}

/**
 * Calculate All PriceBooks Price
 * @param {dw.catalog.Product} product - Product
 * @returns {JSON} Site ALL Price Books Price
 */
function calculateAllPriceBooksPrices(product) {
    var priceBookMgr = require('dw/catalog/PriceBookMgr');
    var priceModel = product.priceModel;
    var priceBookArray = [];
    var siteAllPriceBooks = priceBookMgr.getSitePriceBooks().iterator();
    while (siteAllPriceBooks.hasNext()) {
        var priceBook = siteAllPriceBooks.next();
        var priceBookPrice = {};
        priceBookPrice[priceBook.ID] = priceModel.getPriceBookPrice(priceBook.ID).value;
        priceBookArray.push(priceBookPrice);
    }
    //return priceBookArray.length > 0 ? JSON.stringify(priceBookArray) : 'N/A';
    return priceBookArray.length > 0 ? priceBookArray : '';
}

/**
 * Get USD list Price
 * @param {dw.catalog.Product} product - Product
 */
 function getListPrice(product, currencyCode) {
    var priceBookMgr = require('dw/catalog/PriceBookMgr');
    var priceModel = product.priceModel;
    var siteAllPriceBooks = priceBookMgr.getSitePriceBooks().iterator();
    var listPrice = '';

    while (siteAllPriceBooks.hasNext()) {
        var priceBook = siteAllPriceBooks.next();
        if (priceBook.currencyCode == currencyCode && !priceBook.parentPriceBook) {
            listPrice = priceModel.getPriceBookPrice(priceBook.ID).value;
        }
    }
    return listPrice != '0' ? listPrice + ' ' + currencyCode : '';
}

/**
 * Get USD Sale Price
 * @param {dw.catalog.Product} product - Product
 */
 function getSalePrice(product, currencyCode) {
    var priceBookMgr = require('dw/catalog/PriceBookMgr');
    var priceModel = product.priceModel;
    var siteAllPriceBooks = priceBookMgr.getSitePriceBooks().iterator();
    var salePrice = '';

    while (siteAllPriceBooks.hasNext()) {
        var priceBook = siteAllPriceBooks.next();
        if (priceBook.currencyCode == currencyCode && priceBook.parentPriceBook && priceBook.parentPriceBook.currencyCode == currencyCode) {
            salePrice = priceModel.getPriceBookPrice(priceBook.ID).value;
        }
    }
    return salePrice != '0' ? salePrice + ' ' + currencyCode : '';
}

/**
 * Sets locale of the request
 * @param {string} localeID to set
 */
function setLocale(localeID) {
    if (localeID) {
        var localeExist = false;
        var Site = require('dw/system/Site');
        var locales = Site.getCurrent().getAllowedLocales().iterator();
        while (locales.hasNext()) {
            var locale = locales.next();
            if (locale === localeID) {
                request.setLocale(localeID); // eslint-disable-line no-undef
                localeExist = true;
                break;
            }
        }
        if (!localeExist) {
            throw new Error('Locale ID does not exist');
        }
    }
}

module.exports = {
    generateCSVHeader: generateCSVHeader,
    getProductImage: getProductImage,
    getPrimaryCategory: getPrimaryCategory,
    getOnlineSubCats: getOnlineSubCats,
    getMasterID: getMasterID,
    getATSValue: getATSValue,
    getProductBundle: getProductBundle,
    getAttr: getAttr,
    getAllCustomProps: getAllCustomProps,
    getAllVariationAttrs: getAllVariationAttrs,
    getAllProductTypes: getAllProductTypes,
    getAllImages: getAllImages,
    getDescription: getDescription,
    getOnlineStatus: getOnlineStatus,
    isOrderable: isOrderable,
    getPreorderBackorderAllocation: getPreorderBackorderAllocation,
    getAvailabilityStatus: getAvailabilityStatus,
    getInStockDate: getInStockDate,
    calculatePromoPrice: calculatePromoPrice,
    calculatePriceBookPrices: calculatePriceBookPrices,
    calculateAllPriceBooksPrices: calculateAllPriceBooksPrices,
    getListPrice: getListPrice,
    getSalePrice: getSalePrice,
    setLocale: setLocale,
    getImageViewTypes: getImageViewTypes
};
