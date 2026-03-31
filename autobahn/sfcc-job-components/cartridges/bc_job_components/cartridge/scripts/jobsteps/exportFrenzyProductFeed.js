/* Feedonomics Product Export Job */
'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var system = require('dw/system/System');

var frenzyHelpers = require('~/cartridge/scripts/helpers/frenzyHelpers');
var FileUtils = require('~/cartridge/scripts/util/fileUtils');
var FConstants = require('~/cartridge/scripts/util/frenzyConstants');

var productsIter;
var fileWriter;
var headerColumn;
var csvWriter;
var chunks = 0;
var processedAll = true;
var skipMaster = false;
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
        case FConstants.HEADER_VALUES.ID:
            csvProductArray.push(product.ID || '');
            break;
        // Product Link
        case FConstants.HEADER_VALUES.PRODUCT_LINK:
            var URLUtils = require('dw/web/URLUtils');
            var absURL = URLUtils.abs('Product-Show', 'pid', product.ID).toString();
            if (system.getInstanceType() === system.PRODUCTION_SYSTEM) {
                absURL = absURL.replace('https://production-na01-whatgoesaroundcomesaround.demandware.net/s/WGACA/', 'https://www.whatgoesaroundnyc.com/');
            } else if (system.getInstanceType() === system.STAGING_SYSTEM) {
                absURL = absURL.replace('https://staging-na01-whatgoesaroundcomesaround.demandware.net/s/WGACA/', 'https://www.whatgoesaroundnyc.com/');
            } else if (system.getInstanceType() === system.DEVELOPMENT_SYSTEM) {
                absURL = absURL.replace('https://development-na01-whatgoesaroundcomesaround.demandware.net/s/WGACA/', 'https://www.whatgoesaroundnyc.com/');
            }
            csvProductArray.push(absURL);
            break;
        // Product Page Title
        case FConstants.HEADER_VALUES.TITLE:
            // AB Update
            csvProductArray.push(product.name || '');
            break;
        // Product Description
        case FConstants.HEADER_VALUES.DESCRIPTION: {
            const desc = product.custom.headlineDescription;
            csvProductArray.push(
                (desc === null || desc === undefined || desc === '')
                    ? ''
                    : desc.toString()
            );     
            break;
        }
        // Product SIZE
        case FConstants.HEADER_VALUES.SIZE:
            csvProductArray.push(product.custom.size || 'one size');
            break;
        // Product Image
        case FConstants.HEADER_VALUES.IMAGE:
            csvProductArray.push(frenzyHelpers.getProductImage(product, options) || '');
            break;
        // Product's Base Price
        case FConstants.HEADER_VALUES.PRICE:
            csvProductArray.push(frenzyHelpers.getWebPrice(product));
            break;
        // Product's Brand
        case FConstants.HEADER_VALUES.BRAND:
            csvProductArray.push(product.brand);
            break;
        // Product's Availability Status
        case FConstants.HEADER_VALUES.AVAILABILITY_STATUS:
            var availabilityStatus = frenzyHelpers.getAvailabilityStatus(product);
            var status;
            if (availabilityStatus == 'NOT_AVAILABLE') {
                status = 'FALSE';
            } else if (availabilityStatus == 'IN_STOCK') {
                status = 'TRUE';
            }
            csvProductArray.push(status);
            break;
        // Product GENDER
        case FConstants.HEADER_VALUES.GENDER:
            csvProductArray.push(product.custom.fdxGender || 'unisex');
            break;
        // Product Primary Category
        case FConstants.HEADER_VALUES.PRIMARY_CATEGORY:
            csvProductArray.push(frenzyHelpers.getPrimaryCategory(product));
            break;
        // Product MODEL
        case FConstants.HEADER_VALUES.MODEL:
            csvProductArray.push(product.ID || '');
            break;
        // Product LAUNCHDATE
        case FConstants.HEADER_VALUES.LAUNCHDATE:
            csvProductArray.push(frenzyHelpers.getInStockDate(product));
            break;
        // Product MATERIAL
        case FConstants.HEADER_VALUES.MATERIAL:
            csvProductArray.push(product.custom.material || '');
            break;
        // Product COLOR
        case FConstants.HEADER_VALUES.COLOR:
            csvProductArray.push(product.custom.color || '');
            break;
        // Product CLOSURE
        case FConstants.HEADER_VALUES.CLOSURE:
            csvProductArray.push(product.custom.closure || '');
            break;
        // Product LOCATION
        case FConstants.HEADER_VALUES.LOCATION:
            csvProductArray.push(frenzyHelpers.getLocation(product));
            break;
        // Product CONDITION
        case FConstants.HEADER_VALUES.CONDITION:
            csvProductArray.push(frenzyHelpers.getCondition(product));
            break;
        // Product Categories
        case FConstants.HEADER_VALUES.CATEGORY:
            csvProductArray.push(frenzyHelpers.getOnlineSubCats(product));
            break;
        // Product SALE_PRICE
        case FConstants.HEADER_VALUES.SALE_PRICE:
            csvProductArray.push(frenzyHelpers.getSalePrice(product));
            break;
        // Product SEARCHABLE
        case FConstants.HEADER_VALUES.SEARCHABLE:
            csvProductArray.push(product.searchable || '');
            break;
        // Product SEARCHABLE_IF_UNAVAILABLE
        case FConstants.HEADER_VALUES.SEARCHABLE_IF_UNAVAILABLE:
            csvProductArray.push(product.searchableIfUnavailableFlag || '');
            break;
        // Product ONLINE
        case FConstants.HEADER_VALUES.ONLINE:
            csvProductArray.push(product.onlineFlag || '');
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

    var targetFolder = args.TargetFolder;

    frenzyHelpers.setLocale(args.LocaleID);

    if (!targetFolder) {
        throw new Error('One or more mandatory parameters are missing.');
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
    options.viewTypes = frenzyHelpers.getImageViewTypes(args.ImageViewTypes);

    var FileWriter = require('dw/io/FileWriter');
    var CSVStreamWriter = require('dw/io/CSVStreamWriter');
    var fileName = FileUtils.createFileName((args.FileNamePrefix || FConstants.FILE_NAME.CATALOG));
    var folderFile = new File(File.getRootDirectory(File.IMPEX), targetFolder);
    if (!folderFile.exists() && !folderFile.mkdirs()) {
        Logger.info('Cannot create IMPEX folders {0}', (File.getRootDirectory(File.IMPEX).fullPath + targetFolder));
        throw new Error('Cannot create IMPEX folders.');
    }
    var csvFile = new File(folderFile.fullPath + File.SEPARATOR + fileName);
    fileWriter = new FileWriter(csvFile);
    csvWriter = new CSVStreamWriter(fileWriter);
    // Push Header
    headerColumn = frenzyHelpers.generateCSVHeader(FConstants.EXPORT_TYPE.CATALOG);
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
        if ((!onlineOnly || product.isOnline()) && (!skipMaster || !product.isMaster())
            && (!availableOnly || frenzyHelpers.isOrderable(product))) {
            var csvProductArray = [];
            headerColumn.forEach(function (columnValue) { // eslint-disable-line
                writeProductExportField(this, csvProductArray, columnValue);
            }, product);
            return csvProductArray;
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
