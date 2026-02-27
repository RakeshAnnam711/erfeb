/* GoogleMerchant Product Export Job */
'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');

var GoogleMerchantHelpers = require('*/cartridge/scripts/helpers/googlemerchantHelpers');
var FileUtils = require('*/cartridge/scripts/util/googlemerchantFileUtils');
var GoogleMerchantConstants = require('*/cartridge/scripts/util/googlemerchantConstants');
var StepUtil = require('*/cartridge/scripts/util/StepUtil');

var productsIter;
var fileWriter;
var headerColumn;
var csvWriter;
var chunks = 0;
var processedAll = true;
var skipMaster = false;
var currencyCode = GoogleMerchantConstants.CURRENCYCODE;
var units = GoogleMerchantConstants.UNITS.INCHES;
var availableOnly = false;
var onlineOnly = false;
var options = {}; // Product Data Options

/**
 * Adds the column value to the CSV line Array of Product Feed export CSV file
 * @param {dw.catalog.Product} product - SFCC Product
 * @param {Array} csvProductArray - CSV  Array
 * @param {Object} columnValue - Catalog Feed Column
 */
function writeProductExportField(product, csvProductArray, columnValue) {

    switch (columnValue) {
        // Product ID
        case GoogleMerchantConstants.HEADER_VALUES.ID:
            csvProductArray.push(product.ID || '');
            break;
        // Product Page Title
        case GoogleMerchantConstants.HEADER_VALUES.TITLE:
            csvProductArray.push(product.name || '');
            break;
        // Product Description
        case GoogleMerchantConstants.HEADER_VALUES.DESCRIPTION:
            csvProductArray.push(GoogleMerchantHelpers.getDescription(product));
            break;
        // Product UPC
        case GoogleMerchantConstants.HEADER_VALUES.UPC:
            csvProductArray.push(product.UPC || '');
            break;
        // Product Image
        case GoogleMerchantConstants.HEADER_VALUES.IMAGE:
            csvProductArray.push(GoogleMerchantHelpers.getProductImage(product, options) || '');
            break;
        // Product Link
        case GoogleMerchantConstants.HEADER_VALUES.PRODUCT_LINK:
            var URLUtils = require('dw/web/URLUtils');
            csvProductArray.push(URLUtils.abs('Product-Show', 'pid', product.ID).toString());
            break;
        // Product Categories
        case GoogleMerchantConstants.HEADER_VALUES.CATEGORY:
            csvProductArray.push(GoogleMerchantHelpers.getOnlineSubCats(product));
            break;
        // Product's Master Product ID
        case GoogleMerchantConstants.HEADER_VALUES.MASTER_PRODUCT_ID:
            csvProductArray.push(GoogleMerchantHelpers.getMasterID(product));
            break;
        // Check if product is a bundle
        case GoogleMerchantConstants.HEADER_VALUES.BUNDLE:
            csvProductArray.push(GoogleMerchantHelpers.getProductBundle(product));
            break;
        // Product's Brand
        case GoogleMerchantConstants.HEADER_VALUES.BRAND:
            csvProductArray.push(product.brand);
            break;
        // Product's Base Price
        case GoogleMerchantConstants.HEADER_VALUES.PRICE:
            csvProductArray.push(GoogleMerchantHelpers.getListPrice(product, currencyCode));
            break;
        // Product's Sale Price
        case GoogleMerchantConstants.HEADER_VALUES.SALEPRICE:
            csvProductArray.push(GoogleMerchantHelpers.getSalePrice(product, currencyCode));
            break;
        // Product's ATS value
        case GoogleMerchantConstants.HEADER_VALUES.INVENTORY:
            csvProductArray.push(GoogleMerchantHelpers.getATSValue(product));
            break;
        // Product's In Stock Status
        case GoogleMerchantConstants.HEADER_VALUES.IN_STOCK:
            csvProductArray.push(GoogleMerchantHelpers.isOrderable(product));
            break;
        // Product's Availability Status
        case GoogleMerchantConstants.HEADER_VALUES.AVAILABILITY_STATUS:
            csvProductArray.push(GoogleMerchantHelpers.getAvailabilityStatus(product));
            break;
        // Product's Variation Attributes
        case GoogleMerchantConstants.HEADER_VALUES.SIZE:
            csvProductArray.push(GoogleMerchantHelpers.getAttr(product, GoogleMerchantConstants.ATTRIBUTES.SIZE));
            break;
        case GoogleMerchantConstants.HEADER_VALUES.COLOR:
            csvProductArray.push(GoogleMerchantHelpers.getAttr(product, GoogleMerchantConstants.ATTRIBUTES.COLOR));
            break;
        case GoogleMerchantConstants.HEADER_VALUES.MATERIAL:
            csvProductArray.push(GoogleMerchantHelpers.getAttr(product, GoogleMerchantConstants.ATTRIBUTES.MATERIAL));
            break;
        case GoogleMerchantConstants.HEADER_VALUES.LENGTH:
            csvProductArray.push(GoogleMerchantHelpers.getAttr(product, GoogleMerchantConstants.DIMENSIONS.LENGTH, units));
            break;
        case GoogleMerchantConstants.HEADER_VALUES.WIDTH:
            csvProductArray.push(GoogleMerchantHelpers.getAttr(product, GoogleMerchantConstants.DIMENSIONS.WIDTH, units));
            break;
        case GoogleMerchantConstants.HEADER_VALUES.HEIGHT:
            csvProductArray.push(GoogleMerchantHelpers.getAttr(product, GoogleMerchantConstants.DIMENSIONS.HEIGHT, units));
            break;
        case GoogleMerchantConstants.HEADER_VALUES.WEIGHT:
            csvProductArray.push('weight' in product.custom && product.custom.weight ? product.custom.weight + ' ' + GoogleMerchantConstants.UNITS.LB : '');
            break;
        // Product's Top 10 Images
        case GoogleMerchantConstants.HEADER_VALUES.ADDTIONAL_IMAGE_LINKS:
            csvProductArray.push(GoogleMerchantHelpers.getAllImages(product, options));
            break;
        default:
            csvProductArray.push('');
            break;
    }
}

