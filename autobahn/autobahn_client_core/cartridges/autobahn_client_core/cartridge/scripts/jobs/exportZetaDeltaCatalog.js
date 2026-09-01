'use strict';

var Status = require('dw/system/Status');
var ProductMgr = require('dw/catalog/ProductMgr');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var FileReader = require('dw/io/FileReader');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var zetaSFTPservice = require('*/cartridge/scripts/services/zetaSFTPservice');
var SFTPClient = require('dw/net/SFTPClient');
var Site = require('dw/system/Site');
var storefrontBaseUrl = Site.getCurrent().getCustomPreferenceValue('storefrontBaseUrl');
var fileUploadPath = "/file_share/product_data";
/**
 * Get last run time from file
 */

function getLastRunTime(filePath) {
    var file = new File(filePath);
    if (!file.exists()) {
        return new Date(0); // FIRST RUN
    }
    var reader = new FileReader(file);
    var content = reader.readString(); 
    reader.close();
    return content ? new Date(content.trim()) : new Date(0);
}

/**
 * Save last run time to file
 */
function saveLastRunTime(filePath, date) {
    var file = new File(filePath);
    var writer = new FileWriter(file, false); // overwrite
    writer.writeLine(date.toISOString());
    writer.close();
}

/**
 * Generate timestamp for file names
 */
function getTimeStamp() {
    var now = new Date();
    return now.getFullYear() + "-" +
        ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
        ("0" + now.getDate()).slice(-2) + "_" +
        ("0" + now.getHours()).slice(-2) + "-" +
        ("0" + now.getMinutes()).slice(-2);
}

/**
 * Main Export Function
 */
function exportZetaDeltaCatalog(args) {
    try {
        var isCompleteSync = args && (args.syncCompleteCatalog === true || args.syncCompleteCatalog === 'true');
        // Base Folder
        var baseFolder = new File(File.IMPEX + "/src/zeta/ProductFeed");
        if (!baseFolder.exists()) {
            baseFolder.mkdirs();
        }

        var deltaFolder = new File(baseFolder.fullPath + "/delta");
        if (!deltaFolder.exists()) {
            deltaFolder.mkdirs();
        }

        var fullFolder = new File(baseFolder.fullPath + "/completeCatalogSync");
        if (!fullFolder.exists()) {
            fullFolder.mkdirs();
        }

        var lastRunFilePath = baseFolder.fullPath + "/lastRun.txt";

        //Get last run time
        var lastRunTime = getLastRunTime(lastRunFilePath);
        var now = new Date();

        //Buffer (10 mins for frequent jobs)
        var bufferTime = new Date(lastRunTime.getTime() - (10 * 60 * 1000));

        // Detect FIRST RUN
        var isFirstRun = (lastRunTime.getTime() === 0);

        // File Name
        var timestamp = getTimeStamp();
        var exportFile;

        if (isFirstRun || isCompleteSync) {
            exportFile = new File(fullFolder.fullPath + "/Products_Catalog_full_" + timestamp + ".csv");
        } else {
            exportFile = new File(deltaFolder.fullPath + "/Products_Catalog_delta_" + timestamp + ".csv");
        }

        var writer = new CSVStreamWriter(new FileWriter(exportFile));

        //HEADERS
        writer.writeNext([
            "resource-id",
            "resource-type",
            "url",
            "title",
            "thumbnail",
            "product_activation_date",
            "product_name",
            "is_available",
            "product_description",
            "product_url",
            "product_code",
            "regular_price",
            "sale_price",
            "primary_category",
            "classification_subcategory",
            "brand",
            "image_url",
            "newarrivals",
            "bestsellers",
        ]);

        //PRICEBOOKS
        var mainPriceBook = PriceBookMgr.getPriceBook("wgaca-web-pricebook");
        var discountPriceBook = PriceBookMgr.getPriceBook("wgaca-discount-pricebook");

        var priceBookUpdated =
            (mainPriceBook && mainPriceBook.lastModified >= bufferTime) ||
            (discountPriceBook && discountPriceBook.lastModified >= bufferTime);

        //PRODUCTS LOOP
        var products = ProductMgr.queryAllSiteProducts();
        var exportCount = 0;

        while (products.hasNext()) {
            var product = products.next();

            // if (!product.online || !product.isProduct()) {
            //     continue;
            // }
            if (!product.isProduct()) {
                continue;
            }

            if (isFirstRun && !product.online) {
                continue;
            }

            //DELTA CONDITION (skip only if NOT first run)
            if (!isFirstRun && !isCompleteSync) {
                var isRecentlyModified = product.lastModified >= bufferTime;
            
                if (!isRecentlyModified && !priceBookUpdated) {
                    continue;
                }
            }

            var product_id = product.ID;

            var title = product.getName() || "";
            var description = product.getShortDescription() ?
                product.getShortDescription().toString() : "";

            var brand_value = product.brand || "";

            var pCategory = product.custom.pCategory || "";
            var subCategory = product.custom.pSubCategory || "";

            var activation_date = product.creationDate.toISOString();
            var is_available = product.availabilityModel.isOrderable();

            var product_url = URLUtils.url('Product-Show', 'pid', product_id).toString();
            var url = storefrontBaseUrl + product_url;

            var image =  product.getImage('large', 0);
            var thumbnailImage = image ? image.getURL().toString() : "";
            var thumbnail = thumbnailImage ? storefrontBaseUrl + thumbnailImage : "";
            var image_url = storefrontBaseUrl + thumbnailImage;

            var productPrice = product.getPriceModel();
            var standardPrice = productPrice.getPriceBookPrice('wgaca-web-pricebook');
            var discountPrice = productPrice.getPriceBookPrice('wgaca-discount-pricebook');

            var regular_price = standardPrice ? standardPrice.value : '';
            var sale_price = discountPrice ? discountPrice.value : '';
            var categories = product.getCategories().toArray();
            var hasNewArrivals = categories.some(function(cat) {
                return cat.ID === 'new-arrivals';
            });

            var hasBestSeller = categories.some(function(cat) {
                return cat.ID === 'edit-best-sellers';
            });

            //WRITE ROW
            writer.writeNext([
                product_id,
                "product",
                url,
                title,
                thumbnail,
                activation_date,
                title,
                is_available,
                description,
                url,
                product_id,
                regular_price,
                sale_price,
                pCategory,
                subCategory,
                brand_value,
                image_url,
                hasNewArrivals ? 'New Arrivals' : '',
                hasBestSeller ? 'Best Sellers' : '',
            ]);

            exportCount++;
        }

        products.close();
        writer.close();

        if (exportCount > 0 || isFirstRun) {

            zetaSFTPservice.uploadToZetaSFTP(exportFile, isFirstRun || isCompleteSync, fileUploadPath);
        
            // ONLY update lastRunTime if upload succeeds
            saveLastRunTime(lastRunFilePath, now);
        }

        //If no records in delta → delete file (optional)
        if (!isFirstRun && exportCount === 0) {
            exportFile.remove();
        } else {
            // Update last run time ONLY if success
            saveLastRunTime(lastRunFilePath, now);
        }

        return new Status(Status.OK, "OK", "Export completed. Records: " + exportCount);

    } catch (e) {
        return new Status(Status.ERROR, "ERROR", e.message);
    }
}

exports.exportZetaDeltaCatalog = exportZetaDeltaCatalog;