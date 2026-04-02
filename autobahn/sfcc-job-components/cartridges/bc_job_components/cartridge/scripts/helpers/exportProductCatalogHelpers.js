'use strict';

var PConstants = require('~/cartridge/scripts/util/exportProductCatalogConstants');
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

    if (exportType === PConstants.EXPORT_TYPE.CATALOG) {
        csvHeaderArray.push(PConstants.HEADER_VALUES.ID);
        csvHeaderArray.push(PConstants.HEADER_VALUES.PRODUCT_LINK);
        csvHeaderArray.push(PConstants.HEADER_VALUES.TITLE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.DESCRIPTION);
        csvHeaderArray.push(PConstants.HEADER_VALUES.SIZE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.IMAGE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.PRICE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.BRAND);
        csvHeaderArray.push(PConstants.HEADER_VALUES.AVAILABILITY_STATUS);
        csvHeaderArray.push(PConstants.HEADER_VALUES.GENDER);
        csvHeaderArray.push(PConstants.HEADER_VALUES.PRIMARY_CATEGORY);
        csvHeaderArray.push(PConstants.HEADER_VALUES.MODEL);
        csvHeaderArray.push(PConstants.HEADER_VALUES.LAUNCHDATE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.MATERIAL);
        csvHeaderArray.push(PConstants.HEADER_VALUES.COLOR);
        csvHeaderArray.push(PConstants.HEADER_VALUES.CLOSURE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.LOCATION);
        csvHeaderArray.push(PConstants.HEADER_VALUES.CONDITION);
        csvHeaderArray.push(PConstants.HEADER_VALUES.CATEGORY);
        csvHeaderArray.push(PConstants.HEADER_VALUES.SALE_PRICE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.SEARCHABLE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.SEARCHABLE_IF_UNAVAILABLE);
        csvHeaderArray.push(PConstants.HEADER_VALUES.ONLINE);
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
    var viewTypesArr = viewTypes ? viewTypes.split(PConstants.FILE_SEPARATOR) : [];
    var viewTypesSet = new LinkedHashSet(new ArrayList(viewTypesArr));
    viewTypesSet.add(PConstants.IMAGE_TYPES.LARGE);
    viewTypesSet.add(PConstants.IMAGE_TYPES.MEDIUM);
    viewTypesSet.add(PConstants.IMAGE_TYPES.SMALL);
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
            imageUrl = 'https://www.whatgoesaroundnyc.com'+productImage.url;
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
            categoryBreadcrumb = categoryBreadcrumb;
        }
        catArray.push(categoryBreadcrumb);
    }
    return catArray.join(PConstants.FILE_SEPARATOR);
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
 * Return Location
 * @param {dw.catalog.Product} product - Product
 * @returns {string} Location
 */
function getLocation(product) {
    var location = (product.custom.location && product.custom.location.length > 0) ? product.custom.location[0].value : '';
    return location;
}

/**
 * Return Condition
 * @param {dw.catalog.Product} product - Product
 * @returns {string} Condition
 */
function getCondition(product) {
    var headlineDescription = product.custom.headlineDescription;
    var condition ='';
    if (headlineDescription.markup.toLowerCase().indexOf('flawed gem condition') !== -1) {
        condition = 'flawed gem';
    } else if (headlineDescription.markup.toLowerCase().indexOf('pristine condition') !== -1) {
        condition = 'pristine';
    } else if (headlineDescription.markup.toLowerCase().indexOf('excellent condition') !== -1) {
        condition = 'excellent';
    } else if (headlineDescription.markup.toLowerCase().indexOf('very good condition') !== -1) {
        condition = 'very good';
    } else if (headlineDescription.markup.toLowerCase().indexOf('good condition') !== -1) {
        condition = 'good';
    }
    return condition;
}

/**
 * Return WebPrice
 * @param {dw.catalog.Product} product - Product
 * @returns {string} WebPrice
 */
function getWebPrice(product) {
    var productPrice = product.getPriceModel();
    var webPricebook = 'wgaca-web-pricebook';
    var webPrice = productPrice.getPriceBookPrice(webPricebook);
    var webPriceValue = (webPrice && webPrice.value !== 0) ? webPrice.value : '';
    return webPriceValue;
}

/**
 * Return SalePrice
 * @param {dw.catalog.Product} product - Product
 * @returns {string} SalePrice
 */
function getSalePrice(product) {
    var productPrice = product.getPriceModel();
    var salePricebook = 'wgaca-discount-pricebook';
    var salePrice = productPrice.getPriceBookPrice(salePricebook);
    var salePriceValue = (salePrice && salePrice.value !== 0) ? salePrice.value : '';
    return salePriceValue;
}

/**
 * Return Product's In Stock Date
 * @param {dw.catalog.Product} product - Product
 * @returns {string} Date String
 */
function getInStockDate(product) {
    var creationDate = product.creationDate;
    if (creationDate) {
        var date = creationDate;
        var year = date.getFullYear();
        var month = (1 + date.getMonth()).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        var formattedDate = day + '-' + month + '-' + year;
        return formattedDate;
    }
    return '';
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
    isOrderable: isOrderable,
    getAvailabilityStatus: getAvailabilityStatus,
    getInStockDate: getInStockDate,
    setLocale: setLocale,
    getImageViewTypes: getImageViewTypes,
    getLocation: getLocation,
    getCondition: getCondition,
    getSalePrice: getSalePrice,
    getWebPrice: getWebPrice
};