/**
 * Executed Before Processing of Chunk and Validates all required fields
 */
exports.beforeStep = function () {
    var args = arguments[0];

    var targetFolder = dw.system.Site.current.getCustomPreferenceValue('googleMerchantProductFeedFileLocation');
    targetFolder = StepUtil.replacePathPlaceholders(targetFolder);

    GoogleMerchantHelpers.setLocale(args.LocaleID);

    if (!targetFolder) {
        throw new Error('One or more mandatory parameters are missing.');
    }

    if (args.CurrencyCode) {
        currencyCode = args.CurrencyCode.toUpperCase();
    }

    if (args.UnitsInInches) {
        units = GoogleMerchantConstants.UNITS.INCHES;
    } else {
        units = GoogleMerchantConstants.UNITS.CENTIMETERS;
    }

    if (args.SkipMaster) {
        skipMaster = args.SkipMaster;
    }

    if (args.AvailableOnly) {
        availableOnly = args.AvailableOnly;
    }

    if (args.OnlineOnly) {
        onlineOnly = args.OnlineOnly;
    }

    // Set Image View Types
    options.viewTypes = GoogleMerchantHelpers.getImageViewTypes(args.ImageViewTypes);

    var FileWriter = require('dw/io/FileWriter');
    var CSVStreamWriter = require('dw/io/CSVStreamWriter');
    var fileName = FileUtils.createFileName(GoogleMerchantConstants.FILE_NAME.CATALOG);
    var folderFile = new File(targetFolder);
    if (!folderFile.exists() && !folderFile.mkdirs()) {
        Logger.info('Cannot create folders {0}', targetFolder);
        throw new Error('Cannot create folders.');
    }
    var csvFile = new File(folderFile.fullPath + File.SEPARATOR + fileName);
    fileWriter = new FileWriter(csvFile);
    csvWriter = new CSVStreamWriter(fileWriter, args.Delimiter);
    // Push Header
    headerColumn = GoogleMerchantHelpers.generateCSVHeader(GoogleMerchantConstants.EXPORT_TYPE.CATALOG);
    csvWriter.writeNext(headerColumn);
    // Push Products
    var ProductMgr = require('dw/catalog/ProductMgr');
    productsIter = ProductMgr.queryAllSiteProducts();
};

/**
 * Executed Before Processing of Chunk and Return total products processed
 * @returns {number} products count
 */
exports.getTotalCount = function () {
    Logger.info('Processed products {0}', productsIter.count);
    return productsIter.count;
};

/**
 * Returns a single product to processed
 * @returns {dw.catalog.Product} product - Product
 */
exports.read = function () { // eslint-disable-line consistent-return
    if (productsIter.hasNext()) {
        return productsIter.next();
    }
};

/**
 * Process product and returns required field in array
 * @param {dw.catalog.Product} product - Product
 * @returns {Array} csvProductArray : Product Details
 */
exports.process = function (product) { // eslint-disable-line consistent-return
    try {
        if ((!onlineOnly || product.isOnline())
            && (!skipMaster || !product.isMaster())
            && (!availableOnly || GoogleMerchantHelpers.isOrderable(product))) {
            var csvProductArray = [];
            headerColumn.forEach(function (columnValue) { // eslint-disable-line
                writeProductExportField(this, csvProductArray, columnValue);
            }, product);

            // Ensures that fields that may contain extra lines (html bodies) are all compresses to a single line
            // Otherwise the google csv validator will fail
            return csvProductArray.map(function (col) {
                return (empty(col) ? '' : col.toString()).replace(/\r\n/g, '')
            });
        }
    } catch (ex) {
        processedAll = false;
        Logger.info('Not able to process product {0} having error : {1}', product.ID, ex.toString());
    }
};

/**
 * Writes a single product to file
 * @param {dw.util.List} lines to write
 */
exports.write = function (lines) {
    for (var i = 0; i < lines.size(); i++) {
        csvWriter.writeNext(lines.get(i).toArray());
    }
};

/**
 * Executes after processing of every chunk
 */
exports.afterChunk = function () {
    chunks++;
    Logger.info('Chunk {0} processed successfully', chunks);
};

/**
 * Executes after processing all the chunk and returns the status
 * @returns {Object} OK || ERROR
 */
exports.afterStep = function () {
    productsIter.close();
    fileWriter.flush();
    csvWriter.close();
    fileWriter.close();
    if (processedAll) {
        Logger.info('Export Product Feed Successful');
        return new Status(Status.OK, 'OK', 'Export Product Feed Successful');
    }
    throw new Error('Could not process all the products');
};
